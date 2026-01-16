# Debug da Paginação - Pacientes.tsx

## Problema Identificado
O botão de primeira página (⏮️) não está funcionando corretamente. Quando clicado, a página não muda.

## Código Atual (linhas 571-579)
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setPaginaAtual(1)}
  disabled={paginaAtual === 1 || isFetching}
  title="Ir para primeira página"
>
  <ChevronsLeft className="h-4 w-4" />
</Button>
```

## Observações
1. O código parece correto - onClick={() => setPaginaAtual(1)}
2. O botão está desabilitado apenas quando paginaAtual === 1 ou isFetching
3. Quando testado na página 2, o botão deveria estar habilitado

## Possíveis Causas
1. O evento onClick não está sendo disparado
2. O setPaginaAtual não está atualizando o estado
3. Há algum conflito com outro handler de eventos
4. O botão pode estar sendo renderizado como disabled incorretamente

## Testes Realizados
- Página 1 → Página 2 (botão Próxima): ✅ Funciona
- Página 2 → Página 1 (botão Primeira): ❌ Não funciona
- Página 1 → Página 1083 (botão Última): ✅ Funciona
- Página 1083 → Página 1 (botão Primeira): ❌ Não funciona
- Input direto (digitar 500): ✅ Funciona
