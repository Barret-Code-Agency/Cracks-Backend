import contactRepository from '../repositories/contact.repository.js'
import userRepository from '../repositories/user.repository.js'
import conversationService from './conversation.service.js'
import ServerError from '../utils/serverError.js'

// Cuenta del creador de la app: todo usuario nuevo arranca conectado con el
const HOST_EMAIL = 'fhdelgado.utn@gmail.com'

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
        // Al eliminar el contacto se borra tambien la conversacion privada con esa persona
        // (soft-delete): el chat desaparece y, si se vuelve a agregar, arranca limpio.
        await conversationService.deletePrivateBetween(owner_user_id, deleted.contact_user_id)
        return deleted
    }

    // Al registrarse, el usuario nuevo arranca con los cracks como contactos
    // y con un chat ya abierto con cada uno (saludo inicial del crack), para que
    // entre y vea los chats listos, no solo la agenda de contactos.
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

        // Un chat con saludo por cada crack (en paralelo). Si alguno falla,
        // no rompemos el registro.
        await Promise.all(bots.map(async (bot) => {
            try {
                const nombre = (bot.display_name || '').split(' ')[0]
                const conversation = await conversationService.findOrCreatePrivate(owner_user_id, bot._id)
                await conversationService.sendMessage(
                    conversation._id,
                    bot._id,
                    `¡Hola! Soy ${nombre}. Gracias por sumarme a tus contactos, escribime cuando quieras. 👋`
                )
            } catch (error) {
                console.error(`No se pudo crear el chat con ${bot.display_name}:`, error.message)
            }
        }))
    }

    // El usuario nuevo queda conectado con el anfitrion (Fernando), en ambos sentidos,
    // y arranca con un chat de bienvenida para no entrar a una bandeja vacia.
    async seedHostContact(new_user_id, new_user_name) {
        const host = await userRepository.getByEmail(HOST_EMAIL)
        if (!host || String(host._id) === String(new_user_id)) {
            return
        }
        const link = async (owner_id, contact_id) => {
            const existing = await contactRepository.findByOwnerAndContact(owner_id, contact_id)
            if (!existing) {
                await contactRepository.create({ owner_user_id: owner_id, contact_user_id: contact_id })
            }
        }
        await link(new_user_id, host._id) // el nuevo usuario ve a Fernando
        await link(host._id, new_user_id) // Fernando ve al nuevo usuario

        // Chat de bienvenida: Fernando le manda un saludo inicial. Si algo falla,
        // no rompemos el registro (el contacto ya quedo enlazado).
        try {
            const nombre = (new_user_name || '').split(' ')[0]
            const saludo = nombre ? `¡Hola ${nombre}!` : '¡Hola!'
            const conversation = await conversationService.findOrCreatePrivate(new_user_id, host._id)
            await conversationService.sendMessage(
                conversation._id,
                host._id,
                `${saludo} 👋 Bienvenido a CracksApp. Soy Fernando, el creador de la app. Ya tenés a los cracks en tus contactos: tocá el lápiz para empezar a chatear con cualquiera de ellos. ¡Que lo disfrutes!`
            )
        } catch (error) {
            console.error('No se pudo crear el chat de bienvenida:', error.message)
        }
    }
}

const contactService = new ContactService()
export default contactService
