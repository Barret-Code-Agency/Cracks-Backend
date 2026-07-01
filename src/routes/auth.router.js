import express from 'express'
import authController from '../controllers/auth.controller.js'
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } from '../middleware/validate.middleware.js'
import { loginLimiter, registerLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware.js'
import { verifyTurnstile } from '../middleware/turnstile.middleware.js'

const authRouter = express.Router()

authRouter.post('/register', registerLimiter, validateRegister, verifyTurnstile, authController.register)
authRouter.get('/verify-email', authController.verifyEmail)
authRouter.post('/login', loginLimiter, validateLogin, authController.login)
authRouter.post('/forgot-password', passwordResetLimiter, validateForgotPassword, authController.forgotPassword)
authRouter.post('/reset-password', validateResetPassword, authController.resetPassword)

export default authRouter
