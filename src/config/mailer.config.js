import nodemailer from 'nodemailer'
import ENVIRONMENT from './environment.js'

// Con credenciales de Gmail usa Gmail; sin ellas (dev) usa un transporte que no envia.
const mailer_transport = ENVIRONMENT.GMAIL_USER && ENVIRONMENT.GMAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: ENVIRONMENT.GMAIL_USER, pass: ENVIRONMENT.GMAIL_PASS }
    })
    : nodemailer.createTransport({ jsonTransport: true })

export default mailer_transport
