import dns from 'node:dns'
import express from 'express'
import cors from 'cors'
import ENVIRONMENT from './config/environment.js'
import connectMongoDB from './config/mongodb.js'
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

// Render no tiene salida IPv6: forzamos IPv4 para que las conexiones salientes
// (SMTP de Brevo, etc.) no fallen con ENETUNREACH / Connection timeout.
dns.setDefaultResultOrder('ipv4first')

await connectMongoDB()

const app = express()

// Detras del proxy de Render (1 salto): permite que el rate limit identifique
// la IP real del cliente via X-Forwarded-For en vez de la IP del proxy.
app.set('trust proxy', 1)

// exposedHeaders: deja que el frontend lea los headers de rate limit para
// mostrar el contador de intentos (por defecto CORS no los expone al navegador).
app.use(cors({ exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'] }))
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

app.listen(ENVIRONMENT.PORT, () => {
    console.log(`Servidor Cracks corriendo en ${ENVIRONMENT.URL_BACKEND}`)
})
