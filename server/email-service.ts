/**
 * Serviço de Envio de E-mail para o Gorgen
 * Utiliza a API de notificação do Manus para enviar e-mails
 */

import { ENV } from "./_core/env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envia um e-mail usando a API de notificação do Manus
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options;

  try {
    const response = await fetch(`${ENV.forgeApiUrl}/notification/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Fallback para texto plano
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Email Service] Erro ao enviar e-mail: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Erro HTTP ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();
    console.log(`[Email Service] E-mail enviado com sucesso para ${to}`);
    
    return {
      success: true,
      messageId: result.messageId || result.id,
    };
  } catch (error) {
    console.error(`[Email Service] Exceção ao enviar e-mail:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia e-mail de recuperação de senha
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string
): Promise<EmailResult> {
  const subject = "🔐 Recuperação de Senha - GORGEN";
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0056A4 0%, #002B49 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.1); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🏥</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">GORGEN</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 14px;">Gestão em Saúde</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #002B49; margin: 0 0 20px; font-size: 24px;">Olá, ${userName || "Usuário"}!</h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Recebemos uma solicitação para redefinir a senha da sua conta no GORGEN. 
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background-color: #0056A4; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Redefinir Minha Senha
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Se você não solicitou esta alteração, pode ignorar este e-mail com segurança. 
                Sua senha permanecerá inalterada.
              </p>
              
              <div style="background-color: #f7fafc; border-left: 4px solid #0056A4; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #4a5568; font-size: 14px; margin: 0;">
                  <strong>⏰ Importante:</strong> Este link expira em <strong>1 hora</strong>.
                </p>
              </div>
              
              <p style="color: #a0aec0; font-size: 12px; margin: 20px 0 0;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${resetUrl}" style="color: #0056A4; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="color: #718096; font-size: 12px; margin: 0 0 10px;">
                © 2026 GORGEN. Todos os direitos reservados.
              </p>
              <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                Paciente no centro do cuidado.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Olá, ${userName || "Usuário"}!

Recebemos uma solicitação para redefinir a senha da sua conta no GORGEN.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.

⏰ Importante: Este link expira em 1 hora.

---
© 2026 GORGEN. Todos os direitos reservados.
Paciente no centro do cuidado.
  `.trim();

  return sendEmail({ to, subject, html, text });
}

/**
 * Envia e-mail de boas-vindas após registro
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<EmailResult> {
  const subject = "🎉 Bem-vindo ao GORGEN!";
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao GORGEN</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0056A4 0%, #002B49 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Bem-vindo ao GORGEN!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #002B49; margin: 0 0 20px; font-size: 24px;">Olá, ${userName}!</h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sua conta foi criada com sucesso! Agora você faz parte de uma nova era na gestão em saúde.
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Com o GORGEN, você terá acesso a:
              </p>
              
              <ul style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
                <li>📋 Prontuário eletrônico completo</li>
                <li>📅 Agendamento inteligente</li>
                <li>🔒 Segurança de dados com criptografia AES-256</li>
                <li>📊 Relatórios e análises</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.gorgen.com.br/login" 
                   style="display: inline-block; background-color: #0056A4; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Acessar Minha Conta
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="color: #718096; font-size: 12px; margin: 0 0 10px;">
                © 2026 GORGEN. Todos os direitos reservados.
              </p>
              <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                Paciente no centro do cuidado.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, html });
}
