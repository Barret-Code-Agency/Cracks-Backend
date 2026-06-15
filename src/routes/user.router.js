import express from 'express'
import authMiddleware from '../middleware/auth.middleware.js'
import userController from '../controllers/user.controller.js'

const userRouter = express.Router()

userRouter.use(authMiddleware)

// GET /api/users?q=texto  (o ?email=texto) -> busca usuarios para agregar como contacto
userRouter.get('/', userController.search)
userRouter.patch('/me', userController.updateMe)

export default userRouter
