import contactService from '../services/contact.service.js'

class ContactController {
    async create(request, response) {
        const contact = await contactService.addContact(
            request.user.user_id,
            request.body.contact_user_id,
            request.body.alias
        )
        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Contacto agregado',
            data: { contact }
        })
    }

    async list(request, response) {
        const contacts = await contactService.listContacts(request.user.user_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Contactos obtenidos',
            data: { contacts }
        })
    }

    async getById(request, response) {
        const contact = await contactService.getContact(request.user.user_id, request.params.contact_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Contacto obtenido',
            data: { contact }
        })
    }

    async update(request, response) {
        const contact = await contactService.updateContact(
            request.user.user_id,
            request.params.contact_id,
            request.body
        )
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Contacto actualizado',
            data: { contact }
        })
    }

    async remove(request, response) {
        await contactService.deleteContact(request.user.user_id, request.params.contact_id)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Contacto eliminado'
        })
    }
}

const contactController = new ContactController()
export default contactController
