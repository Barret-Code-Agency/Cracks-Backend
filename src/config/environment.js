import dotenv from 'dotenv'

dotenv.config()

const ENVIRONMENT = {
    MODE: process.env.MODE || 'development',
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS,
    URL_BACKEND: process.env.URL_BACKEND,
    URL_FRONTEND: process.env.URL_FRONTEND,
    GROQ_API_KEY: process.env.GROQ_API_KEY
}

export default ENVIRONMENT
