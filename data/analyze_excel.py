import pandas as pd
import json
from datetime import datetime

# Carregar o arquivo Excel
print("=" * 60)
print("ANÁLISE DA PLANILHA DE PACIENTES")
print("=" * 60)

# Verificar abas disponíveis
xlsx = pd.ExcelFile('/home/ubuntu/consultorio_poc/data/22kpacientes.xlsx')
print(f"\n📋 ABAS ENCONTRADAS: {len(xlsx.sheet_names)}")
for i, sheet in enumerate(xlsx.sheet_names):
    print(f"   {i+1}. {sheet}")

# Analisar cada aba
for sheet_name in xlsx.sheet_names:
    print(f"\n{'=' * 60}")
    print(f"📊 ABA: {sheet_name}")
    print("=" * 60)
    
    df = pd.read_excel(xlsx, sheet_name=sheet_name)
    
    print(f"\n📈 ESTATÍSTICAS GERAIS:")
    print(f"   • Total de linhas: {len(df):,}")
    print(f"   • Total de colunas: {len(df.columns)}")
    
    print(f"\n📝 COLUNAS ENCONTRADAS ({len(df.columns)}):")
    print("-" * 60)
    
    for col in df.columns:
        dtype = str(df[col].dtype)
        non_null = df[col].notna().sum()
        null_count = df[col].isna().sum()
        fill_rate = (non_null / len(df)) * 100 if len(df) > 0 else 0
        
        # Amostra de valores únicos
        unique_count = df[col].nunique()
        sample_values = df[col].dropna().head(3).tolist()
        sample_str = str(sample_values)[:50] + "..." if len(str(sample_values)) > 50 else str(sample_values)
        
        print(f"\n   📌 {col}")
        print(f"      Tipo: {dtype} | Preenchidos: {non_null:,} ({fill_rate:.1f}%) | Únicos: {unique_count:,}")
        print(f"      Amostra: {sample_str}")

    # Verificar duplicatas por campos-chave comuns
    print(f"\n🔍 ANÁLISE DE DUPLICATAS:")
    
    # Tentar identificar campos de identificação
    id_fields = [col for col in df.columns if any(x in col.lower() for x in ['cpf', 'id', 'codigo', 'código', 'matricula', 'matrícula'])]
    
    for field in id_fields:
        if field in df.columns:
            duplicates = df[field].dropna().duplicated().sum()
            print(f"   • {field}: {duplicates:,} duplicatas")

    # Primeiras 5 linhas como amostra
    print(f"\n📋 AMOSTRA (primeiras 5 linhas):")
    print("-" * 60)
    print(df.head().to_string())

print("\n" + "=" * 60)
print("ANÁLISE CONCLUÍDA")
print("=" * 60)
