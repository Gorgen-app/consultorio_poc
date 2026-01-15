#!/usr/bin/env python3
"""
Script para identificar pacientes duplicados na base de dados.
Critérios de duplicata:
1. Mesmo nome (normalizado) + mesmo CPF (quando preenchido)
2. Mesmo nome (normalizado) + mesma data de nascimento (quando preenchida)
"""

import os
import re
import json
from urllib.parse import urlparse
import mysql.connector
from collections import defaultdict
from datetime import datetime

def get_db_config():
    """Extrai configuração do banco a partir de DATABASE_URL"""
    url = os.environ.get('DATABASE_URL', '')
    if not url:
        raise ValueError("DATABASE_URL não definida")
    
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 3306,
        'user': parsed.username,
        'password': parsed.password,
        'database': parsed.path.lstrip('/').split('?')[0],
        'ssl_disabled': False
    }

def normalize_name(name):
    """Normaliza nome para comparação (lowercase, sem acentos, sem espaços extras)"""
    if not name:
        return ""
    
    # Converter para minúsculas
    name = name.lower().strip()
    
    # Remover acentos
    replacements = {
        'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n'
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    # Remover caracteres especiais e múltiplos espaços
    name = re.sub(r'[^a-z0-9\s]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name

def normalize_cpf(cpf):
    """Normaliza CPF removendo pontos e traços"""
    if not cpf:
        return ""
    return re.sub(r'[^0-9]', '', str(cpf))

def main():
    print("=" * 60)
    print("ANÁLISE DE DUPLICATAS DE PACIENTES")
    print("=" * 60)
    print()
    
    # Conectar ao banco
    config = get_db_config()
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor(dictionary=True)
    
    # Buscar todos os pacientes ativos
    print("Buscando pacientes no banco de dados...")
    cursor.execute("""
        SELECT 
            id,
            id_paciente,
            nome,
            cpf,
            data_nascimento,
            email,
            telefone,
            convenio,
            created_at
        FROM pacientes 
        WHERE deleted_at IS NULL
        ORDER BY nome, created_at
    """)
    
    pacientes = cursor.fetchall()
    print(f"Total de pacientes ativos: {len(pacientes)}")
    print()
    
    # Dicionários para agrupar duplicatas
    duplicatas_nome_cpf = defaultdict(list)
    duplicatas_nome_nascimento = defaultdict(list)
    
    # Processar cada paciente
    for p in pacientes:
        nome_norm = normalize_name(p['nome'])
        cpf_norm = normalize_cpf(p['cpf'])
        data_nasc = p['data_nascimento']
        
        # Agrupar por nome + CPF (quando CPF existe)
        if cpf_norm and len(cpf_norm) >= 11:
            key_cpf = f"{nome_norm}|{cpf_norm}"
            duplicatas_nome_cpf[key_cpf].append(p)
        
        # Agrupar por nome + data de nascimento (quando data existe)
        if data_nasc:
            data_str = data_nasc.strftime('%Y-%m-%d') if isinstance(data_nasc, datetime) else str(data_nasc)
            key_nasc = f"{nome_norm}|{data_str}"
            duplicatas_nome_nascimento[key_nasc].append(p)
    
    # Filtrar apenas grupos com mais de 1 paciente (duplicatas)
    dup_cpf = {k: v for k, v in duplicatas_nome_cpf.items() if len(v) > 1}
    dup_nasc = {k: v for k, v in duplicatas_nome_nascimento.items() if len(v) > 1}
    
    # Consolidar duplicatas únicas (evitar contar o mesmo par duas vezes)
    todos_ids_duplicados = set()
    grupos_duplicatas = []
    
    # Processar duplicatas por CPF
    for key, pacientes_grupo in dup_cpf.items():
        ids = tuple(sorted([p['id'] for p in pacientes_grupo]))
        if ids not in todos_ids_duplicados:
            todos_ids_duplicados.add(ids)
            grupos_duplicatas.append({
                'tipo': 'CPF',
                'criterio': key,
                'pacientes': pacientes_grupo
            })
    
    # Processar duplicatas por data de nascimento
    for key, pacientes_grupo in dup_nasc.items():
        ids = tuple(sorted([p['id'] for p in pacientes_grupo]))
        # Verificar se já não foi identificado pelo CPF
        ja_identificado = False
        for grupo in grupos_duplicatas:
            grupo_ids = tuple(sorted([p['id'] for p in grupo['pacientes']]))
            if ids == grupo_ids:
                ja_identificado = True
                grupo['tipo'] = 'CPF + Data Nascimento'
                break
        
        if not ja_identificado:
            grupos_duplicatas.append({
                'tipo': 'Data Nascimento',
                'criterio': key,
                'pacientes': pacientes_grupo
            })
    
    # Estatísticas
    print("=" * 60)
    print("RESULTADOS")
    print("=" * 60)
    print()
    print(f"Duplicatas por Nome + CPF: {len(dup_cpf)} grupos")
    print(f"Duplicatas por Nome + Data Nascimento: {len(dup_nasc)} grupos")
    print(f"Total de grupos de duplicatas únicos: {len(grupos_duplicatas)}")
    print()
    
    # Contar pacientes envolvidos
    pacientes_duplicados = set()
    for grupo in grupos_duplicatas:
        for p in grupo['pacientes']:
            pacientes_duplicados.add(p['id'])
    
    print(f"Total de pacientes envolvidos em duplicatas: {len(pacientes_duplicados)}")
    print()
    
    # Gerar relatório detalhado
    relatorio = []
    
    for i, grupo in enumerate(grupos_duplicatas, 1):
        grupo_info = {
            'grupo': i,
            'tipo_duplicata': grupo['tipo'],
            'quantidade': len(grupo['pacientes']),
            'pacientes': []
        }
        
        for p in grupo['pacientes']:
            paciente_info = {
                'id': p['id'],
                'id_paciente': p['id_paciente'],
                'nome': p['nome'],
                'cpf': p['cpf'] or '',
                'data_nascimento': str(p['data_nascimento']) if p['data_nascimento'] else '',
                'email': p['email'] or '',
                'telefone': p['telefone'] or '',
                'convenio': p['convenio'] or '',
                'created_at': str(p['created_at']) if p['created_at'] else ''
            }
            grupo_info['pacientes'].append(paciente_info)
        
        relatorio.append(grupo_info)
    
    # Salvar relatório JSON
    output_json = '/home/ubuntu/consultorio_poc/data/duplicatas_pacientes.json'
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(relatorio, f, ensure_ascii=False, indent=2)
    print(f"Relatório JSON salvo em: {output_json}")
    
    # Gerar relatório em texto para revisão
    output_txt = '/home/ubuntu/consultorio_poc/data/duplicatas_pacientes.txt'
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("RELATÓRIO DE PACIENTES DUPLICADOS - GORGEN\n")
        f.write(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"Total de grupos de duplicatas: {len(grupos_duplicatas)}\n")
        f.write(f"Total de pacientes envolvidos: {len(pacientes_duplicados)}\n\n")
        
        f.write("-" * 80 + "\n\n")
        
        for grupo in relatorio:
            f.write(f"GRUPO {grupo['grupo']} - Tipo: {grupo['tipo_duplicata']}\n")
            f.write("-" * 40 + "\n")
            
            for p in grupo['pacientes']:
                f.write(f"  ID: {p['id_paciente']}\n")
                f.write(f"  Nome: {p['nome']}\n")
                f.write(f"  CPF: {p['cpf'] or 'Não informado'}\n")
                f.write(f"  Data Nasc.: {p['data_nascimento'] or 'Não informada'}\n")
                f.write(f"  Email: {p['email'] or 'Não informado'}\n")
                f.write(f"  Telefone: {p['telefone'] or 'Não informado'}\n")
                f.write(f"  Convênio: {p['convenio'] or 'Não informado'}\n")
                f.write(f"  Cadastrado em: {p['created_at']}\n")
                f.write("\n")
            
            f.write("-" * 80 + "\n\n")
    
    print(f"Relatório TXT salvo em: {output_txt}")
    
    # Exibir primeiros grupos como amostra
    print()
    print("=" * 60)
    print("AMOSTRA DOS PRIMEIROS 10 GRUPOS DE DUPLICATAS")
    print("=" * 60)
    
    for grupo in relatorio[:10]:
        print(f"\nGRUPO {grupo['grupo']} ({grupo['tipo_duplicata']}):")
        for p in grupo['pacientes']:
            print(f"  - {p['id_paciente']}: {p['nome']}")
            print(f"    CPF: {p['cpf'] or 'N/A'} | Nasc: {p['data_nascimento'] or 'N/A'}")
    
    cursor.close()
    conn.close()
    
    return len(grupos_duplicatas), len(pacientes_duplicados)

if __name__ == "__main__":
    main()
