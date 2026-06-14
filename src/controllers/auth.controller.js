import authService from '../services/auth.service.js'
import ENVIRONMENT from '../config/environment.js'

const publicUser = (user) => ({
    id: user._id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    email_verificado: user.email_verificado
})

class AuthController {
    async register(request, response) {
        const { user, verification_token } = await authService.register(request.body)
        const data = { user: publicUser(user) }

        // En desarrollo (sin Gmail real) devolvemos el link de verificacion
        // para poder verificar la cuenta sin una casilla de correo.
        if (ENVIRONMENT.MODE === 'development') {
            data.verification_url = `${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email?token=${verification_token}`
        }

        return response.status(201).json({
            ok: true,
            status: 201,
            message: 'Usuario registrado. Revisa tu email para verificar la cuenta.',
            data
        })
    }

    async verifyEmail(request, response) {
        await authService.verifyEmail(request.query.token)
        return response.status(200).send(`
            <div style="font-family: Arial; text-align: center; padding: 48px;">
                <h1 style="color:#25D366;">Cuenta verificada</h1>
                <p>Ya podes iniciar sesion en Cracks.</p>
            </div>
        `)
    }

    async login(request, response) {
        const { user, access_token } = await authService.login(request.body)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Sesion iniciada correctamente',
            data: { access_token, user: publicUser(user) }
        })
    }
}

const authController = new AuthController()
export default authController
