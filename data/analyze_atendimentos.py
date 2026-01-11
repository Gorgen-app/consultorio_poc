#!/usr/bin/env python3
"""
Script para analisar a planilha de atendimentos 2025-2026
"""

import pandas as pd
from datetime import datetime
import json

# Carregar planilha
print("=" * 60)
print("ANÁLISE DA PLANILHA DE ATENDIMENTOS 2025-2026")
print("=" * 60)

# Tentar ler o arquivo Excel
try:
    # Primeiro, ver todas as abas
    xl = pd.ExcelFile('/home/ubuntu/consultorio_poc/data/atendimentos2025-2026.xlsx')
    print(f"\n📋 ABAS ENCONTRADAS: {xl.sheet_names}")
    
    # Ler cada aba
    for sheet_name in xl.sheet_names:
        print(f"\n{'=' * 60}")
        print(f"📊 ABA: {sheet_name}")
        print("=" * 60)
        
        df = pd.read_excel(xl, sheet_name=sheet_name)
        
        print(f"\n📈 DIMENSÕES: {len(df)} linhas x {len(df.columns)} colunas")
        
        print(f"\n📝 COLUNAS ENCONTRADAS:")
        for i, col in enumerate(df.columns):
            dtype = df[col].dtype
            non_null = df[col].notna().sum()
            pct = (non_null / len(df)) * 100 if len(df) > 0 else 0
            print(f"  {i+1}. {col} ({dtype}) - {non_null} preenchidos ({pct:.1f}%)")
        
        print(f"\n🔍 AMOSTRA (primeiras 5 linhas):")
        print(df.head().to_string())
        
        print(f"\n🔍 AMOSTRA (últimas 5 linhas):")
        print(df.tail().to_string())
        
        # Análise de valores únicos para colunas categóricas
        print(f"\n📊 VALORES ÚNICOS POR COLUNA:")
        for col in df.columns:
            unique_count = df[col].nunique()
            if unique_count <= 50:  # Mostrar valores se houver poucos
                unique_vals = df[col].dropna().unique()
                print(f"\n  {col}: {unique_count} valores únicos")
                if unique_count <= 20:
                    # Mostrar contagem
                    value_counts = df[col].value_counts().head(20)
                    for val, count in value_counts.items():
                        print(f"    - {val}: {count}")
            else:
                print(f"\n  {col}: {unique_count} valores únicos (muitos para listar)")
        
        # Análise de datas se houver colunas de data
        date_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        for col in df.columns:
            if 'data' in col.lower() or 'date' in col.lower():
                if col not in date_cols:
                    date_cols.append(col)
        
        if date_cols:
            print(f"\n📅 ANÁLISE DE DATAS:")
            for col in date_cols:
                try:
                    dates = pd.to_datetime(df[col], errors='coerce')
                    valid_dates = dates.dropna()
                    if len(valid_dates) > 0:
                        print(f"\n  {col}:")
                        print(f"    - Primeira data: {valid_dates.min()}")
                        print(f"    - Última data: {valid_dates.max()}")
                        print(f"    - Datas válidas: {len(valid_dates)} ({len(valid_dates)/len(df)*100:.1f}%)")
                        
                        # Distribuição por ano/mês
                        if len(valid_dates) > 0:
                            year_month = valid_dates.dt.to_period('M').value_counts().sort_index()
                            print(f"    - Distribuição por mês:")
                            for period, count in year_month.items():
                                print(f"      {period}: {count} atendimentos")
                except Exception as e:
                    print(f"  Erro ao analisar {col}: {e}")

except Exception as e:
    print(f"❌ ERRO: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("FIM DA ANÁLISE")
print("=" * 60)
