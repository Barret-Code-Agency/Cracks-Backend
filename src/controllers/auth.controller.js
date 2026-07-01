import authService from '../services/auth.service.js'
import ENVIRONMENT from '../config/environment.js'
import { toPublicUser } from '../mappers/user.mapper.js'

class AuthController {
    async register(request, response) {
        const { user, verification_token } = await authService.register(request.body)
        const data = { user: toPublicUser(user) }

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
        const frontend = ENVIRONMENT.URL_FRONTEND || '/'
        return response.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="2;url=${frontend}">
    <title>Cuenta verificada · CracksApp</title>
</head>
<body style="margin:0; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#eae6df; display:flex; min-height:100vh; align-items:center; justify-content:center;">
    <div style="background-color:#ffffff; border-radius:16px; padding:48px 40px; text-align:center; max-width:420px; box-shadow:0 4px 24px rgba(0,0,0,0.12);">
        <div style="width:64px; height:64px; border-radius:50%; background-color:#00a884; margin:0 auto 20px; line-height:64px; color:#ffffff; font-size:34px;">&#10003;</div>
        <h1 style="margin:0 0 10px; color:#111b21; font-size:22px; font-weight:600;">&iexcl;Cuenta verificada!</h1>
        <p style="margin:0 0 6px; color:#667781; font-size:15px;">Tu cuenta qued&oacute; activada.</p>
        <p style="margin:0; color:#8696a0; font-size:13px;">Te llevamos al inicio de sesi&oacute;n&hellip;</p>
    </div>
    <script>setTimeout(function(){ location.href = ${JSON.stringify(frontend)}; }, 2000);</script>
</body>
</html>`)
    }

    async login(request, response) {
        const { user, access_token } = await authService.login(request.body)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Sesion iniciada correctamente',
            data: { access_token, user: toPublicUser(user) }
        })
    }

    async forgotPassword(request, response) {
        const reset_token = await authService.forgotPassword(request.body.email)
        const data = {}

        // En desarrollo devolvemos el link para poder probar el flujo sin una
        // casilla de correo real. En produccion nunca se expone.
        if (ENVIRONMENT.MODE === 'development' && reset_token) {
            data.reset_url = `${ENVIRONMENT.URL_FRONTEND}/reset-password?token=${reset_token}`
        }

        // Respuesta generica: no revelamos si el email estaba registrado o no.
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Si el email esta registrado, te enviamos un enlace para restablecer la contraseña.',
            data
        })
    }

    async resetPassword(request, response) {
        await authService.resetPassword(request.body.token, request.body.password)
        return response.status(200).json({
            ok: true,
            status: 200,
            message: 'Contraseña actualizada. Ya podés iniciar sesión.'
        })
    }
}

const authController = new AuthController()
export default authController
