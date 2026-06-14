import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import conversationController from '../controllers/conversation.controller.js'
import { validatePrivateConversation, validateMessage } from '../middleware/validate.middleware.js'

const conversationRouter = express.Router()

// Todas las rutas de conversaciones requieren autenticacion
conversationRouter.use(authMiddleware)

conversationRouter.get('/', conversationController.listMine)
conversationRouter.post('/private', validatePrivateConversation, conversationController.createPrivate)
conversationRouter.get('/:conversation_id/messages', conversationController.getMessages)
conversationRouter.post('/:conversation_id/messages', validateMessage, conversationController.sendMessage)
conversationRouter.post('/:conversation_id/bot-reply', validateMessage, conversationController.sendBotReply)

export default conversationRouter
