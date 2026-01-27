/**
 * Serviço de Geração de Relatório PDF de Exames Laboratoriais
 * 
 * Gera um PDF completo com o histórico de exames do paciente
 */

import PDFDocument from 'pdfkit';
import { getPacienteById, listResultadosLaboratoriais } from './db';

interface ExameParaRelatorio {
  nomeExame: string;
  dataColeta: string;
  resultado: string;
  unidade: string | null;
  valorReferencia: string | null;
  foraReferencia: boolean;
  tipoAlteracao: string | null;
}

interface DadosPaciente {
  nome: string;
  dataNascimento: string | null;
  cpf: string | null;
  convenio: string | null;
}

export async function gerarRelatorioPdfExames(
  pacienteId: number,
  tenantId: number
): Promise<Buffer> {
  // Buscar dados do paciente
  const paciente = await getPacienteById(pacienteId, tenantId);

  if (!paciente) {
    throw new Error('Paciente não encontrado');
  }

  // Buscar todos os resultados laboratoriais do paciente
  const resultados = await listResultadosLaboratoriais(pacienteId);

  // Criar documento PDF
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Relatório de Exames - ${paciente.nome}`,
      Author: 'Gorgen - Gestão em Saúde',
      Subject: 'Histórico de Exames Laboratoriais',
      Creator: 'Gorgen System',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  // Cores do Design System Gorgen
  const corPrimaria = '#0056A4';
  const corSecundaria = '#4A6A9A';
  const corTexto = '#333333';
  const corAlterado = '#DC2626';
  const corNormal = '#059669';

  // Cabeçalho
  doc
    .fillColor(corPrimaria)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('GORGEN', 50, 50)
    .fontSize(10)
    .font('Helvetica')
    .fillColor(corSecundaria)
    .text('Gestão em Saúde', 50, 78);

  doc
    .fillColor(corTexto)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Relatório de Exames Laboratoriais', 50, 110);

  // Linha separadora
  doc
    .strokeColor(corPrimaria)
    .lineWidth(2)
    .moveTo(50, 135)
    .lineTo(545, 135)
    .stroke();

  // Dados do paciente
  let yPos = 155;
  
  doc
    .fillColor(corPrimaria)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Dados do Paciente', 50, yPos);

  yPos += 20;

  doc
    .fillColor(corTexto)
    .fontSize(10)
    .font('Helvetica');

  const dadosPaciente = [
    { label: 'Nome:', valor: paciente.nome || 'Não informado' },
    { label: 'Data de Nascimento:', valor: paciente.dataNascimento ? formatarData(paciente.dataNascimento) : 'Não informada' },
    { label: 'CPF:', valor: paciente.cpf || 'Não informado' },
    { label: 'Convênio:', valor: paciente.operadora1 || 'Particular' },
  ];

  for (const dado of dadosPaciente) {
    doc
      .font('Helvetica-Bold')
      .text(dado.label, 50, yPos, { continued: true })
      .font('Helvetica')
      .text(` ${dado.valor}`);
    yPos += 15;
  }

  yPos += 10;

  // Linha separadora
  doc
    .strokeColor(corSecundaria)
    .lineWidth(1)
    .moveTo(50, yPos)
    .lineTo(545, yPos)
    .stroke();

  yPos += 20;

  // Resumo
  doc
    .fillColor(corPrimaria)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Resumo', 50, yPos);

  yPos += 20;

  const totalExames = resultados.length;
  const examesAlterados = resultados.filter(r => r.foraReferencia).length;
  const datasUnicas = new Set(resultados.map(r => r.dataColeta)).size;

  doc
    .fillColor(corTexto)
    .fontSize(10)
    .font('Helvetica')
    .text(`Total de exames registrados: ${totalExames}`, 50, yPos);
  yPos += 15;
  doc.text(`Exames com valores alterados: ${examesAlterados}`, 50, yPos);
  yPos += 15;
  doc.text(`Datas de coleta distintas: ${datasUnicas}`, 50, yPos);
  yPos += 15;
  doc.text(`Data de geração: ${formatarDataHora(new Date())}`, 50, yPos);

  yPos += 25;

  // Tabela de exames
  doc
    .fillColor(corPrimaria)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Histórico de Exames', 50, yPos);

  yPos += 20;

  if (resultados.length === 0) {
    doc
      .fillColor(corTexto)
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('Nenhum exame laboratorial registrado.', 50, yPos);
  } else {
    // Cabeçalho da tabela
    const colunas = {
      data: { x: 50, width: 70 },
      exame: { x: 120, width: 150 },
      resultado: { x: 270, width: 80 },
      unidade: { x: 350, width: 60 },
      referencia: { x: 410, width: 100 },
      status: { x: 510, width: 35 },
    };

    // Fundo do cabeçalho
    doc
      .fillColor(corPrimaria)
      .rect(50, yPos, 495, 18)
      .fill();

    doc
      .fillColor('#FFFFFF')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Data', colunas.data.x + 5, yPos + 5)
      .text('Exame', colunas.exame.x + 5, yPos + 5)
      .text('Resultado', colunas.resultado.x + 5, yPos + 5)
      .text('Unidade', colunas.unidade.x + 5, yPos + 5)
      .text('Referência', colunas.referencia.x + 5, yPos + 5)
      .text('Status', colunas.status.x + 2, yPos + 5);

    yPos += 20;

    // Linhas da tabela
    let linhaAlternada = false;
    for (const exame of resultados) {
      // Verificar se precisa de nova página
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;

        // Repetir cabeçalho da tabela na nova página
        doc
          .fillColor(corPrimaria)
          .rect(50, yPos, 495, 18)
          .fill();

        doc
          .fillColor('#FFFFFF')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('Data', colunas.data.x + 5, yPos + 5)
          .text('Exame', colunas.exame.x + 5, yPos + 5)
          .text('Resultado', colunas.resultado.x + 5, yPos + 5)
          .text('Unidade', colunas.unidade.x + 5, yPos + 5)
          .text('Referência', colunas.referencia.x + 5, yPos + 5)
          .text('Status', colunas.status.x + 2, yPos + 5);

        yPos += 20;
        linhaAlternada = false;
      }

      // Fundo alternado
      if (linhaAlternada) {
        doc
          .fillColor('#F3F4F6')
          .rect(50, yPos, 495, 16)
          .fill();
      }

      // Dados do exame
      doc
        .fillColor(corTexto)
        .fontSize(8)
        .font('Helvetica')
        .text(formatarData(exame.dataColeta), colunas.data.x + 5, yPos + 4, { width: colunas.data.width - 10 })
        .text(truncarTexto(exame.nomeExameOriginal, 25), colunas.exame.x + 5, yPos + 4, { width: colunas.exame.width - 10 })
        .text(exame.resultado || '-', colunas.resultado.x + 5, yPos + 4, { width: colunas.resultado.width - 10 })
        .text(exame.unidade || '-', colunas.unidade.x + 5, yPos + 4, { width: colunas.unidade.width - 10 })
        .text(truncarTexto(exame.valorReferenciaTexto || '-', 15), colunas.referencia.x + 5, yPos + 4, { width: colunas.referencia.width - 10 });

      // Status (alterado ou normal)
      if (exame.foraReferencia) {
        doc
          .fillColor(corAlterado)
          .font('Helvetica-Bold')
          .text(exame.tipoAlteracao === 'Aumentado' ? '↑' : '↓', colunas.status.x + 10, yPos + 4);
      } else {
        doc
          .fillColor(corNormal)
          .font('Helvetica-Bold')
          .text('✓', colunas.status.x + 10, yPos + 4);
      }

      yPos += 16;
      linhaAlternada = !linhaAlternada;
    }
  }

  // Rodapé
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    doc
      .fillColor(corSecundaria)
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Página ${i + 1} de ${totalPages} | Gorgen - Gestão em Saúde | Documento gerado automaticamente`,
        50,
        doc.page.height - 30,
        { align: 'center', width: 495 }
      );
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function formatarData(data: string | Date): string {
  try {
    const d = typeof data === 'string' ? new Date(data) : data;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(data);
  }
}

function formatarDataHora(data: Date): string {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncarTexto(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength - 3) + '...';
}
