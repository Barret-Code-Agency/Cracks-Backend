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

await connectMongoDB()

const app = express()

app.use(cors())
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
