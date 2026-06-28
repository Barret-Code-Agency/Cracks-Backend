import mailer_transport from '../config/mailer.config.js'
import ENVIRONMENT from '../config/environment.js'

class MailService {
    async sendVerificationEmail(email, verification_token) {
        const verify_url = `${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email?token=${verification_token}`

        await mailer_transport.sendMail({
            from: `"${ENVIRONMENT.MAIL_FROM_NAME}" <${ENVIRONMENT.MAIL_FROM}>`,
            to: email,
            subject: 'Verifica tu cuenta de Chat de Cracks',
            html: `
                <div style="font-family: Arial; padding: 24px; text-align: center;">
                    <h2>Bienvenido a Chat de Cracks</h2>
                    <p>Confirma tu correo para empezar a chatear.</p>
                    <a href="${verify_url}" style="display:inline-block; background:#25D366; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Verificar mi cuenta</a>
                    <p style="margin-top:28px; color:#888; font-size:13px;">Trabajo final UTN · Fullstack developer</p>
                </div>
            `
        })
    }
}

const mailService = new MailService()
export default mailService
