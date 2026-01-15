#!/usr/bin/env python3
"""
Script de Migração de Atendimentos - Gorgen v4.9
Importa atendimentos históricos da planilha Excel para o banco de dados.

Uso:
    python3 migrate_atendimentos.py [--dry-run] [--limit N] [--verbose]

Opções:
    --dry-run   Simula a importação sem inserir no banco
    --limit N   Limita a importação aos primeiros N registros
    --verbose   Mostra detalhes de cada registro processado
"""

import os
import sys
import re
import json
import argparse
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
import pandas as pd
import mysql.connector
from mysql.connector import Error

# Configuração
TENANT_ID = 1  # Dr. André Gorgen
DATABASE_URL = os.environ.get('DATABASE_URL', '')

# Mapeamento de convênios (normalização)
CONVENIO_MAP = {
    'UNIMED': 'UNIMED',
    'PARTICULAR': 'PARTICULAR',
    'IPE': 'IPE SAÚDE',
    'IPE SAÚDE': 'IPE SAÚDE',
    'BRADESCO': 'BRADESCO SAÚDE',
    'BRADESCO SAÚDE': 'BRADESCO SAÚDE',
    'CASSI': 'CASSI',
    'AMIL': 'AMIL',
    'SAUDEPAS': 'SAUDEPAS',
    'CORTESIA': 'CORTESIA',
    'RETORNO DE PARTICULAR': 'RETORNO PARTICULAR',
    'GEAP': 'GEAP',
    'SULAMERICA': 'SULAMERICA',
    'SUL AMERICA': 'SULAMERICA',
    'CABERGS': 'CABERGS',
    'PETROBRAS': 'PETROBRAS',
    'POSTAL SAUDE': 'POSTAL SAÚDE',
    'POSTAL SAÚDE': 'POSTAL SAÚDE',
}

# Mapeamento de tipos de atendimento
TIPO_ATENDIMENTO_MAP = {
    'CONSULTA': 'Consulta',
    'VISITA INTERNADO': 'Visita internado',
    'CIRURGIA': 'Cirurgia',
    'PROCEDIMENTO': 'Procedimento em consultório',
    'EXAME': 'Exame',
    'RETORNO': 'Retorno',
}

# Mapeamento de locais
LOCAL_MAP = {
    'CONSULTÓRIO': 'Consultório',
    'CONSULTORIO': 'Consultório',
    'HMV': 'HMV',
    'HMDC': 'HMD CG',
    'HMD': 'HMD',
    'SANTA CASA': 'Santa Casa',
    'ON-LINE': 'On-line',
    'ONLINE': 'On-line',
}


def parse_database_url(url):
    """Extrai parâmetros de conexão da DATABASE_URL."""
    # mysql://user:password@host:port/database
    pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, url)
    if match:
        return {
            'user': match.group(1),
            'password': match.group(2),
            'host': match.group(3),
            'port': int(match.group(4)),
            'database': match.group(5).split('?')[0],
        }
    return None


def connect_db():
    """Conecta ao banco de dados."""
    db_config = parse_database_url(DATABASE_URL)
    if not db_config:
        raise ValueError("DATABASE_URL inválida ou não configurada")
    
    return mysql.connector.connect(
        host=db_config['host'],
        port=db_config['port'],
        user=db_config['user'],
        password=db_config['password'],
        database=db_config['database'],
        ssl_disabled=False,
        ssl_verify_cert=False,
    )


def parse_date(value):
    """Converte diversos formatos de data para objeto date."""
    if pd.isna(value) or value is None or value == '':
        return None
    
    # Se já é datetime/date
    if isinstance(value, (datetime, date)):
        if isinstance(value, datetime):
            return value.date()
        return value
    
    value = str(value).strip()
    
    # Formatos brasileiros: 06/jan./2025, 08/jan./2025
    meses_pt = {
        'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12
    }
    
    # Padrão: DD/mes./YYYY
    match = re.match(r'(\d{1,2})/(\w{3})\./(\d{4})', value)
    if match:
        dia = int(match.group(1))
        mes_str = match.group(2).lower()
        ano = int(match.group(3))
        mes = meses_pt.get(mes_str)
        if mes:
            try:
                return date(ano, mes, dia)
            except ValueError:
                return None
    
    # Padrão ISO: YYYY-MM-DD HH:MM:SS
    match = re.match(r'(\d{4})-(\d{2})-(\d{2})', value)
    if match:
        try:
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except ValueError:
            return None
    
    # Padrão DD/MM/YYYY
    match = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', value)
    if match:
        try:
            return date(int(match.group(3)), int(match.group(2)), int(match.group(1)))
        except ValueError:
            return None
    
    return None


def parse_money(value):
    """Converte valor monetário brasileiro para Decimal."""
    if pd.isna(value) or value is None or value == '':
        return None
    
    value = str(value).strip()
    
    # Remove "R$" e espaços
    value = value.replace('R$', '').replace(' ', '').strip()
    
    # Se vazio ou apenas "-"
    if value == '' or value == '-':
        return Decimal('0.00')
    
    # Converte formato brasileiro (1.234,56) para internacional (1234.56)
    # Remove pontos de milhar
    value = value.replace('.', '')
    # Troca vírgula por ponto
    value = value.replace(',', '.')
    
    try:
        return Decimal(value).quantize(Decimal('0.01'))
    except InvalidOperation:
        return None


def parse_boolean(value):
    """Converte valor para booleano."""
    if pd.isna(value) or value is None:
        return False
    
    value = str(value).strip().lower()
    return value in ('true', '1', 'sim', 'yes', 's')


def normalize_convenio(value):
    """Normaliza nome do convênio."""
    if pd.isna(value) or value is None or value == '':
        return None
    
    value = str(value).strip().upper()
    return CONVENIO_MAP.get(value, value.title())


def normalize_tipo_atendimento(value):
    """Normaliza tipo de atendimento."""
    if pd.isna(value) or value is None or value == '':
        return None
    
    value = str(value).strip().upper()
    return TIPO_ATENDIMENTO_MAP.get(value, value.title())


def normalize_local(value):
    """Normaliza local do atendimento."""
    if pd.isna(value) or value is None or value == '':
        return None
    
    value = str(value).strip().upper()
    return LOCAL_MAP.get(value, value.title())


def normalize_name(nome):
    """Remove acentos e normaliza nome para comparação."""
    import unicodedata
    if not nome:
        return ''
    # Remove acentos
    nome = unicodedata.normalize('NFD', nome)
    nome = ''.join(c for c in nome if unicodedata.category(c) != 'Mn')
    # Converte para minúsculas e remove espaços extras
    nome = ' '.join(nome.lower().split())
    return nome


def extract_surnames(nome):
    """Extrai sobrenomes de um nome completo."""
    if not nome:
        return []
    partes = nome.strip().split()
    if len(partes) <= 1:
        return partes
    # Retorna todos os sobrenomes (exceto primeiro nome)
    return partes[1:]


def find_paciente_by_name(cursor, nome, tenant_id):
    """Busca paciente pelo nome (busca aproximada com múltiplas estratégias)."""
    if not nome:
        return None
    
    nome = nome.strip()
    
    # Estratégia 1: Busca exata (case insensitive)
    cursor.execute("""
        SELECT id, id_paciente, nome, codigo_legado 
        FROM pacientes 
        WHERE tenant_id = %s 
          AND deleted_at IS NULL 
          AND LOWER(nome) = LOWER(%s)
        LIMIT 1
    """, (tenant_id, nome))
    
    result = cursor.fetchone()
    if result:
        return result
    
    # Estratégia 2: Busca LIKE parcial
    cursor.execute("""
        SELECT id, id_paciente, nome, codigo_legado 
        FROM pacientes 
        WHERE tenant_id = %s 
          AND deleted_at IS NULL 
          AND LOWER(nome) LIKE LOWER(%s)
        LIMIT 1
    """, (tenant_id, f"%{nome}%"))
    
    result = cursor.fetchone()
    if result:
        return result
    
    # Estratégia 3: Busca por sobrenomes (para casos com acentos diferentes)
    sobrenomes = extract_surnames(nome)
    if sobrenomes:
        # Busca pelo último sobrenome (mais específico)
        ultimo_sobrenome = sobrenomes[-1]
        cursor.execute("""
            SELECT id, id_paciente, nome, codigo_legado 
            FROM pacientes 
            WHERE tenant_id = %s 
              AND deleted_at IS NULL 
              AND LOWER(nome) LIKE LOWER(%s)
            LIMIT 5
        """, (tenant_id, f"%{ultimo_sobrenome}%"))
        
        candidatos = cursor.fetchall()
        if candidatos:
            # Se só tem um candidato, retorna
            if len(candidatos) == 1:
                return candidatos[0]
            
            # Se tem múltiplos, tenta refinar com primeiro nome
            primeiro_nome = nome.split()[0] if nome.split() else ''
            primeiro_nome_norm = normalize_name(primeiro_nome)
            
            for candidato in candidatos:
                nome_candidato = candidato['nome'] if isinstance(candidato, dict) else candidato[2]
                primeiro_nome_candidato = nome_candidato.split()[0] if nome_candidato else ''
                
                # Compara primeiro nome normalizado
                if normalize_name(primeiro_nome_candidato) == primeiro_nome_norm:
                    return candidato
            
            # Se ainda não encontrou, retorna o primeiro candidato
            return candidatos[0]
    
    # Estratégia 4: Busca sem acentos usando COLLATE
    cursor.execute("""
        SELECT id, id_paciente, nome, codigo_legado 
        FROM pacientes 
        WHERE tenant_id = %s 
          AND deleted_at IS NULL 
          AND nome COLLATE utf8mb4_general_ci LIKE %s
        LIMIT 1
    """, (tenant_id, f"%{nome}%"))
    
    return cursor.fetchone()


def get_next_atendimento_id(cursor, tenant_id, ano):
    """Gera próximo ID de atendimento no formato YYYYNNNN."""
    cursor.execute("""
        SELECT atendimento 
        FROM atendimentos 
        WHERE tenant_id = %s 
          AND atendimento LIKE %s
        ORDER BY atendimento DESC 
        LIMIT 1
    """, (tenant_id, f"{ano}%"))
    
    result = cursor.fetchone()
    if result:
        # Extrai número sequencial
        ultimo = result[0]
        match = re.match(r'\d{4}(\d+)', str(ultimo))
        if match:
            seq = int(match.group(1)) + 1
            return f"{ano}{seq:04d}"
    
    return f"{ano}0001"


def migrate_atendimentos(excel_path, dry_run=False, limit=None, verbose=False):
    """Executa a migração de atendimentos."""
    
    print(f"\n{'='*60}")
    print("MIGRAÇÃO DE ATENDIMENTOS - GORGEN v4.9")
    print(f"{'='*60}")
    print(f"Arquivo: {excel_path}")
    print(f"Modo: {'SIMULAÇÃO (dry-run)' if dry_run else 'PRODUÇÃO'}")
    if limit:
        print(f"Limite: {limit} registros")
    print(f"{'='*60}\n")
    
    # Carrega planilha
    print("📂 Carregando planilha...")
    df = pd.read_excel(excel_path)
    total_rows = len(df)
    print(f"   Total de registros: {total_rows}")
    
    if limit:
        df = df.head(limit)
        print(f"   Limitado a: {len(df)} registros")
    
    # Conecta ao banco
    print("\n🔌 Conectando ao banco de dados...")
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    print("   Conexão estabelecida!")
    
    # Estatísticas
    stats = {
        'total': len(df),
        'sucesso': 0,
        'erro': 0,
        'paciente_nao_encontrado': 0,
        'data_invalida': 0,
        'duplicado': 0,
    }
    
    erros = []
    pacientes_nao_encontrados = set()
    
    print("\n📋 Processando atendimentos...\n")
    
    for idx, row in df.iterrows():
        try:
            # Extrai dados da planilha
            atendimento_id = str(row.get('Atendimento', '')).replace('.0', '').strip()
            nome_paciente = str(row.get('Nome', '')).strip() if pd.notna(row.get('Nome')) else None
            data_atendimento = parse_date(row.get('Data'))
            tipo_atendimento = normalize_tipo_atendimento(row.get('Tipo de atendimento'))
            procedimento = str(row.get('Procedimento', '')).strip() if pd.notna(row.get('Procedimento')) else None
            local = normalize_local(row.get('Local'))
            convenio = normalize_convenio(row.get('Convênio'))
            plano_convenio = str(row.get('Plano do convênio', '')).strip() if pd.notna(row.get('Plano do convênio')) else None
            privativo = parse_boolean(row.get('Privativo'))
            
            # Dados financeiros
            pagamento_efetivado = parse_boolean(row.get('Pagamento efetivado?'))
            faturamento_previsto = parse_money(row.get('Faturamento Previsto'))
            registro_manual_hm = parse_money(row.get('Registro manual do valor de HM'))
            faturamento_previsto_final = parse_money(row.get('Faturamento previsto final'))
            faturamento_leticia = parse_money(row.get('Faturamento Letícia'))
            faturamento_aglu = parse_money(row.get('Faturamento AG+LU'))
            
            # Datas
            data_envio_faturamento = parse_date(row.get('Data envio para cobrança'))
            data_esperada_pagamento = parse_date(row.get('Data esperada para pagamento'))
            data_pagamento = parse_date(row.get('Data do pagamento'))
            
            # Outros
            observacoes = str(row.get('Observações', '')).strip() if pd.notna(row.get('Observações')) else None
            nota_fiscal = str(row.get('Nota Fiscal Correspondente', '')).strip() if pd.notna(row.get('Nota Fiscal Correspondente')) else None
            
            # Campos auxiliares
            semana = int(row.get('Semana #')) if pd.notna(row.get('Semana #')) else None
            mes = None
            ano = None
            
            # Extrai mês e ano da data ou das colunas auxiliares
            if data_atendimento:
                mes = data_atendimento.month
                ano = data_atendimento.year
            else:
                # Tenta usar colunas Mes e Ano
                mes_str = str(row.get('Mes', '')).strip() if pd.notna(row.get('Mes')) else None
                ano_val = row.get('Ano')
                
                if mes_str:
                    meses = {'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4, 'maio': 5, 'junho': 6,
                             'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12}
                    mes = meses.get(mes_str.lower())
                
                if pd.notna(ano_val):
                    ano = int(float(ano_val))
                
                # Reconstrói data se possível
                if mes and ano:
                    try:
                        data_atendimento = date(ano, mes, 1)  # Dia 1 como fallback
                    except ValueError:
                        pass
            
            trimestre = str(row.get('Trimestre', '')).strip() if pd.notna(row.get('Trimestre')) else None
            trimestre_ano = str(row.get('Trimestre + Ano', '')).strip() if pd.notna(row.get('Trimestre + Ano')) else None
            
            # Validações
            if not nome_paciente:
                stats['erro'] += 1
                erros.append(f"Linha {idx+2}: Nome do paciente vazio")
                continue
            
            if not data_atendimento:
                stats['data_invalida'] += 1
                if verbose:
                    print(f"   ⚠️  Linha {idx+2}: Data inválida para {nome_paciente}")
                # Continua mesmo sem data (usa NULL)
            
            # Busca paciente no banco
            paciente = find_paciente_by_name(cursor, nome_paciente, TENANT_ID)
            
            if not paciente:
                stats['paciente_nao_encontrado'] += 1
                pacientes_nao_encontrados.add(nome_paciente)
                if verbose:
                    print(f"   ⚠️  Linha {idx+2}: Paciente não encontrado: {nome_paciente}")
                continue
            
            paciente_id = paciente['id']
            
            # Verifica duplicata
            cursor.execute("""
                SELECT id FROM atendimentos 
                WHERE tenant_id = %s AND atendimento = %s
            """, (TENANT_ID, atendimento_id))
            
            if cursor.fetchone():
                stats['duplicado'] += 1
                if verbose:
                    print(f"   ⚠️  Linha {idx+2}: Atendimento duplicado: {atendimento_id}")
                continue
            
            # Prepara dados para inserção
            atendimento_data = {
                'tenant_id': TENANT_ID,
                'atendimento': atendimento_id,
                'paciente_id': paciente_id,
                'nome_paciente': nome_paciente,
                'data_atendimento': data_atendimento,
                'semana': semana,
                'tipo_atendimento': tipo_atendimento,
                'procedimento': procedimento,
                'local': local,
                'convenio': convenio,
                'plano_convenio': plano_convenio,
                'pagamento_efetivado': pagamento_efetivado,
                'faturamento_previsto': faturamento_previsto,
                'registro_manual_valor_hm': registro_manual_hm,
                'faturamento_previsto_final': faturamento_previsto_final,
                'data_envio_faturamento': data_envio_faturamento,
                'data_esperada_pagamento': data_esperada_pagamento,
                'data_pagamento': data_pagamento,
                'nota_fiscal_correspondente': nota_fiscal,
                'observacoes': observacoes,
                'faturamento_leticia': faturamento_leticia,
                'faturamento_ag_lu': faturamento_aglu,
                'mes': mes,
                'ano': ano,
                'trimestre': trimestre,
                'trimestre_ano': trimestre_ano,
            }
            
            if not dry_run:
                # Insere no banco
                columns = ', '.join(atendimento_data.keys())
                placeholders = ', '.join(['%s'] * len(atendimento_data))
                
                sql = f"INSERT INTO atendimentos ({columns}) VALUES ({placeholders})"
                cursor.execute(sql, list(atendimento_data.values()))
            
            stats['sucesso'] += 1
            
            if verbose:
                print(f"   ✅ {atendimento_id}: {nome_paciente} ({data_atendimento})")
            elif stats['sucesso'] % 100 == 0:
                print(f"   Processados: {stats['sucesso']} registros...")
        
        except Exception as e:
            stats['erro'] += 1
            erros.append(f"Linha {idx+2}: {str(e)}")
            if verbose:
                print(f"   ❌ Linha {idx+2}: {str(e)}")
    
    # Commit
    if not dry_run:
        conn.commit()
        print("\n💾 Dados salvos no banco!")
    
    # Relatório final
    print(f"\n{'='*60}")
    print("RELATÓRIO DE MIGRAÇÃO")
    print(f"{'='*60}")
    print(f"Total processado:        {stats['total']}")
    print(f"✅ Sucesso:              {stats['sucesso']}")
    print(f"❌ Erros:                {stats['erro']}")
    print(f"⚠️  Paciente não encontrado: {stats['paciente_nao_encontrado']}")
    print(f"⚠️  Data inválida:       {stats['data_invalida']}")
    print(f"⚠️  Duplicados:          {stats['duplicado']}")
    print(f"{'='*60}")
    
    if pacientes_nao_encontrados:
        print(f"\n📋 Pacientes não encontrados ({len(pacientes_nao_encontrados)}):")
        for nome in sorted(pacientes_nao_encontrados)[:20]:
            print(f"   - {nome}")
        if len(pacientes_nao_encontrados) > 20:
            print(f"   ... e mais {len(pacientes_nao_encontrados) - 20} pacientes")
    
    if erros:
        print(f"\n❌ Erros ({len(erros)}):")
        for erro in erros[:10]:
            print(f"   - {erro}")
        if len(erros) > 10:
            print(f"   ... e mais {len(erros) - 10} erros")
    
    # Salva relatório JSON
    report = {
        'timestamp': datetime.now().isoformat(),
        'arquivo': excel_path,
        'modo': 'dry-run' if dry_run else 'producao',
        'estatisticas': stats,
        'pacientes_nao_encontrados': list(pacientes_nao_encontrados),
        'erros': erros,
    }
    
    report_path = f"/home/ubuntu/consultorio_poc/scripts/migration_report_atendimentos_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n📄 Relatório salvo em: {report_path}")
    
    # Fecha conexão
    cursor.close()
    conn.close()
    
    return stats


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Migração de atendimentos para o Gorgen')
    parser.add_argument('--dry-run', action='store_true', help='Simula sem inserir no banco')
    parser.add_argument('--limit', type=int, help='Limita número de registros')
    parser.add_argument('--verbose', '-v', action='store_true', help='Modo verboso')
    parser.add_argument('--file', type=str, default='/home/ubuntu/upload/atendimentos2025-2026.xlsx',
                        help='Caminho do arquivo Excel')
    
    args = parser.parse_args()
    
    migrate_atendimentos(
        excel_path=args.file,
        dry_run=args.dry_run,
        limit=args.limit,
        verbose=args.verbose
    )
