import mongoose from 'mongoose'
import ENVIRONMENT from './environment.js'

const connectMongoDB = async () => {
    try {
        await mongoose.connect(ENVIRONMENT.MONGO_URI)
        console.log('Conexion con MongoDB establecida')
    }
    catch (error) {
        console.error('Error al conectar con MongoDB:', error.message)
        process.exit(1)
    }
}

export default connectMongoDB
