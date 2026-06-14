import Contact from '../models/contact.model.js'

const CONTACT_USER_FIELDS = 'display_name email avatar_url status_message es_bot'

class ContactRepository {
    async create(contact_data) {
        return await Contact.create(contact_data)
    }

    async insertMany(contacts) {
        return await Contact.insertMany(contacts, { ordered: false })
    }

    async findByOwnerAndContact(owner_user_id, contact_user_id) {
        return await Contact.findOne({ owner_user_id, contact_user_id })
    }

    async listByOwner(owner_user_id) {
        return await Contact
            .find({ owner_user_id })
            .sort({ is_favorite: -1, created_at: -1 })
            .populate('contact_user_id', CONTACT_USER_FIELDS)
    }

    async getByIdAndOwner(contact_id, owner_user_id) {
        return await Contact
            .findOne({ _id: contact_id, owner_user_id })
            .populate('contact_user_id', CONTACT_USER_FIELDS)
    }

    async updateByIdAndOwner(contact_id, owner_user_id, update_data) {
        return await Contact
            .findOneAndUpdate({ _id: contact_id, owner_user_id }, update_data, { new: true })
            .populate('contact_user_id', CONTACT_USER_FIELDS)
    }

    async deleteByIdAndOwner(contact_id, owner_user_id) {
        return await Contact.findOneAndDelete({ _id: contact_id, owner_user_id })
    }
}

const contactRepository = new ContactRepository()
export default contactRepository
