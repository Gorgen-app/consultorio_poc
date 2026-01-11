#!/usr/bin/env python3
"""
GORGEN - Script de Migração de Pacientes (Python/Pandas)

Este script importa pacientes da planilha Excel para o banco de dados do Gorgen.
Versão otimizada usando pandas para processamento mais rápido.

Uso: python3 scripts/migrate_patients.py [--dry-run] [--limit=N] [--batch=N]

Opções:
  --dry-run    Simula a migração sem inserir dados
  --limit=N    Limita a N registros (para testes)
  --batch=N    Tamanho do lote para inserções (default: 500)
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import json
import sys
import os
import re
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any

# ============================================
# CONFIGURAÇÃO
# ============================================

CONFIG = {
    'input_file': '/home/ubuntu/consultorio_poc/data/22kpacientes.xlsx',
    'report_file': '/home/ubuntu/consultorio_poc/data/migration_report.json',
    'tenant_id': 1,
    'batch_size': 500,
    'min_date': datetime(1900, 1, 1),
    'max_date': datetime(2025, 12, 31),
}

def get_db_config():
    """Obtém configuração do banco a partir de DATABASE_URL ou variáveis individuais."""
    database_url = os.environ.get('DATABASE_URL', '')
    
    if database_url:
        # Parse DATABASE_URL (formato: mysql://user:pass@host:port/database)
        from urllib.parse import urlparse
        parsed = urlparse(database_url)
        return {
            'host': parsed.hostname,
            'port': parsed.port or 4000,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path.lstrip('/'),
            'ssl_ca': '/etc/ssl/certs/ca-certificates.crt',
            'ssl_verify_cert': False,
        }
    else:
        # Fallback para variáveis individuais
        return {
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': int(os.environ.get('DB_PORT', '4000')),
            'user': os.environ.get('DB_USER', ''),
            'password': os.environ.get('DB_PASSWORD', ''),
            'database': os.environ.get('DB_NAME', ''),
            'ssl_ca': '/etc/ssl/certs/ca-certificates.crt',
            'ssl_verify_cert': False,
        }

# ============================================
# MAPEAMENTO DE CONVÊNIOS
# ============================================

CONVENIO_MAP = {
    'UNIMED': 'UNIMED',
    'Particular': 'Particular',
    'IPE': 'IPE',
    'IPE-SAUDE': 'IPE',
    'BRADESCO SAÚDE': 'BRADESCO SAÚDE',
    'CASSI': 'CASSI',
    'CABERGS': 'CABERGS',
    'SAUDE PAS': 'SAUDE PAS',
    'COOPMED': 'COOPMED',
    'CCG': 'CCG',
    'SAUDE CAIXA': 'SAUDE CAIXA',
    'ACERTO ESPECIAL': 'ACERTO ESPECIAL',
    'CAF RBS': 'CAF RBS',
    'Janssen - Gastros': 'Janssen - Gastros',
    'PESQUISA/HCPA': 'PESQUISA/HCPA',
}

# ============================================
# FUNÇÕES DE VALIDAÇÃO
# ============================================

def validate_cpf(cpf: Any) -> Optional[str]:
    """Valida e formata CPF."""
    if pd.isna(cpf) or cpf is None:
        return None
    
    cleaned = re.sub(r'\D', '', str(cpf))
    
    if len(cleaned) != 11:
        return None
    
    # Verifica se todos os dígitos são iguais
    if len(set(cleaned)) == 1:
        return None
    
    # Formata: XXX.XXX.XXX-XX
    return f"{cleaned[:3]}.{cleaned[3:6]}.{cleaned[6:9]}-{cleaned[9:]}"


def validate_date(date_value: Any) -> Optional[str]:
    """Valida e formata data de nascimento."""
    if pd.isna(date_value) or date_value is None:
        return None
    
    try:
        if isinstance(date_value, pd.Timestamp):
            date = date_value.to_pydatetime()
        elif isinstance(date_value, datetime):
            date = date_value
        else:
            date = pd.to_datetime(date_value)
            if pd.isna(date):
                return None
            date = date.to_pydatetime()
        
        # Verifica range
        if date < CONFIG['min_date'] or date > CONFIG['max_date']:
            return None
        
        return date.strftime('%Y-%m-%d')
    except:
        return None


def validate_email(email: Any) -> Optional[str]:
    """Valida e normaliza email."""
    if pd.isna(email) or email is None:
        return None
    
    cleaned = str(email).strip().lower()
    
    # Regex básico de email
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', cleaned):
        return None
    
    return cleaned


def format_cep(cep: Any) -> Optional[str]:
    """Formata CEP."""
    if pd.isna(cep) or cep is None:
        return None
    
    cleaned = re.sub(r'\D', '', str(cep))
    
    if len(cleaned) == 8:
        return f"{cleaned[:5]}-{cleaned[5:]}"
    
    return str(cep).strip() if cep else None


def normalize_sexo(sexo: Any) -> Optional[str]:
    """Normaliza sexo."""
    if pd.isna(sexo) or sexo is None:
        return None
    
    s = str(sexo).upper().strip()
    
    if s in ('M', 'MASCULINO'):
        return 'M'
    if s in ('F', 'FEMININO'):
        return 'F'
    
    return 'Outro'


def safe_str(value: Any, max_length: int = None) -> Optional[str]:
    """Converte valor para string de forma segura."""
    if pd.isna(value) or value is None:
        return None
    
    result = str(value).strip()
    
    if max_length and len(result) > max_length:
        result = result[:max_length]
    
    return result if result else None


# ============================================
# PROCESSAMENTO
# ============================================

def transform_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
    """Transforma DataFrame da planilha para formato do Gorgen."""
    
    warnings = []
    
    print("   Transformando dados...")
    
    # Cria DataFrame de saída
    result = pd.DataFrame()
    
    # Campos diretos
    result['tenant_id'] = CONFIG['tenant_id']
    # Usa prefixo MIG- para diferenciar pacientes migrados dos existentes
    result['id_paciente'] = 'MIG-' + df['ID paciente'].astype(str)
    result['codigo_legado'] = df['ID paciente'].astype(str)  # Guarda ID original sem prefixo
    result['nome'] = df['Nome'].apply(lambda x: safe_str(x, 255))
    
    # Data de nascimento com validação
    result['data_nascimento'] = df['Data nascimento'].apply(validate_date)
    invalid_dates = df[df['Data nascimento'].notna() & result['data_nascimento'].isna()]
    if len(invalid_dates) > 0:
        warnings.append(f"Datas de nascimento inválidas: {len(invalid_dates)}")
    
    # Sexo
    result['sexo'] = df['Sexo'].apply(normalize_sexo)
    
    # CPF com validação
    result['cpf'] = df['CPF'].apply(validate_cpf)
    invalid_cpfs = df[df['CPF'].notna() & result['cpf'].isna()]
    if len(invalid_cpfs) > 0:
        warnings.append(f"CPFs inválidos: {len(invalid_cpfs)}")
    
    # Nome da mãe
    result['nome_mae'] = df['Nome da mae'].apply(lambda x: safe_str(x, 255))
    
    # Email com validação
    result['email'] = df['E-mail'].apply(validate_email)
    invalid_emails = df[df['E-mail'].notna() & result['email'].isna()]
    if len(invalid_emails) > 0:
        warnings.append(f"Emails inválidos: {len(invalid_emails)}")
    
    # Telefone
    result['telefone'] = df['Telefone'].apply(lambda x: safe_str(x, 20))
    
    # Endereço
    result['endereco'] = df['Endereço'].apply(lambda x: safe_str(x, 500))
    result['bairro'] = df['Bairro'].apply(lambda x: safe_str(x, 100))
    result['cep'] = df['CEP'].apply(format_cep)
    result['cidade'] = df['Cidade'].apply(lambda x: safe_str(x, 100))
    result['uf'] = df['UF'].apply(lambda x: safe_str(x, 2).upper() if safe_str(x) else None)
    result['pais'] = df['Pais'].apply(lambda x: safe_str(x, 100) or 'Brasil')
    
    # Convênio 1
    result['operadora_1'] = df['Operadora 1'].apply(lambda x: CONVENIO_MAP.get(x, safe_str(x, 100)) if pd.notna(x) else None)
    result['plano_modalidade_1'] = df['Plano / Modalidade 1'].apply(lambda x: safe_str(x, 100))
    result['matricula_convenio_1'] = df['Matricula convênio 1'].apply(lambda x: safe_str(x, 100))
    result['vigente_1'] = df['Vigente 1'].apply(lambda x: 'Sim' if x == True else 'Não')
    result['privativo_1'] = df['Privativo 1'].apply(lambda x: 'Sim' if x == True else 'Não')
    
    # Convênio 2
    result['operadora_2'] = df['Operadora 2'].apply(lambda x: safe_str(x, 100))
    result['plano_modalidade_2'] = df['Plano / Modalidade 2'].apply(lambda x: safe_str(x, 100))
    result['matricula_convenio_2'] = df['Matricula convênio 2'].apply(lambda x: safe_str(x, 100))
    result['vigente_2'] = df['Vigente 2'].apply(lambda x: 'Sim' if x == True else 'Não')
    result['privativo_2'] = df['Privativo 2'].apply(lambda x: 'Sim' if x == True else 'Não')
    
    # Status
    result['obito_perda'] = df['Obito / Perda de seguimento'].apply(lambda x: 'Sim' if x == True else 'Não')
    result['status_caso'] = df['Status do caso'].apply(lambda x: safe_str(x, 50) or 'Ativo')
    
    # Remove registros sem nome
    invalid_names = result[result['nome'].isna()]
    if len(invalid_names) > 0:
        warnings.append(f"Registros sem nome: {len(invalid_names)}")
        result = result[result['nome'].notna()]
    
    # Trata IDs duplicados
    duplicates = result[result['id_paciente'].duplicated(keep='first')]
    if len(duplicates) > 0:
        warnings.append(f"IDs duplicados tratados: {len(duplicates)}")
        # Adiciona sufixo aos duplicados
        dup_mask = result['id_paciente'].duplicated(keep='first')
        result.loc[dup_mask, 'id_paciente'] = result.loc[dup_mask, 'id_paciente'] + '-DUP-' + result.loc[dup_mask].index.astype(str)
    
    print(f"   Transformação concluída: {len(result)} registros válidos")
    
    return result, warnings


def insert_batch(cursor, df_batch: pd.DataFrame, upsert: bool = False) -> int:
    """Insere um lote de pacientes no banco.
    
    Args:
        cursor: Cursor do banco de dados
        df_batch: DataFrame com os pacientes
        upsert: Se True, atualiza registros existentes (ON DUPLICATE KEY UPDATE)
    """
    
    columns = [
        'tenant_id', 'id_paciente', 'codigo_legado', 'nome', 'data_nascimento', 'sexo',
        'cpf', 'nome_mae', 'email', 'telefone', 'endereco', 'bairro', 'cep',
        'cidade', 'uf', 'pais', 'operadora_1', 'plano_modalidade_1', 'matricula_convenio_1',
        'vigente_1', 'privativo_1', 'operadora_2', 'plano_modalidade_2', 'matricula_convenio_2',
        'vigente_2', 'privativo_2', 'obito_perda', 'status_caso'
    ]
    
    placeholders = ', '.join(['%s'] * len(columns))
    
    if upsert:
        # ON DUPLICATE KEY UPDATE - atualiza todos os campos exceto tenant_id e id_paciente
        update_cols = [c for c in columns if c not in ('tenant_id', 'id_paciente')]
        update_clause = ', '.join([f"{c} = VALUES({c})" for c in update_cols])
        sql = f"INSERT INTO pacientes ({', '.join(columns)}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_clause}"
    else:
        sql = f"INSERT INTO pacientes ({', '.join(columns)}) VALUES ({placeholders})"
    
    # Converte DataFrame para lista de tuplas
    values = []
    for _, row in df_batch.iterrows():
        row_values = []
        for col in columns:
            val = row[col]
            if pd.isna(val):
                row_values.append(None)
            else:
                row_values.append(val)
        values.append(tuple(row_values))
    
    cursor.executemany(sql, values)
    # No modo upsert, rowcount retorna 2 para updates e 1 para inserts
    # Retornamos o número de linhas processadas
    return len(values)


# ============================================
# FUNÇÃO PRINCIPAL
# ============================================

def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    upsert = '--upsert' in args
    
    limit = None
    batch_size = CONFIG['batch_size']
    
    for arg in args:
        if arg.startswith('--limit='):
            limit = int(arg.split('=')[1])
        elif arg.startswith('--batch='):
            batch_size = int(arg.split('=')[1])
    
    print('=' * 60)
    print('🏥 GORGEN - Migração de Pacientes (Python)')
    print('=' * 60)
    print(f"   Modo: {'🔍 DRY-RUN (simulação)' if dry_run else '🚀 PRODUÇÃO'}")
    if upsert:
        print("   UPSERT: Ativado (atualiza registros existentes)")
    if limit:
        print(f"   Limite: {limit} registros")
    print(f"   Batch size: {batch_size}")
    print()
    
    # Estatísticas
    stats = {
        'total': 0,
        'processed': 0,
        'inserted': 0,
        'skipped': 0,
        'warnings': [],
        'start_time': datetime.now().isoformat(),
        'end_time': None,
    }
    
    start_time = datetime.now()
    connection = None
    
    try:
        # 1. Lê a planilha
        print(f"📂 Lendo arquivo: {CONFIG['input_file']}")
        df = pd.read_excel(CONFIG['input_file'], nrows=limit if limit else None)
        print(f"   Total de linhas: {len(df):,}")
        
        # Filtra apenas registros com ID válido
        df = df[df['ID paciente'].notna()].copy()
        print(f"   Registros com ID válido: {len(df):,}")
        
        if limit and len(df) > limit:
            df = df.head(limit)
            print(f"   Após limit({limit}): {len(df):,}")
        
        stats['total'] = len(df)
        
        # 2. Transforma dados
        print()
        df_transformed, warnings = transform_dataframe(df)
        stats['warnings'] = warnings
        stats['processed'] = len(df_transformed)
        
        # 3. Conecta ao banco (se não for dry-run)
        if not dry_run:
            print()
            print('🔌 Conectando ao banco de dados...')
            connection = mysql.connector.connect(**get_db_config())
            cursor = connection.cursor()
            print('   ✅ Conectado!')
        
        # 4. Insere em lotes
        print()
        print('📋 Inserindo registros...')
        
        total_batches = (len(df_transformed) + batch_size - 1) // batch_size
        
        for i in range(0, len(df_transformed), batch_size):
            batch_num = i // batch_size + 1
            batch = df_transformed.iloc[i:i + batch_size]
            
            if not dry_run:
                inserted = insert_batch(cursor, batch, upsert=upsert)
                connection.commit()
                stats['inserted'] += inserted
            else:
                stats['inserted'] += len(batch)
            
            pct = (batch_num / total_batches) * 100
            print(f"\r   Lote {batch_num}/{total_batches} ({pct:.1f}%) - Inseridos: {stats['inserted']:,}", end='')
        
        print()
        
    except Error as e:
        print(f"\n❌ Erro de banco de dados: {e}")
        stats['warnings'].append(f"Erro DB: {str(e)}")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        stats['warnings'].append(f"Erro: {str(e)}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
    
    # Finaliza estatísticas
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    stats['end_time'] = end_time.isoformat()
    stats['skipped'] = stats['total'] - stats['processed']
    
    # Exibe resumo
    print()
    print('=' * 60)
    print('📊 RESUMO DA MIGRAÇÃO')
    print('=' * 60)
    print(f"   Total de registros: {stats['total']:,}")
    print(f"   Processados: {stats['processed']:,}")
    print(f"   Inseridos: {stats['inserted']:,}")
    print(f"   Ignorados: {stats['skipped']:,}")
    print(f"   Warnings: {len(stats['warnings'])}")
    print(f"   Duração: {duration:.1f} segundos")
    if duration > 0:
        print(f"   Taxa: {stats['processed'] / duration:.0f} registros/segundo")
    print()
    
    # Exibe warnings
    if stats['warnings']:
        print('⚠️  AVISOS:')
        for w in stats['warnings']:
            print(f"   • {w}")
        print()
    
    # Salva relatório
    with open(CONFIG['report_file'], 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    print(f"📄 Relatório salvo em: {CONFIG['report_file']}")
    
    print('=' * 60)
    print('🔍 Simulação concluída!' if dry_run else '✅ Migração concluída!')
    print('=' * 60)


if __name__ == '__main__':
    main()
