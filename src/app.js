import express from 'express'
import cors from 'cors'
import ENVIRONMENT from './config/environment.js'
import errorMiddleware from './middleware/error.middleware.js'
import authRouter from './routes/auth.router.js'
import userRouter from './routes/user.router.js'
import contactRouter from './routes/contact.router.js'
import groupRouter from './routes/group.router.js'
import conversationRouter from './routes/conversation.router.js'

// Registramos los modelos en mongoose
import './models/user.model.js'
import './models/contact.model.js'
import './models/conversation.model.js'
import './models/message.model.js'
import './models/group.model.js'
import './models/conversationParticipant.model.js'

// Arma la aplicacion Express (sin conectar a Mongo ni escuchar un puerto).
// Separado de main.js para poder montarla en los tests con Supertest.
const app = express()

// Detras del proxy de Render (1 salto): permite que el rate limit identifique
// la IP real del cliente via X-Forwarded-For en vez de la IP del proxy.
app.set('trust proxy', 1)

// CORS: solo se permite el frontend (la URL configurada, los deploys de Vercel
// y localhost en desarrollo). Las peticiones sin origin (curl, health checks)
// se dejan pasar. exposedHeaders permite que el front lea los headers de rate
// limit para el contador de intentos.
const isAllowedOrigin = (origin) => {
    if (!origin) return true
    if (origin === ENVIRONMENT.URL_FRONTEND) return true
    if (origin.endsWith('.vercel.app')) return true
    if (origin.startsWith('http://localhost')) return true
    return false
}
app.use(cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After']
}))
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (request, response) => {
    response.json({ ok: true, status: 200, message: 'Cracks API funcionando' })
})

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/contacts', contactRouter)
app.use('/api/groups', groupRouter)
app.use('/api/conversations', conversationRouter)

// Manejo centralizado de errores (siempre al final)
app.use(errorMiddleware)

export default app
