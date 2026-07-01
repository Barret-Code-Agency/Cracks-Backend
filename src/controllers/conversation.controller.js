import conversationService from '../services/conversation.service.js'

class ConversationController {
    async createPrivate(request, response) {
        const conversation = await conversationService.findOrCreatePrivate(
            request.user.user_id,
            request.body.user_id
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Conversacion lista',
            data: { conversation }
        })
    }

    async listMine(request, response) {
        const conversations = await conversationService.listMyConversations(request.user.user_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Conversaciones obtenidas',
            data: { conversations }
        })
    }

    async sendMessage(request, response) {
        const message = await conversationService.sendMessage(
            request.params.conversation_id,
            request.user.user_id,
            request.body.content
        )
        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Mensaje enviado',
            data: { message }
        })
    }

    async generateBotReply(request, response) {
        const message = await conversationService.generateBotReply(
            request.params.conversation_id,
            request.user.user_id,
            request.body.content
        )
        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Respuesta del crack enviada',
            data: { message }
        })
    }

    async getMessages(request, response) {
        const messages = await conversationService.getMessages(
            request.params.conversation_id,
            request.user.user_id,
            { limit: request.query.limit, before: request.query.before }
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Mensajes obtenidos',
            data: { messages }
        })
    }

    async editMessage(request, response) {
        const message = await conversationService.editMessage(
            request.params.conversation_id,
            request.params.message_id,
            request.user.user_id,
            request.body.content
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Mensaje editado',
            data: { message }
        })
    }

    async deleteMessage(request, response) {
        const message_id = await conversationService.deleteMessage(
            request.params.conversation_id,
            request.params.message_id,
            request.user.user_id
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Mensaje eliminado',
            data: { message_id }
        })
    }
}

const conversationController = new ConversationController()
export default conversationController
