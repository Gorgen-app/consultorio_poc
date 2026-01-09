#!/bin/bash
# Script para testar extração de dados laboratoriais via API

# Documento 90002 - 2760514757_Redacted.pdf
DOCUMENTO_ID=90002

echo "Testando extração de dados laboratoriais para documento $DOCUMENTO_ID..."

# Primeiro, vamos ver o texto OCR atual
echo ""
echo "=== Verificando texto OCR do documento ==="

# Usar a API tRPC para extrair dados
curl -s -X POST "http://localhost:3000/api/trpc/resultadosLaboratoriais.extrairDePdf" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=test" \
  -d "{\"json\":{\"documentoId\":$DOCUMENTO_ID}}" | head -c 2000

echo ""
echo "=== Fim do teste ==="
