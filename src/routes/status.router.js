import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import statusController from '../controllers/status.controller.js'
import { validateStatus, validateObjectId } from '../middleware/validate.middleware.js'

const statusRouter = express.Router()

// Todas las rutas de estados requieren autenticacion
statusRouter.use(authMiddleware)

statusRouter.get('/', statusController.list)
statusRouter.post('/', validateStatus, statusController.create)
statusRouter.delete('/:status_id', validateObjectId('status_id'), statusController.remove)

export default statusRouter
