import pandas as pd
import json

# Carregar apenas as primeiras 25000 linhas para análise
print("Carregando dados...")
df = pd.read_excel('/home/ubuntu/consultorio_poc/data/22kpacientes.xlsx', nrows=25000)

# Filtrar apenas linhas com dados reais (ID paciente preenchido)
df_real = df[df['ID paciente'].notna()].copy()

print(f"\n{'=' * 70}")
print("ANÁLISE DETALHADA DOS DADOS DE PACIENTES")
print(f"{'=' * 70}")

print(f"\n📊 RESUMO GERAL:")
print(f"   • Total de linhas na planilha: {len(df):,}")
print(f"   • Pacientes com ID válido: {len(df_real):,}")

print(f"\n📝 COLUNAS E TAXA DE PREENCHIMENTO:")
print("-" * 70)

# Análise de cada coluna
col_analysis = []
for col in df_real.columns:
    non_null = df_real[col].notna().sum()
    null_count = df_real[col].isna().sum()
    fill_rate = (non_null / len(df_real)) * 100 if len(df_real) > 0 else 0
    unique_count = df_real[col].nunique()
    
    col_analysis.append({
        'coluna': col,
        'preenchidos': non_null,
        'vazios': null_count,
        'taxa': fill_rate,
        'unicos': unique_count
    })
    
    # Mostrar apenas colunas com algum dado
    if fill_rate > 0:
        status = "✅" if fill_rate > 80 else "⚠️" if fill_rate > 20 else "❌"
        print(f"{status} {col[:40]:<40} | {fill_rate:>6.1f}% | {non_null:>6,} registros | {unique_count:>6,} únicos")

print(f"\n📋 CAMPOS CRÍTICOS PARA MIGRAÇÃO:")
print("-" * 70)

critical_fields = {
    'ID paciente': 'Identificador único',
    'Nome': 'Nome completo',
    'Data nascimento': 'Data de nascimento',
    'Sexo': 'Gênero',
    'CPF': 'Documento',
    'E-mail': 'Contato email',
    'Telefone': 'Contato telefone',
    'Endereço': 'Logradouro',
    'Bairro': 'Bairro',
    'CEP': 'CEP',
    'Cidade': 'Cidade',
    'UF': 'Estado',
    'Operadora 1': 'Convênio principal',
    'Nome da mae': 'Nome da mãe'
}

for field, desc in critical_fields.items():
    if field in df_real.columns:
        non_null = df_real[field].notna().sum()
        fill_rate = (non_null / len(df_real)) * 100
        status = "✅" if fill_rate > 80 else "⚠️" if fill_rate > 20 else "❌"
        print(f"{status} {desc:<25} ({field}): {fill_rate:.1f}% preenchido")

print(f"\n🔍 ANÁLISE DE QUALIDADE DOS DADOS:")
print("-" * 70)

# CPF
if 'CPF' in df_real.columns:
    cpf_filled = df_real['CPF'].notna().sum()
    cpf_duplicates = df_real['CPF'].dropna().duplicated().sum()
    print(f"   CPF: {cpf_filled:,} preenchidos, {cpf_duplicates} duplicatas")

# Email
if 'E-mail' in df_real.columns:
    email_filled = df_real['E-mail'].notna().sum()
    email_duplicates = df_real['E-mail'].dropna().duplicated().sum()
    print(f"   E-mail: {email_filled:,} preenchidos, {email_duplicates} duplicatas")

# Sexo - valores únicos
if 'Sexo' in df_real.columns:
    sexo_values = df_real['Sexo'].value_counts().to_dict()
    print(f"   Sexo: {sexo_values}")

# UF - valores únicos
if 'UF' in df_real.columns:
    uf_values = df_real['UF'].value_counts().head(10).to_dict()
    print(f"   UF (top 10): {uf_values}")

# Operadoras
if 'Operadora 1' in df_real.columns:
    op_values = df_real['Operadora 1'].value_counts().head(15).to_dict()
    print(f"\n   Operadoras/Convênios (top 15):")
    for op, count in op_values.items():
        print(f"      • {op}: {count:,}")

print(f"\n📅 ANÁLISE DE DATAS:")
print("-" * 70)

if 'Data nascimento' in df_real.columns:
    df_real['Data nascimento'] = pd.to_datetime(df_real['Data nascimento'], errors='coerce')
    valid_dates = df_real['Data nascimento'].notna().sum()
    if valid_dates > 0:
        min_date = df_real['Data nascimento'].min()
        max_date = df_real['Data nascimento'].max()
        print(f"   Data nascimento: {valid_dates:,} válidas")
        print(f"   Mais antigo: {min_date}")
        print(f"   Mais recente: {max_date}")

print(f"\n{'=' * 70}")
print("ANÁLISE CONCLUÍDA")
print(f"{'=' * 70}")
