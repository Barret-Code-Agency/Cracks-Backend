import nodemailer from 'nodemailer'
import ENVIRONMENT from './environment.js'

// Transporte SMTP generico (en produccion se configura con el relay de Brevo, que
// funciona desde servidores como Render; Gmail bloquea las IPs de hosting).
// Sin credenciales SMTP (dev) usa jsonTransport: no envia, pero no rompe el flujo.
const hasSmtp = ENVIRONMENT.SMTP_HOST && ENVIRONMENT.SMTP_USER && ENVIRONMENT.SMTP_PASS

const mailer_transport = hasSmtp
    ? nodemailer.createTransport({
        host: ENVIRONMENT.SMTP_HOST,
        port: Number(ENVIRONMENT.SMTP_PORT) || 587,
        secure: false,
        auth: { user: ENVIRONMENT.SMTP_USER, pass: ENVIRONMENT.SMTP_PASS },
        family: 4, // Render no tiene salida IPv6 -> forzar IPv4 en el socket
        // Timeouts para que un SMTP caido no cuelgue el envio indefinidamente
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    })
    : nodemailer.createTransport({ jsonTransport: true })

export default mailer_transport
