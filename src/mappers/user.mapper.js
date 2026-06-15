// Forma publica de un usuario: lo que se expone al cliente.
// Nunca incluye password_hash ni campos internos.
export const toPublicUser = (user) => ({
    id: user._id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    status_message: user.status_message,
    email_verificado: user.email_verificado
})
