import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENT = {
    MODE: process.env.MODE || 'development',
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    TURNSTILE_SECRET: process.env.TURNSTILE_SECRET,
    MAIL_FROM: process.env.MAIL_FROM || 'no-reply@cracks.app',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'Chat de Cracks',
    URL_BACKEND: process.env.URL_BACKEND,
    URL_FRONTEND: process.env.URL_FRONTEND,
    GROQ_API_KEY: process.env.GROQ_API_KEY
}

export default ENVIRONMENT
