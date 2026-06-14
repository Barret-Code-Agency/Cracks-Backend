import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import groupController from '../controllers/group.controller.js'
import { validateGroup, validateAddMember } from '../middleware/validate.middleware.js'

const groupRouter = express.Router()

// Todas las rutas de grupos requieren autenticacion
groupRouter.use(authMiddleware)

groupRouter.post('/', validateGroup, groupController.create)
groupRouter.get('/', groupController.list)
groupRouter.get('/:group_id', groupController.getById)
groupRouter.put('/:group_id', groupController.update)
groupRouter.delete('/:group_id', groupController.remove)

groupRouter.post('/:group_id/members', validateAddMember, groupController.addMember)
groupRouter.delete('/:group_id/members/:user_id', groupController.removeMember)

export default groupRouter
