// Variables de entorno para los tests. Se setean ANTES de que se cargue
// config/environment.js; dotenv.config() no pisa las que ya existen, así que
// estos valores ganan sobre el .env real.
process.env.MODE = 'development'
process.env.JWT_SECRET = 'test_secret_cracks'
process.env.JWT_EXPIRES_IN = '1d'
process.env.URL_FRONTEND = 'http://localhost:5173'
process.env.URL_BACKEND = 'http://localhost:3000'

// Sin proveedores de mail ni captcha reales: el mailer cae a jsonTransport
// (no envía nada) y Turnstile queda desactivado.
process.env.BREVO_API_KEY = ''
process.env.SMTP_HOST = ''
process.env.SMTP_USER = ''
process.env.SMTP_PASS = ''
process.env.TURNSTILE_SECRET = ''
