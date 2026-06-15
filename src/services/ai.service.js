import ENVIRONMENT from '../config/environment.js'
import { GROQ } from '../constants/groq.constant.js'

// Respuestas de respaldo cuando la IA no esta disponible (sin key configurada o error de red).
const buildFallbacks = (user_name, user_text) => [
    `¡Qué grande ${user_name}! Me gustó eso de: "${user_text}". Sos un crack.`,
    'Totalmente de acuerdo contigo, ¡hay que seguir metiéndole!',
    `Interesante lo que decís, ${user_name}... lo voy a tener en cuenta.`,
    '¡Jajaja, Amigo, qué genio! Me hacés reír mucho. Nos vemos pronto.',
    'Ahora justo estoy por empezar a entrenar, ¡hablamos en un rato!',
    `¡Esa es la actitud, ${user_name}! La disciplina lo es todo.`,
    `¡Un abrazo grande, ${user_name}! Gracias por el aguante.`,
    `Exactamente eso hablaba el otro día con el equipo, ${user_name}. Estás en lo cierto.`,
    'No es fácil llegar a la cima, pero con gente como vos apoyando, todo es mejor.',
    `Me dejas pensando con eso de "${user_text}"... Tenés visión de juego, amigo.`,
    '¡Grande! La humildad y el trabajo duro no se negocian. ¡Seguimos!',
    'Perdona que tarde en responder, estamos concentrados para lo que viene. ¡Vamos con todo!',
    `Me sirve mucho tu mensaje, ${user_name}. Siempre es bueno escuchar otra opinión.`,
    '¡Eso es! Paso a paso, pero siempre hacia adelante. No hay secretos.',
    `¡Qué fenómeno! Si todos pensaran como vos, ${user_name}, el mundo sería otra cosa.`,
    'Gracias por estar en las buenas y en las malas. Eso es lo que vale de verdad.',
    'Uff, qué buena frase me tiraste. Me la guardo para la charla de hoy. ¡Un crack!'
]

const pickFallback = (user_name, user_text = '') => {
    const opciones = buildFallbacks(user_name, user_text)
    return opciones[Math.floor(Math.random() * opciones.length)]
}

const buildSystemPrompt = (crack_name, crack_bio, user_name, user_text) => {
    const bio = crack_bio || 'Deportista profesional de alto rendimiento.'
    return `Actúa como ${crack_name}, deportista famoso. Estás hablando por WhatsApp con un amigo cercano de toda la vida llamado ${user_name}.
Bio: ${bio}
Reglas:
1. Tono informal, relajado y con mucha confianza. No sos un asistente, sos un colega.
2. Español rioplatense obligatorio: voseo (vení, sentí, mirá), pero sin che y malas palabras.
3. Respondé con lógica sobre tu carrera deportiva. Si te preguntan algo personal, seguile la corriente con humor.
4. Si te pasan un email, teléfono o fecha, decí que lo vas a agendar.
5. Usá emoticones ocasionalmente. Respuestas breves como en un chat de celular.
Usuario dice: ${user_text}`
}

class AiService {
    // Genera la respuesta de un crack. La API key vive solo en el servidor;
    // si no hay key o Groq falla, devuelve una respuesta de respaldo para no cortar el chat.
    async generateCrackReply({ crack_name, crack_bio, user_name, user_text }) {
        if (!ENVIRONMENT.GROQ_API_KEY) {
            return pickFallback(user_name, user_text)
        }

        try {
            const response = await fetch(GROQ.URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ENVIRONMENT.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ.MODEL,
                    messages: [
                        { role: 'system', content: buildSystemPrompt(crack_name, crack_bio, user_name, user_text) }
                    ],
                    max_tokens: GROQ.MAX_TOKENS
                })
            })

            const data = await response.json()
            if (!response.ok) {
                console.error('Groq error:', data.error?.message)
                return pickFallback(user_name, user_text)
            }
            return data.choices[0].message.content
        }
        catch (error) {
            console.error('Groq fetch error:', error.message)
            return pickFallback(user_name, user_text)
        }
    }
}

const aiService = new AiService()
export default aiService
