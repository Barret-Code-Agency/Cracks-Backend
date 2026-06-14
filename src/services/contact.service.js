import contactRepository from '../repositories/contact.repository.js'
import userRepository from '../repositories/user.repository.js'
import ServerError from '../utils/serverError.js'

class ContactService {
    async addContact(owner_user_id, contact_user_id, alias) {
        if (String(owner_user_id) === String(contact_user_id)) {
            throw new ServerError('No podes agregarte a vos mismo', 400)
        }

        const user = await userRepository.getById(contact_user_id)
        if (!user || user.deleted_at) {
            throw new ServerError('El usuario que queres agregar no existe', 404)
        }

        const existing = await contactRepository.findByOwnerAndContact(owner_user_id, contact_user_id)
        if (existing) {
            throw new ServerError('Ya tenes a este usuario en tus contactos', 400)
        }

        const contact = await contactRepository.create({
            owner_user_id,
            contact_user_id,
            alias: alias || null
        })

        return await contactRepository.getByIdAndOwner(contact._id, owner_user_id)
    }

    async listContacts(owner_user_id) {
        return await contactRepository.listByOwner(owner_user_id)
    }

    async getContact(owner_user_id, contact_id) {
        const contact = await contactRepository.getByIdAndOwner(contact_id, owner_user_id)
        if (!contact) {
            throw new ServerError('Contacto no encontrado', 404)
        }
        return contact
    }

    async updateContact(owner_user_id, contact_id, update_data) {
        // Solo se permiten cambiar estos campos
        const allowed = {}
        if (update_data.alias !== undefined) allowed.alias = update_data.alias
        if (update_data.is_blocked !== undefined) allowed.is_blocked = update_data.is_blocked
        if (update_data.is_favorite !== undefined) allowed.is_favorite = update_data.is_favorite

        const contact = await contactRepository.updateByIdAndOwner(contact_id, owner_user_id, allowed)
        if (!contact) {
            throw new ServerError('Contacto no encontrado', 404)
        }
        return contact
    }

    async deleteContact(owner_user_id, contact_id) {
        const deleted = await contactRepository.deleteByIdAndOwner(contact_id, owner_user_id)
        if (!deleted) {
            throw new ServerError('Contacto no encontrado', 404)
        }
        return deleted
    }

    // Al registrarse, el usuario nuevo arranca con los 50 cracks como contactos
    async seedCracksForUser(owner_user_id) {
        const bots = await userRepository.getBots()
        if (!bots.length) {
            return
        }
        const contactos = bots.map((bot) => ({
            owner_user_id,
            contact_user_id: bot._id
        }))
        await contactRepository.insertMany(contactos)
    }
}

const contactService = new ContactService()
export default contactService
