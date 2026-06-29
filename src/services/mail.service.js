import mailer_transport from '../config/mailer.config.js'
import ENVIRONMENT from '../config/environment.js'

class MailService {
    async sendVerificationEmail(email, verification_token) {
        const verify_url = `${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email?token=${verification_token}`

        await mailer_transport.sendMail({
            from: `"${ENVIRONMENT.MAIL_FROM_NAME}" <${ENVIRONMENT.MAIL_FROM}>`,
            to: email,
            subject: 'Verificá tu cuenta de CracksApp',
            html: `
                <div style="margin:0; padding:24px 12px; background-color:#f0f2f5; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    <table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; border-collapse:collapse;">
                        <tr>
                            <td style="background-color:#00a884; padding:32px 24px; text-align:center; border-radius:14px 14px 0 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                    <tr>
                                        <td style="background-color:#ffffff; border-radius:14px; padding:4px 18px 10px; text-align:center;">
                                            <span style="color:#00a884; font-size:36px; line-height:1; letter-spacing:7px; font-family:Arial,sans-serif;">&#8226;&#8226;&#8226;</span>
                                        </td>
                                    </tr>
                                </table>
                                <div style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.3px; margin-top:14px;">CracksApp</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#ffffff; padding:40px 32px 36px; text-align:center;">
                                <h1 style="margin:0 0 10px; color:#111b21; font-size:21px; font-weight:600;">¡Bienvenido!</h1>
                                <p style="margin:0 0 30px; color:#667781; font-size:15px; line-height:1.6;">
                                    Estás a un paso de empezar a chatear con los cracks.<br>Confirmá tu correo para activar tu cuenta.
                                </p>
                                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                    <tr>
                                        <td align="center" bgcolor="#00a884" style="border-radius:30px;">
                                            <a href="${verify_url}" style="display:inline-block; padding:15px 46px; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; border-radius:30px;">Verificar mi cuenta</a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:32px 0 0; color:#8696a0; font-size:13px; line-height:1.5;">
                                    Si el botón no funciona, copiá y pegá este enlace:<br>
                                    <a href="${verify_url}" style="color:#00a884; word-break:break-all;">${verify_url}</a>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#ffffff; padding:22px 32px 30px; text-align:center; border-top:1px solid #e9edef; border-radius:0 0 14px 14px;">
                                <p style="margin:0; color:#8696a0; font-size:12px; line-height:1.5;">
                                    Si no creaste esta cuenta, ignorá este mensaje.<br>
                                    CracksApp · Trabajo Integrador Final · UTN
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            `
        })
    }
}

const mailService = new MailService()
export default mailService
