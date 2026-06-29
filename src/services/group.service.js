import groupRepository from '../repositories/group.repository.js'
import conversationRepository from '../repositories/conversation.repository.js'
import participantRepository from '../repositories/participant.repository.js'
import userRepository from '../repositories/user.repository.js'
import ServerError from '../utils/serverError.js'
import { CONVERSATION_TYPE } from '../constants/conversation.constant.js'
import { PARTICIPANT_ROLE } from '../constants/participant.constant.js'

const MANAGER_ROLES = [PARTICIPANT_ROLE.ADMIN, PARTICIPANT_ROLE.CO_ADMIN]

class GroupService {
    // Verifica que el usuario sea participante activo y, si se pasan roles, que tenga uno permitido
    async assertRole(conversation_id, user_id, allowed_roles) {
        const participant = await participantRepository.findActive(conversation_id, user_id)
        if (!participant) {
            throw new ServerError('No formas parte de este grupo', 403)
        }
        if (allowed_roles && !allowed_roles.includes(participant.role)) {
            throw new ServerError('No tenes permisos para esta accion', 403)
        }
        return participant
    }

    async createGroup(creator_id, { name, description, member_ids }) {
        const conversation = await conversationRepository.create(CONVERSATION_TYPE.GROUP)

        const group = await groupRepository.create({
            conversation_id: conversation._id,
            name,
            description: description || null,
            created_by_user_id: creator_id
        })

        // El creador entra como admin
        await participantRepository.create(conversation._id, creator_id, PARTICIPANT_ROLE.ADMIN)

        // Miembros iniciales: sin duplicar al creador y validando que existan
        const unique_member_ids = [...new Set(member_ids || [])].filter(
            (id) => String(id) !== String(creator_id)
        )
        // Validamos todos los miembros en UNA consulta (en vez de N getById en serie)
        const valid_members = await userRepository.getActiveByIds(unique_member_ids)
        await Promise.all(valid_members.map((user) =>
            participantRepository.create(conversation._id, user._id, PARTICIPANT_ROLE.MEMBER)
        ))

        return await this.getGroup(creator_id, group._id)
    }

    async listMyGroups(user_id) {
        const participations = await participantRepository.listActiveByUser(user_id)
        const conversation_ids = participations.map((p) => p.conversation_id)
        const conversations = await conversationRepository.listByIds(conversation_ids)
        const group_conversation_ids = conversations
            .filter((c) => c.type === CONVERSATION_TYPE.GROUP)
            .map((c) => c._id)
        return await groupRepository.listByConversationIds(group_conversation_ids)
    }

    async getGroup(user_id, group_id) {
        const group = await groupRepository.getById(group_id)
        if (!group) {
            throw new ServerError('Grupo no encontrado', 404)
        }
        // Solo los participantes pueden verlo
        await this.assertRole(group.conversation_id, user_id, null)
        const members = await participantRepository.listByConversation(group.conversation_id)
        return { group, members }
    }

    async updateGroup(user_id, group_id, update_data) {
        const group = await groupRepository.getById(group_id)
        if (!group) {
            throw new ServerError('Grupo no encontrado', 404)
        }
        await this.assertRole(group.conversation_id, user_id, MANAGER_ROLES)

        const allowed = {}
        if (update_data.name !== undefined) allowed.name = update_data.name
        if (update_data.description !== undefined) allowed.description = update_data.description
        if (update_data.avatar_url !== undefined) allowed.avatar_url = update_data.avatar_url

        return await groupRepository.updateById(group_id, allowed)
    }

    async addMember(user_id, group_id, new_user_id) {
        const group = await groupRepository.getById(group_id)
        if (!group) {
            throw new ServerError('Grupo no encontrado', 404)
        }
        await this.assertRole(group.conversation_id, user_id, MANAGER_ROLES)

        const user = await userRepository.getById(new_user_id)
        if (!user || user.deleted_at) {
            throw new ServerError('El usuario que queres agregar no existe', 404)
        }

        const existing = await participantRepository.findAny(group.conversation_id, new_user_id)
        if (existing && !existing.left_at) {
            throw new ServerError('El usuario ya esta en el grupo', 400)
        }
        if (existing) {
            // Ya estuvo en el grupo y se fue: lo reactivamos en vez de crear un
            // duplicado (que rompería el índice único {conversation_id, user_id})
            await participantRepository.reactivate(group.conversation_id, new_user_id, PARTICIPANT_ROLE.MEMBER)
        } else {
            await participantRepository.create(group.conversation_id, new_user_id, PARTICIPANT_ROLE.MEMBER)
        }
        await conversationRepository.touch(group.conversation_id)

        return await this.getGroup(user_id, group_id)
    }

    async removeMember(user_id, group_id, target_user_id) {
        if (String(target_user_id) === String(user_id)) {
            throw new ServerError('No podes sacarte a vos mismo del grupo', 400)
        }

        const group = await groupRepository.getById(group_id)
        if (!group) {
            throw new ServerError('Grupo no encontrado', 404)
        }
        await this.assertRole(group.conversation_id, user_id, MANAGER_ROLES)

        const target = await participantRepository.findActive(group.conversation_id, target_user_id)
        if (!target) {
            throw new ServerError('Ese usuario no esta en el grupo', 404)
        }

        await participantRepository.softLeave(group.conversation_id, target_user_id)
        return await this.getGroup(user_id, group_id)
    }

    async deleteGroup(user_id, group_id) {
        const group = await groupRepository.getById(group_id)
        if (!group) {
            throw new ServerError('Grupo no encontrado', 404)
        }
        // Solo un admin puede eliminar el grupo
        await this.assertRole(group.conversation_id, user_id, [PARTICIPANT_ROLE.ADMIN])

        await conversationRepository.softDelete(group.conversation_id)
        return group
    }
}

const groupService = new GroupService()
export default groupService
