// Saludo inicial que cada crack (bot) envia al abrir el chat con un usuario.
// Centralizado para no duplicar el texto entre el registro y el backfill.
export const crackGreeting = (display_name) => {
    const nombre = (display_name || '').split(' ')[0]
    return `¡Hola! Soy ${nombre}. Gracias por sumarme a tus contactos, escribime cuando quieras. 👋`
}
