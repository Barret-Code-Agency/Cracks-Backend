import dns from 'node:dns'
import ENVIRONMENT from './config/environment.js'
import connectMongoDB from './config/mongodb.js'
import app from './app.js'

// Render no tiene salida IPv6: forzamos IPv4 para que las conexiones salientes
// (SMTP de Brevo, etc.) no fallen con ENETUNREACH / Connection timeout.
dns.setDefaultResultOrder('ipv4first')

await connectMongoDB()

app.listen(ENVIRONMENT.PORT, () => {
    console.log(`Servidor Cracks corriendo en ${ENVIRONMENT.URL_BACKEND}`)
})
