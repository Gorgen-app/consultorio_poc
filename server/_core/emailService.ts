import { ENV } from "./env";
import { TRPCError } from "@trpc/server";

export type EmailPayload = {
  destinatario: string;
  assunto: string;
  corpo: string;
  htmlCorpo?: string;
};

/**
 * Envia email através da API de notificação da Manus
 * Usa o email do usuário cadastrado no sistema
 */
export async function enviarEmail(payload: EmailPayload): Promise<boolean> {
  const { destinatario, assunto, corpo, htmlCorpo } = payload;

  if (!destinatario || !assunto || !corpo) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email destinatário, assunto e corpo são obrigatórios.",
    });
  }

  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Serviço de email não está configurado.",
    });
  }

  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Chave de API do serviço de email não está configurada.",
    });
  }

  try {
    const response = await fetch(
      new URL("webdevtoken.v1.WebDevService/SendEmail", ENV.forgeApiUrl).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          to: destinatario,
          subject: assunto,
          text: corpo,
          html: htmlCorpo || corpo,
        }),
      }
    );

    if (!response.ok) {
      console.error(`Email send failed with status ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Envia email para o proprietário do projeto (usando seu email cadastrado)
 */
export async function enviarEmailProprietario(
  assunto: string,
  corpo: string,
  htmlCorpo?: string
): Promise<boolean> {
  // O email do proprietário é armazenado em ENV.OWNER_EMAIL ou pode ser buscado do banco
  // Por enquanto, usamos o email do proprietário do projeto
  const emailProprietario = process.env.OWNER_EMAIL || "contato@andreagorgen.com.br";

  return enviarEmail({
    destinatario: emailProprietario,
    assunto,
    corpo,
    htmlCorpo,
  });
}

/**
 * Envia notificação de novo agendamento
 */
export async function notificarNovoAgendamento(
  emailProprietario: string,
  pacienteNome: string,
  dataHora: string,
  tipoCompromisso: string
): Promise<boolean> {
  const assunto = `[GORGEN] Novo Agendamento - ${pacienteNome}`;
  const corpo = `
Novo agendamento registrado:

Paciente: ${pacienteNome}
Data/Hora: ${dataHora}
Tipo: ${tipoCompromisso}

Acesse o sistema para mais detalhes.
  `.trim();

  const htmlCorpo = `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2 style="color: #333;">Novo Agendamento Registrado</h2>
    <p><strong>Paciente:</strong> ${pacienteNome}</p>
    <p><strong>Data/Hora:</strong> ${dataHora}</p>
    <p><strong>Tipo:</strong> ${tipoCompromisso}</p>
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      Acesse o sistema GORGEN para mais detalhes.
    </p>
  </body>
</html>
  `.trim();

  return enviarEmail({
    destinatario: emailProprietario,
    assunto,
    corpo,
    htmlCorpo,
  });
}

/**
 * Envia notificação de backup completado
 */
export async function notificarBackupCompleto(
  emailProprietario: string,
  dataBackup: string,
  tamanhoBackup: string
): Promise<boolean> {
  const assunto = `[GORGEN] Backup Automático Completo - ${dataBackup}`;
  const corpo = `
Backup automático completado com sucesso!

Data: ${dataBackup}
Tamanho: ${tamanhoBackup}

Seus dados estão seguros e protegidos.
  `.trim();

  const htmlCorpo = `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2 style="color: #28a745;">✓ Backup Automático Completo</h2>
    <p><strong>Data:</strong> ${dataBackup}</p>
    <p><strong>Tamanho:</strong> ${tamanhoBackup}</p>
    <p style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
      Seus dados estão seguros e protegidos no servidor de backup.
    </p>
  </body>
</html>
  `.trim();

  return enviarEmail({
    destinatario: emailProprietario,
    assunto,
    corpo,
    htmlCorpo,
  });
}

/**
 * Envia notificação de erro ou alerta
 */
export async function notificarAlerta(
  emailProprietario: string,
  titulo: string,
  mensagem: string,
  severidade: "info" | "warning" | "error" = "info"
): Promise<boolean> {
  const assunto = `[GORGEN] ${titulo}`;
  const coresMap = {
    info: "#0066cc",
    warning: "#ff9900",
    error: "#cc0000",
  };

  const corpo = `
${titulo}

${mensagem}
  `.trim();

  const htmlCorpo = `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="border-left: 4px solid ${coresMap[severidade]}; padding: 15px; background-color: #f9f9f9;">
      <h2 style="color: ${coresMap[severidade]}; margin-top: 0;">${titulo}</h2>
      <p>${mensagem}</p>
    </div>
  </body>
</html>
  `.trim();

  return enviarEmail({
    destinatario: emailProprietario,
    assunto,
    corpo,
    htmlCorpo,
  });
}
