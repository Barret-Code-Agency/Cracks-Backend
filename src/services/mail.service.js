import mailer_transport from '../config/mailer.config.js'
import ENVIRONMENT from '../config/environment.js'
import { EXTERNAL_API } from '../constants/external.constant.js'

const SUBJECT_VERIFICATION = 'Verificá tu cuenta de CracksApp'
const SUBJECT_RESET = 'Restablecé tu contraseña de CracksApp'

// Plantilla del email de verificación (HTML inline, compatible con Gmail/Outlook).
const buildVerificationHtml = (verify_url) => `
                <div style="margin:0; padding:32px 12px; background-color:#eae6df; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; border-collapse:separate;">
                        <tr>
                            <td style="background:linear-gradient(135deg,#008f72 0%,#00a884 100%); background-color:#00a884; padding:40px 24px 34px; text-align:center; border-radius:16px 16px 0 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                    <tr>
                                        <td style="background-color:#ffffff; border-radius:22px 22px 22px 4px; padding:13px 22px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.12);">
                                            <span style="color:#00a884; font-size:30px; line-height:1; letter-spacing:6px; font-family:Arial,sans-serif;">&#8226;&#8226;&#8226;</span>
                                        </td>
                                    </tr>
                                </table>
                                <div style="color:#ffffff; font-size:24px; font-weight:700; letter-spacing:0.3px; margin-top:18px;">CracksApp</div>
                                <div style="color:#d4f5ec; font-size:13px; font-weight:400; margin-top:4px;">Un lugar para chatear con los cracks y entre usuarios</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#ffffff; padding:40px 36px 34px; text-align:center;">
                                <h1 style="margin:0 0 12px; color:#111b21; font-size:22px; font-weight:600;">¡Estás a un paso! &#128075;</h1>
                                <p style="margin:0 0 30px; color:#667781; font-size:15px; line-height:1.65;">
                                    Confirmá tu correo para activar tu cuenta y empezar a chatear con los cracks.
                                </p>
                                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                    <tr>
                                        <td align="center">
                                            <!--[if mso]>
                                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verify_url}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="58%" stroke="f" fillcolor="#00a884">
                                            <w:anchorlock/>
                                            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Verificar mi cuenta</center>
                                            </v:roundrect>
                                            <![endif]-->
                                            <!--[if !mso]><!-->
                                            <a href="${verify_url}" style="display:inline-block; padding:16px 50px; background-color:#00a884; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; border-radius:30px; box-shadow:0 4px 12px rgba(0,168,132,0.35);">Verificar mi cuenta</a>
                                            <!--<![endif]-->
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:22px 0 0; color:#8696a0; font-size:13px; line-height:1.5;">
                                    &#9201;&#65039; Este link caduca en 24 horas.
                                </p>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                    <tr><td style="border-top:1px solid #e9edef; font-size:0; line-height:0;">&nbsp;</td></tr>
                                </table>
                                <p style="margin:24px 0 0; color:#8696a0; font-size:12px; line-height:1.5;">
                                    Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
                                    <a href="${verify_url}" style="color:#00a884; word-break:break-all;">${verify_url}</a>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#f7f8fa; padding:22px 32px 28px; text-align:center; border-top:1px solid #e9edef; border-radius:0 0 16px 16px;">
                                <p style="margin:0; color:#8696a0; font-size:12px; line-height:1.6;">
                                    Si no creaste esta cuenta, podés ignorar este mensaje.<br>
                                    <span style="color:#b0bac2;">CracksApp &middot; Trabajo Integrador Final &middot; UTN</span>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            `

// Plantilla del email de recuperación de contraseña. Misma estética que el de
// verificación; el botón lleva a la pantalla del frontend donde se elige la nueva clave.
const buildResetHtml = (reset_url) => `
                <div style="margin:0; padding:32px 12px; background-color:#eae6df; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; border-collapse:separate;">
                        <tr>
                            <td style="background:linear-gradient(135deg,#008f72 0%,#00a884 100%); background-color:#00a884; padding:40px 24px 34px; text-align:center; border-radius:16px 16px 0 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                    <tr>
                                        <td style="background-color:#ffffff; border-radius:22px 22px 22px 4px; padding:13px 22px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.12);">
                                            <span style="color:#00a884; font-size:30px; line-height:1; letter-spacing:6px; font-family:Arial,sans-serif;">&#8226;&#8226;&#8226;</span>
                                        </td>
                                    </tr>
                                </table>
                                <div style="color:#ffffff; font-size:24px; font-weight:700; letter-spacing:0.3px; margin-top:18px;">CracksApp</div>
                                <div style="color:#d4f5ec; font-size:13px; font-weight:400; margin-top:4px;">Un lugar para chatear con los cracks y entre usuarios</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#ffffff; padding:40px 36px 34px; text-align:center;">
                                <h1 style="margin:0 0 12px; color:#111b21; font-size:22px; font-weight:600;">&#128273; Recuperá tu contraseña</h1>
                                <p style="margin:0 0 30px; color:#667781; font-size:15px; line-height:1.65;">
                                    Pediste restablecer tu contraseña. Tocá el botón para elegir una nueva.
                                </p>
                                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                    <tr>
                                        <td align="center">
                                            <!--[if mso]>
                                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${reset_url}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="58%" stroke="f" fillcolor="#00a884">
                                            <w:anchorlock/>
                                            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Restablecer contraseña</center>
                                            </v:roundrect>
                                            <![endif]-->
                                            <!--[if !mso]><!-->
                                            <a href="${reset_url}" style="display:inline-block; padding:16px 44px; background-color:#00a884; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; border-radius:30px; box-shadow:0 4px 12px rgba(0,168,132,0.35);">Restablecer contraseña</a>
                                            <!--<![endif]-->
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:22px 0 0; color:#8696a0; font-size:13px; line-height:1.5;">
                                    &#9201;&#65039; Este link caduca en 30 minutos.
                                </p>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                    <tr><td style="border-top:1px solid #e9edef; font-size:0; line-height:0;">&nbsp;</td></tr>
                                </table>
                                <p style="margin:24px 0 0; color:#8696a0; font-size:12px; line-height:1.5;">
                                    Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
                                    <a href="${reset_url}" style="color:#00a884; word-break:break-all;">${reset_url}</a>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#f7f8fa; padding:22px 32px 28px; text-align:center; border-top:1px solid #e9edef; border-radius:0 0 16px 16px;">
                                <p style="margin:0; color:#8696a0; font-size:12px; line-height:1.6;">
                                    Si no pediste restablecer tu contraseña, ignorá este mensaje: tu clave no cambia.<br>
                                    <span style="color:#b0bac2;">CracksApp &middot; Trabajo Integrador Final &middot; UTN</span>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            `

class MailService {
    async sendVerificationEmail(email, verification_token) {
        const verify_url = `${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email?token=${verification_token}`
        return this.send(email, SUBJECT_VERIFICATION, buildVerificationHtml(verify_url))
    }

    async sendPasswordResetEmail(email, reset_token) {
        const reset_url = `${ENVIRONMENT.URL_FRONTEND}/reset-password?token=${reset_token}`
        return this.send(email, SUBJECT_RESET, buildResetHtml(reset_url))
    }

    // En hostings como Render (plan free) las conexiones SMTP salientes suelen
    // dar "Connection timeout". Si hay API key de Brevo, enviamos por su API HTTP
    // (puerto 443, nunca bloqueado). Si no, caemos al SMTP (útil en local).
    async send(email, subject, html) {
        if (ENVIRONMENT.BREVO_API_KEY) {
            return this.sendViaBrevoApi(email, subject, html)
        }
        return this.sendViaSmtp(email, subject, html)
    }

    async sendViaBrevoApi(email, subject, html) {
        const response = await fetch(EXTERNAL_API.BREVO_EMAIL, {
            method: 'POST',
            headers: {
                'api-key': ENVIRONMENT.BREVO_API_KEY,
                'accept': 'application/json',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: ENVIRONMENT.MAIL_FROM_NAME, email: ENVIRONMENT.MAIL_FROM },
                to: [{ email }],
                subject,
                htmlContent: html
            })
        })

        if (!response.ok) {
            const detail = await response.text()
            throw new Error(`Brevo API respondio ${response.status}: ${detail}`)
        }
    }

    async sendViaSmtp(email, subject, html) {
        await mailer_transport.sendMail({
            from: `"${ENVIRONMENT.MAIL_FROM_NAME}" <${ENVIRONMENT.MAIL_FROM}>`,
            to: email,
            subject,
            html
        })
    }
}

const mailService = new MailService()
export default mailService
