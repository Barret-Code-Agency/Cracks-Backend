import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import contactController from '../controllers/contact.controller.js'
import { validateContact } from '../middleware/validate.middleware.js'

const contactRouter = express.Router()

// Todas las rutas de contactos requieren autenticacion
contactRouter.use(authMiddleware)

contactRouter.post('/', validateContact, contactController.create)
contactRouter.get('/', contactController.list)
contactRouter.get('/:contact_id', contactController.getById)
contactRouter.put('/:contact_id', contactController.update)
contactRouter.delete('/:contact_id', contactController.remove)

export default contactRouter
