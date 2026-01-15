#!/usr/bin/env python3
"""
Script para corrigir IDs de atendimentos incompletos.
Formato correto: ID_PACIENTE-YYYYNNNN
Exemplo: 2025-0021376-20250001
"""

import os
import re
import mysql.connector
from urllib.parse import urlparse, parse_qs

def parse_database_url(url):
    """Parse DATABASE_URL para extrair credenciais."""
    parsed = urlparse(url)
    
    # Extrair host e porta
    host = parsed.hostname
    port = parsed.port or 4000
    
    # Extrair usuário e senha
    username = parsed.username
    password = parsed.password
    
    # Extrair nome do banco
    database = parsed.path.lstrip('/')
    
    return {
        'host': host,
        'port': port,
        'user': username,
        'password': password,
        'database': database,
        'ssl_disabled': False
    }

def main():
    # Obter DATABASE_URL do ambiente
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL não encontrada no ambiente")
        return
    
    # Conectar ao banco
    config = parse_database_url(database_url)
    print(f"📊 Conectando ao banco: {config['host']}:{config['port']}/{config['database']}")
    
    conn = mysql.connector.connect(
        host=config['host'],
        port=config['port'],
        user=config['user'],
        password=config['password'],
        database=config['database'],
        ssl_disabled=config['ssl_disabled']
    )
    cursor = conn.cursor(dictionary=True)
    
    # Buscar atendimentos com ID incompleto (sem hífen)
    print("\n🔍 Buscando atendimentos com ID incompleto...")
    cursor.execute("""
        SELECT 
            a.id,
            a.atendimento,
            a.paciente_id,
            p.id_paciente,
            YEAR(a.data_atendimento) as ano
        FROM atendimentos a
        LEFT JOIN pacientes p ON a.paciente_id = p.id
        WHERE a.atendimento NOT LIKE '%-%'
        ORDER BY a.id
    """)
    
    atendimentos = cursor.fetchall()
    total = len(atendimentos)
    print(f"📋 Encontrados {total} atendimentos com ID incompleto")
    
    if total == 0:
        print("✅ Nenhum atendimento para corrigir!")
        cursor.close()
        conn.close()
        return
    
    # Corrigir cada atendimento
    corrigidos = 0
    erros = 0
    
    for atd in atendimentos:
        atd_id = atd['id']
        atd_atual = atd['atendimento']
        paciente_id_str = atd['id_paciente']
        ano = atd['ano'] or 2025
        
        # Se não tem paciente vinculado, pular
        if not paciente_id_str:
            print(f"⚠️  Atendimento {atd_id} ({atd_atual}) sem paciente vinculado - pulando")
            erros += 1
            continue
        
        # Extrair apenas a parte numérica do ID atual (ex: 20250001 -> 0001)
        # O formato atual é YYYYNNNN, queremos manter o NNNN
        match = re.match(r'(\d{4})(\d+)', atd_atual)
        if match:
            ano_id = match.group(1)
            seq = match.group(2).zfill(4)  # Garantir 4 dígitos
            novo_id = f"{paciente_id_str}-{ano_id}{seq}"
        else:
            # Se não é numérico (ex: TESTE001), criar novo ID
            novo_id = f"{paciente_id_str}-{ano}0001"
        
        # Verificar se o novo ID já existe
        cursor.execute("SELECT id FROM atendimentos WHERE atendimento = %s AND id != %s", (novo_id, atd_id))
        if cursor.fetchone():
            # ID já existe, adicionar sufixo
            for i in range(2, 100):
                novo_id_alt = f"{novo_id}-{i}"
                cursor.execute("SELECT id FROM atendimentos WHERE atendimento = %s", (novo_id_alt,))
                if not cursor.fetchone():
                    novo_id = novo_id_alt
                    break
        
        # Atualizar o atendimento
        try:
            cursor.execute(
                "UPDATE atendimentos SET atendimento = %s WHERE id = %s",
                (novo_id, atd_id)
            )
            corrigidos += 1
            if corrigidos <= 20 or corrigidos % 100 == 0:
                print(f"✅ [{corrigidos}/{total}] {atd_atual} → {novo_id}")
        except Exception as e:
            print(f"❌ Erro ao atualizar {atd_id}: {e}")
            erros += 1
    
    # Commit das alterações
    conn.commit()
    
    print(f"\n📊 Resumo:")
    print(f"   Total processados: {total}")
    print(f"   Corrigidos: {corrigidos}")
    print(f"   Erros/Pulados: {erros}")
    
    cursor.close()
    conn.close()
    print("\n✅ Script finalizado!")

if __name__ == "__main__":
    main()
