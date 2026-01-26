# Fluxo de Processamento de Exames - Gorgen System

## Diagrama de Fluxo Detalhado

```mermaid
flowchart TB
    subgraph INPUT["📥 ENTRADA"]
        A[/"PDFs de Exames"/]
        A --> B{{"Validação PDF"}}
        B -->|"Inválido/Corrompido"| SKIP1["❌ Ignorar arquivo"]
        B -->|"Válido"| C["Extrair texto<br/>(primeiros 1000 chars)"]
    end

    subgraph QUICK_FILTER["⚡ FILTRO RÁPIDO (~5ms)"]
        C --> D{{"Detecção de<br/>Não-Exames"}}
        D -->|"Receita"| SKIP2["❌ RECEITA<br/>Ignorar"]
        D -->|"Solicitação"| SKIP3["❌ SOLICITAÇÃO<br/>Ignorar"]
        D -->|"Extrato"| SKIP4["❌ EXTRATO<br/>Ignorar"]
        D -->|"Guia"| SKIP5["❌ GUIA<br/>Ignorar"]
        D -->|"Atestado"| SKIP6["❌ ATESTADO<br/>Ignorar"]
        D -->|"Possível Exame"| E["Continuar análise"]
        D -->|"Incerto"| E
    end

    subgraph CLASSIFICATION["🏷️ CLASSIFICAÇÃO (~50ms)"]
        E --> F{{"Identificar Tipo<br/>de Documento"}}
        F -->|"Laboratorial"| G1["🧪 LABORATORIAL"]
        F -->|"Imagem"| G2["📷 IMAGEM"]
        F -->|"Anatomopatológico"| G3["🔬 ANATOMOPATOLÓGICO"]
        F -->|"Laudo Evolutivo"| G4["📊 LAUDO EVOLUTIVO"]
        F -->|"Desconhecido"| G5["❓ ANÁLISE PROFUNDA"]
        
        G1 --> H{{"Detectar<br/>Laboratório"}}
        G2 --> H
        G3 --> H
        G4 --> H
        G5 --> H
    end

    subgraph LAB_CACHE["💾 CACHE DE LABORATÓRIOS"]
        H -->|"Weinmann"| L1["📋 Formato Weinmann<br/>• Layout padrão<br/>• Mapeamento exames<br/>• Refs padrão"]
        H -->|"Iberleo"| L2["📋 Formato Iberleo"]
        H -->|"UNILAB"| L3["📋 Formato UNILAB"]
        H -->|"Inst. Patologia"| L4["📋 Formato Patologia"]
        H -->|"Outro/Novo"| L5["📋 Formato Genérico"]
        
        L1 --> I["Aplicar formato<br/>do laboratório"]
        L2 --> I
        L3 --> I
        L4 --> I
        L5 --> I
    end

    subgraph GROUPING["📦 AGRUPAMENTO"]
        I --> J{{"Agrupar por<br/>Tipo + Lab"}}
        J --> K1["Grupo: Lab + Tipo 1"]
        J --> K2["Grupo: Lab + Tipo 2"]
        J --> K3["Grupo: Lab + Tipo N"]
        
        K1 --> M["Ordenar por<br/>prioridade"]
        K2 --> M
        K3 --> M
    end

    subgraph BATCH_PROCESS["⚙️ PROCESSAMENTO EM LOTE"]
        M --> N{{"Para cada<br/>grupo"}}
        
        N --> O1["Processar<br/>Laboratoriais"]
        N --> O2["Processar<br/>Imagens"]
        N --> O3["Processar<br/>Anatomopatológicos"]
        N --> O4["Processar<br/>Laudos Evolutivos"]
        
        O1 --> P1["Extrair:<br/>• Nome exame<br/>• Resultado<br/>• Unidade<br/>• Referência<br/>• Data"]
        
        O2 --> P2["Extrair:<br/>• Tipo imagem<br/>• Região<br/>• Conclusão<br/>• Achados"]
        
        O3 --> P3["Extrair:<br/>• Espécime<br/>• Diagnóstico<br/>• Margens<br/>• Estadiamento"]
        
        O4 --> P4["Extrair:<br/>• Múltiplas datas<br/>• Histórico valores<br/>• Tendências"]
    end

    subgraph PATIENT_INDEX["👤 ÍNDICE DE PACIENTES"]
        P1 --> Q{{"Paciente já<br/>existe?"}}
        P2 --> Q
        P3 --> Q
        P4 --> Q
        
        Q -->|"Sim"| R1["Atualizar tabela<br/>existente"]
        Q -->|"Não"| R2["Criar nova<br/>tabela"]
        
        R1 --> S["Merge de dados<br/>longitudinais"]
        R2 --> S
    end

    subgraph NORMALIZATION["🔄 NORMALIZAÇÃO"]
        S --> T["Normalizar nomes<br/>de exames"]
        T --> U["Padronizar<br/>unidades"]
        U --> V["Verificar valores<br/>de referência"]
        V --> W{{"Valor<br/>alterado?"}}
        W -->|"Sim"| X1["⚠️ Marcar como<br/>ALTERADO"]
        W -->|"Não"| X2["✅ Normal"]
        X1 --> Y["Consolidar<br/>resultados"]
        X2 --> Y
    end

    subgraph OUTPUT["📤 SAÍDA"]
        Y --> Z1["📊 Tabela CSV<br/>Exames x Datas"]
        Y --> Z2["📈 Estatísticas<br/>de Processamento"]
        Y --> Z3["📝 Log de<br/>Erros/Ignorados"]
        
        Z1 --> AA["Atualizar<br/>Patient Index"]
        Z2 --> AB["Atualizar<br/>Lab Stats"]
        Z3 --> AC["Registrar<br/>Aprendizados"]
    end

    subgraph STATS["📊 MÉTRICAS"]
        AA --> BB["Tempo total"]
        AB --> BB
        AC --> BB
        BB --> CC["Exames/minuto"]
        CC --> DD["Taxa de sucesso"]
    end

    style INPUT fill:#e1f5fe
    style QUICK_FILTER fill:#fff3e0
    style CLASSIFICATION fill:#f3e5f5
    style LAB_CACHE fill:#e8f5e9
    style GROUPING fill:#fce4ec
    style BATCH_PROCESS fill:#e3f2fd
    style PATIENT_INDEX fill:#fff8e1
    style NORMALIZATION fill:#f1f8e9
    style OUTPUT fill:#e0f2f1
    style STATS fill:#fafafa
    
    style SKIP1 fill:#ffcdd2
    style SKIP2 fill:#ffcdd2
    style SKIP3 fill:#ffcdd2
    style SKIP4 fill:#ffcdd2
    style SKIP5 fill:#ffcdd2
    style SKIP6 fill:#ffcdd2
    style X1 fill:#fff9c4
```

## Diagrama de Sequência - Processamento Individual

```mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Sistema
    participant QF as QuickFilter
    participant CL as Classifier
    participant LC as LabCache
    participant BP as BatchProcessor
    participant PI as PatientIndex
    participant DB as Database

    U->>S: Upload PDF(s)
    activate S
    
    S->>S: Validar PDF (magic bytes)
    alt PDF Inválido
        S-->>U: ❌ Arquivo corrompido
    end
    
    S->>QF: Filtro rápido (1000 chars)
    activate QF
    QF->>QF: Verificar padrões exclusão
    alt É Receita/Solicitação/Extrato
        QF-->>S: SKIP + motivo
        S-->>U: ⏭️ Documento ignorado
    else Possível exame
        QF-->>S: PROCESS
    end
    deactivate QF
    
    S->>CL: Classificar documento
    activate CL
    CL->>CL: Identificar tipo
    CL->>CL: Extrair metadados
    CL-->>S: Tipo + Lab + Paciente + Data
    deactivate CL
    
    S->>LC: Buscar formato laboratório
    activate LC
    LC->>LC: Lookup O(1) no cache
    LC-->>S: LaboratoryFormat
    deactivate LC
    
    S->>PI: Verificar paciente
    activate PI
    PI->>PI: Lookup O(1) no índice
    alt Paciente existe
        PI-->>S: Tabela existente
    else Novo paciente
        PI-->>S: Criar nova tabela
    end
    deactivate PI
    
    S->>BP: Processar documento
    activate BP
    BP->>BP: Aplicar formato lab
    BP->>BP: Extrair exames
    BP->>BP: Normalizar nomes
    BP->>BP: Verificar referências
    BP-->>S: ExtractionResult[]
    deactivate BP
    
    S->>PI: Atualizar índice
    S->>LC: Atualizar stats lab
    S->>DB: Salvar resultados
    
    S-->>U: ✅ Tabela atualizada
    deactivate S
```

## Diagrama de Estados - Documento

```mermaid
stateDiagram-v2
    [*] --> Recebido: Upload
    
    Recebido --> Validando: Iniciar processamento
    
    Validando --> Invalido: PDF corrompido
    Validando --> Filtrando: PDF válido
    
    Invalido --> [*]: Ignorar
    
    Filtrando --> Ignorado: Não é exame
    Filtrando --> Classificando: Possível exame
    
    Ignorado --> [*]: Log motivo
    
    Classificando --> Laboratorial: Tipo identificado
    Classificando --> Imagem: Tipo identificado
    Classificando --> Anatomopatologico: Tipo identificado
    Classificando --> LaudoEvolutivo: Tipo identificado
    Classificando --> Desconhecido: Tipo não identificado
    
    Laboratorial --> Processando
    Imagem --> Processando
    Anatomopatologico --> Processando
    LaudoEvolutivo --> Processando
    Desconhecido --> Processando
    
    Processando --> Extraindo: Aplicar formato lab
    
    Extraindo --> Normalizando: Exames extraídos
    Extraindo --> Erro: Falha na extração
    
    Erro --> [*]: Log erro
    
    Normalizando --> Verificando: Nomes padronizados
    
    Verificando --> Consolidado: Referências verificadas
    
    Consolidado --> Atualizado: Paciente existente
    Consolidado --> Criado: Novo paciente
    
    Atualizado --> [*]: Tabela atualizada
    Criado --> [*]: Nova tabela criada
```

## Arquitetura de Módulos

```mermaid
graph LR
    subgraph Core["🎯 Core"]
        A[pdf-classifier.ts]
        B[laboratory-cache.ts]
        C[quick-filter.ts]
        D[batch-processor.ts]
    end
    
    subgraph Utils["🔧 Utilities"]
        E[patient-index.ts]
        F[exam-normalizer.ts]
        G[reference-checker.ts]
    end
    
    subgraph Data["💾 Data"]
        H[(Lab Formats)]
        I[(Patient Index)]
        J[(Exam Mappings)]
    end
    
    A --> B
    A --> C
    D --> A
    D --> B
    D --> C
    D --> E
    D --> F
    D --> G
    
    B --> H
    E --> I
    F --> J
    
    style Core fill:#e3f2fd
    style Utils fill:#f3e5f5
    style Data fill:#e8f5e9
```

## Métricas de Performance por Fase

| Fase | Tempo Médio | Complexidade | Descrição |
|------|-------------|--------------|-----------|
| Validação PDF | 1-2ms | O(1) | Verificar magic bytes |
| Filtro Rápido | 3-5ms | O(n) | Buscar padrões em 1000 chars |
| Classificação | 20-50ms | O(n) | Análise completa do texto |
| Cache Lookup | <1ms | O(1) | Buscar formato do laboratório |
| Patient Index | <1ms | O(1) | Verificar paciente existente |
| Extração | 100-500ms | O(n) | Extrair exames do documento |
| Normalização | 10-20ms | O(m) | Padronizar m exames |
| Consolidação | 5-10ms | O(m) | Merge com dados existentes |

**Total estimado por documento:** 150-600ms (dependendo do tamanho e tipo)

## Prioridades de Processamento

| Prioridade | Tipo | Justificativa |
|------------|------|---------------|
| 1 (Máxima) | Laudo Evolutivo | Dados históricos valiosos |
| 2 | Laboratorial | Alta frequência, muitos exames |
| 2 | Anatomopatológico | Diagnósticos críticos |
| 3 | Imagem | Menor densidade de dados |
| 4 | Desconhecido | Requer análise adicional |
| 5 (Mínima) | Não-exames | Ignorar |
