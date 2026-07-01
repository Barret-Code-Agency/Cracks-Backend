import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import conversationController from '../controllers/conversation.controller.js'
import { validatePrivateConversation, validateMessage, validateObjectId } from '../middleware/validate.middleware.js'
import { messageLimiter, botReplyLimiter } from '../middleware/rateLimit.middleware.js'

const conversationRouter = express.Router()

// Todas las rutas de conversaciones requieren autenticacion
conversationRouter.use(authMiddleware)

conversationRouter.get('/', conversationController.listMine)
conversationRouter.post('/private', validatePrivateConversation, conversationController.createPrivate)

conversationRouter.get('/:conversation_id/messages', validateObjectId('conversation_id'), conversationController.getMessages)
conversationRouter.post('/:conversation_id/messages', validateObjectId('conversation_id'), messageLimiter, validateMessage, conversationController.sendMessage)
conversationRouter.post('/:conversation_id/bot-reply', validateObjectId('conversation_id'), botReplyLimiter, validateMessage, conversationController.generateBotReply)

conversationRouter.patch('/:conversation_id/messages/:message_id', validateObjectId('conversation_id'), validateObjectId('message_id'), validateMessage, conversationController.editMessage)
conversationRouter.delete('/:conversation_id/messages/:message_id', validateObjectId('conversation_id'), validateObjectId('message_id'), conversationController.deleteMessage)

export default conversationRouter
