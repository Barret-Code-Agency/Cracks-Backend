import express from 'express'
import authController from '../controllers/auth.controller.js'
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js'

const authRouter = express.Router()

authRouter.post('/register', validateRegister, authController.register)
authRouter.get('/verify-email', authController.verifyEmail)
authRouter.post('/login', validateLogin, authController.login)

export default authRouter
