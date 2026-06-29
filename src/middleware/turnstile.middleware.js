import ENVIRONMENT from '../config/environment.js'
import ServerError from '../utils/serverError.js'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Valida el token de Cloudflare Turnstile (CAPTCHA anti-bot) que el frontend
// adjunta en el body como captcha_token. Si no hay TURNSTILE_SECRET configurado,
// el captcha queda desactivado y deja pasar: así el flujo no se rompe en local
// ni en despliegues donde todavía no se cargaron las claves.
export const verifyTurnstile = async (request, response, next) => {
    if (!ENVIRONMENT.TURNSTILE_SECRET) {
        return next()
    }

    const token = request.body?.captcha_token
    if (!token) {
        throw new ServerError('Falta la verificación anti-robot', 400)
    }

    let data
    try {
        const res = await fetch(SITEVERIFY_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: ENVIRONMENT.TURNSTILE_SECRET,
                response: token
            })
        })
        data = await res.json()
    } catch (error) {
        throw new ServerError('No se pudo validar la verificación anti-robot', 502)
    }

    if (!data.success) {
        throw new ServerError('Verificación anti-robot fallida, intentá de nuevo', 400)
    }

    next()
}
