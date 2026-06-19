# Cracks · API Backend

**Trabajo Integrador Final — Desarrollo Back End — UTN**
Autor: **Fernando Delgado**

Cracks es una aplicación de mensajería instantánea full-stack inspirada en WhatsApp Web. Permite que los usuarios se registren con su email, lo verifiquen y chateen entre sí en conversaciones privadas y grupales. Además incorpora a **12 deportistas de elite** ("los cracks") precargados como contactos con los que también se puede conversar: cuando el receptor es uno de estos contactos, el backend genera la respuesta mediante IA (Groq), de modo que la API key vive solo en el servidor y nunca llega al navegador.

Este repositorio contiene el **backend**: una API REST construida con **Node.js + Express** sobre **MongoDB**, con arquitectura en capas, autenticación con JWT, verificación por email y un modelo de datos relacional adaptado a Mongoose. El frontend (React + Vite) vive en un repositorio aparte y consume esta API.

## Demo en vivo

- **Aplicación (frontend):** https://chat-de-cracks.vercel.app
- **API (backend):** https://cracks-backend.onrender.com
- **Usuario de prueba** (email ya verificado): `cracks.tp.utn@gmail.com` · contraseña `Cracks2026!`

Iniciá sesión con el usuario de prueba y vas a encontrar los 12 cracks y un chat de bienvenida. También podés registrarte con tu propio email: recibís el correo de verificación y, al entrar, ya quedás conectado para chatear. El backend usa el plan gratuito de Render, por lo que la primera petición tras un rato de inactividad puede demorar ~30-50 s en "despertar".

---

## Índice

1. Descripción general
2. Características
3. Stack tecnológico
4. Arquitectura
5. Estructura de carpetas
6. Modelo de datos
7. Diccionario de datos
8. Seguridad y autenticación
9. Endpoints de la API
10. Formato de respuestas
11. Seed de los cracks
12. Instalación y ejecución
13. Variables de entorno
14. Usuario de prueba
15. Despliegue
16. Sobre el modelo de datos
17. Frontend — buenas prácticas y accesibilidad

---

## 1. Descripción general

La aplicación resuelve el problema clásico de la mensajería: usuarios que se identifican de forma segura y se comunican entre ellos, tanto en conversaciones de a dos como en grupos con varios participantes y roles.

El diseño parte de una idea central: **una conversación es una conversación**, sea privada o grupal. En lugar de mantener dos estructuras separadas, todo se modela sobre una entidad raíz `conversations` y los mensajes referencian siempre a esa conversación. Un chat privado es, simplemente, una conversación con dos participantes; un grupo es una conversación con N participantes y un nombre. Esta decisión evita duplicar estructuras y simplifica la lógica de mensajería.

## 2. Características

- Registro de usuarios con hash de contraseña (bcrypt) y **verificación obligatoria por email**.
- Login que devuelve un **JWT con expiración**; las rutas sensibles quedan protegidas por un middleware de autenticación.
- **CRUD de Contactos** (entidad principal), con búsqueda de usuarios por nombre o email para agregarlos.
- **CRUD de Grupos** (entidad relacionada), con miembros, roles (admin / co-admin / member) y control de permisos.
- **Mensajería** uno a uno y grupal, reutilizando el mismo modelo de conversaciones.
- **12 cracks precargados** como usuarios bot, buscables y agregables como contacto.
- Arquitectura en capas, validación de entrada, manejo centralizado de errores y respuestas con formato uniforme.

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Entorno de ejecución | Node.js (ESM) |
| Framework HTTP | Express 5 |
| Base de datos | MongoDB |
| ODM | Mongoose |
| Autenticación | JSON Web Tokens (`jsonwebtoken`) |
| Hash de contraseñas | `bcrypt` |
| Envío de emails | `nodemailer` |
| Configuración | `dotenv` |
| CORS | `cors` |

## 4. Arquitectura

El backend sigue una **arquitectura en capas** con responsabilidades bien separadas. Cada petición atraviesa las capas en orden:

```
Cliente
  │
  ▼
routes/         Define las rutas y encadena los middlewares
  │
  ▼
middleware/     Autenticación (JWT), validación de entrada, CORS
  │
  ▼
controllers/    Leen el request y arman el response (sin lógica de negocio)
  │
  ▼
services/       Lógica de negocio, validaciones de dominio y permisos
  │
  ▼
repositories/   Único punto de acceso a la base de datos
  │
  ▼
models/         Esquemas de Mongoose
```

Reglas que sostienen la arquitectura:

- Los **controllers** no acceden a la base de datos ni contienen reglas de negocio: sólo traducen entre HTTP y los services.
- Los **services** concentran las reglas (por ejemplo: "no podés agregarte a vos mismo", "sólo un admin puede eliminar el grupo") y nunca tocan Express.
- Los **repositories** son el único lugar donde se consulta MongoDB, lo que permite cambiar el acceso a datos sin tocar la lógica.
- No hay *magic strings*: los valores fijos (tipos de conversación, roles, tipos de contenido) viven en `constants/`.
- Los errores se manejan de forma centralizada con una clase `ServerError` y un middleware de error final.

## 5. Estructura de carpetas

```
src/
 ├─ config/         Configuración (entorno, conexión a Mongo, mailer)
 ├─ constants/      Valores fijos (tipos de conversación, roles, content types)
 ├─ models/         Esquemas de Mongoose (las 6 entidades)
 ├─ repositories/   Acceso a la base de datos
 ├─ services/       Lógica de negocio
 ├─ controllers/    Manejo de request / response
 ├─ routes/         Routers de Express
 ├─ middleware/     Auth, validación y manejo de errores
 ├─ utils/          JWT y clase de error
 ├─ seed/           Carga de los 12 cracks
 └─ main.js         Punto de entrada (conexión + servidor)
```

## 6. Modelo de datos

El modelo está formado por **6 entidades**. Su diseño parte de un modelo relacional y se adapta a MongoDB usando referencias (`ObjectId` + `ref`) y `populate`.

- **users** — Las cuentas. Incluye dos extensiones propias de Cracks: `es_bot` (marca a los 12 deportistas) y `email_verificado` (verificación obligatoria del TP).
- **contacts** — La agenda de cada usuario. Relación N:M autorreferenciada y **direccional**: que A tenga a B no implica que B tenga a A. Único por par `(owner, contact)`.
- **conversations** — La entidad raíz unificada. Su campo `type` distingue `private` de `group`. Su `updated_at` se actualiza con cada mensaje, lo que permite ordenar la lista de chats.
- **groups** — Extiende a `conversations` (relación 1:1) con los datos propios de un grupo: nombre, descripción, avatar y creador.
- **conversation_participants** — La membresía: qué usuario participa de qué conversación y con qué `role`. Un privado tiene 2 filas; un grupo, N. El rol pertenece a la membresía, no al usuario.
- **messages** — Todos los mensajes, de privados y de grupos, referenciando a `conversations`. Soporta hilos mediante `reply_to_message_id` (autorreferencia).

**Relaciones principales:**

- `users` 1:N `contacts`, `groups`, `conversation_participants`, `messages`
- `conversations` 1:0..1 `groups`
- `conversations` 1:N `conversation_participants`, `messages`
- `messages` 0..1:N `messages` (hilos / respuestas)

## 7. Diccionario de datos

### users

| Campo | Tipo | Notas |
|---|---|---|
| email | String | Requerido, único |
| password_hash | String | Requerido salvo en bots (`es_bot`) |
| display_name | String | Requerido |
| phone_number | String | Opcional, único (índice parcial) |
| avatar_url | String | Opcional |
| status_message | String | Opcional (bio / estado) |
| email_verificado | Boolean | Por defecto `false` |
| es_bot | Boolean | Por defecto `false` (marca a los cracks) |
| last_seen_at | Date | Última conexión |
| created_at / updated_at | Date | Auditoría |
| deleted_at | Date | Borrado lógico |

### contacts

| Campo | Tipo | Notas |
|---|---|---|
| owner_user_id | ObjectId → User | Requerido (dueño de la agenda) |
| contact_user_id | ObjectId → User | Requerido (usuario agregado) |
| alias | String | Opcional |
| is_blocked | Boolean | Por defecto `false` |
| is_favorite | Boolean | Por defecto `false` |
| created_at | Date | Auditoría |

Índice único `(owner_user_id, contact_user_id)`.

### conversations

| Campo | Tipo | Notas |
|---|---|---|
| type | String | `private` o `group`, requerido |
| created_at / updated_at | Date | `updated_at` ordena la lista de chats |
| deleted_at | Date | Borrado lógico |

### groups

| Campo | Tipo | Notas |
|---|---|---|
| conversation_id | ObjectId → Conversation | Requerido, único (relación 1:1) |
| name | String | Requerido |
| description | String | Opcional |
| avatar_url | String | Opcional |
| created_by_user_id | ObjectId → User | Requerido |
| created_at | Date | Auditoría |

### conversation_participants

| Campo | Tipo | Notas |
|---|---|---|
| conversation_id | ObjectId → Conversation | Requerido |
| user_id | ObjectId → User | Requerido |
| role | String | `member`, `co_admin` o `admin` (por defecto `member`) |
| joined_at | Date | Alta en la conversación |
| left_at | Date | Baja lógica (salida del grupo) |
| last_read_message_id | ObjectId → Message | Último mensaje leído |
| is_muted | Boolean | Silenciado |

Índice único `(conversation_id, user_id)`.

### messages

| Campo | Tipo | Notas |
|---|---|---|
| conversation_id | ObjectId → Conversation | Requerido |
| sender_user_id | ObjectId → User | Requerido (emisor) |
| content | String | Requerido |
| content_type | String | `text`, `image`, `video`, `audio`, `document` o `location` (por defecto `text`) |
| reply_to_message_id | ObjectId → Message | Opcional (hilos) |
| sent_at | Date | Fecha de envío |
| edited_at | Date | Edición |
| deleted_at | Date | Borrado lógico |

Índice `(conversation_id, sent_at desc)` para traer los últimos mensajes.

## 8. Seguridad y autenticación

- **Contraseñas:** nunca se guardan en texto plano. Se hashean con **bcrypt** (12 rondas) antes de persistirlas.
- **JWT:** el login devuelve un token firmado con expiración configurable. Las rutas protegidas esperan el header `Authorization: Bearer <token>`; el middleware de autenticación lo verifica y expone el usuario en la request.
- **Verificación por email:** al registrarse se envía un email con un link de activación (`nodemailer`). Hasta que el email no está verificado, el login es rechazado.
- **Middlewares obligatorios:**
  - **CORS** — habilita el consumo desde el frontend.
  - **Validación de entrada** — rechaza payloads inválidos con un `400` antes de llegar a la lógica.
  - **Autenticación JWT** — protege las rutas sensibles.
  - **Manejo centralizado de errores** — un único middleware traduce los errores a respuestas uniformes.

## 9. Endpoints de la API

Base local: `http://localhost:3000`

### Autenticación — `/api/auth`

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| POST | `/register` | No | `{ email, password, display_name, phone_number? }` | Registra el usuario y envía el email de verificación |
| GET | `/verify-email?token=` | No | — | Verifica el email (link del correo) |
| POST | `/login` | No | `{ email, password }` | Devuelve `{ user, access_token }`; requiere email verificado |

### Usuarios — `/api/users`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/?q=texto` | Sí | Busca usuarios por nombre o email (mínimo 2 caracteres, máximo 10 resultados) |

### Contactos — `/api/contacts`

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| POST | `/` | Sí | `{ contact_user_id, alias? }` | Agrega un contacto |
| GET | `/` | Sí | — | Lista mis contactos (favoritos primero) |
| GET | `/:contact_id` | Sí | — | Detalle de un contacto |
| PUT | `/:contact_id` | Sí | `{ alias?, is_blocked?, is_favorite? }` | Edita un contacto |
| DELETE | `/:contact_id` | Sí | — | Elimina un contacto |

### Grupos — `/api/groups`

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| POST | `/` | Sí | `{ name, description?, member_ids? }` | Crea un grupo (el creador queda como admin) |
| GET | `/` | Sí | — | Lista mis grupos |
| GET | `/:group_id` | Sí | — | Detalle del grupo con sus miembros |
| PUT | `/:group_id` | Sí | `{ name?, description?, avatar_url? }` | Edita el grupo (admin o co-admin) |
| DELETE | `/:group_id` | Sí | — | Elimina el grupo (admin) |
| POST | `/:group_id/members` | Sí | `{ user_id }` | Agrega un miembro (admin o co-admin) |
| DELETE | `/:group_id/members/:user_id` | Sí | — | Quita un miembro (admin o co-admin) |

### Conversaciones y mensajes — `/api/conversations`

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| GET | `/` | Sí | — | Mis chats (participantes + último mensaje) |
| POST | `/private` | Sí | `{ user_id }` | Abre o recupera el chat privado con ese usuario |
| GET | `/:conversation_id/messages` | Sí | — | Mensajes de la conversación |
| POST | `/:conversation_id/messages` | Sí | `{ content, content_type?, reply_to_message_id? }` | Envía un mensaje |
| POST | `/:conversation_id/bot-reply` | Sí | `{ content }` | Genera con IA (Groq, en el servidor) y persiste la respuesta del crack; `content` es el mensaje del usuario a responder |

### Salud — `/api/health`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | No | Estado de la API |

## 10. Formato de respuestas

Todas las respuestas comparten una misma forma, lo que simplifica el consumo desde el frontend:

```
{
  "ok": true,
  "status": 200,
  "message": "Contactos obtenidos",
  "data": { ... }
}
```

Ante un error, el middleware central responde con la misma estructura:

```
{
  "ok": false,
  "status": 404,
  "message": "Contacto no encontrado"
}
```

## 11. Seed de los cracks

El proyecto incluye un seed que carga a los 12 deportistas como usuarios `es_bot`:

```
npm run seed
```

El seed es **idempotente**: identifica a cada crack por su email (`crackNNN@cracks.bot`), de modo que correrlo varias veces no genera duplicados. Una vez cargados, los cracks aparecen en la búsqueda de usuarios y pueden agregarse como contacto igual que cualquier otra persona.

## 12. Instalación y ejecución

**Requisitos:** Node.js 20+ y una instancia de MongoDB (local o Atlas).

```
git clone <url-del-repo>
cd Cracks-Backend
npm install
```

Crear un archivo `.env` en la raíz (ver la sección siguiente) y luego:

```
npm run dev      # desarrollo, con recarga automática
npm start        # producción
npm run seed     # carga los 12 cracks
```

La API queda disponible en `http://localhost:3000`.

## 13. Variables de entorno

| Variable | Descripción |
|---|---|
| MODE | Entorno (`development` / `production`) |
| PORT | Puerto del servidor (por defecto 3000) |
| MONGO_URI | Cadena de conexión a MongoDB |
| JWT_SECRET | Secreto para firmar los tokens |
| JWT_EXPIRES_IN | Vencimiento del token (ej. `1d`) |
| GMAIL_USER | Casilla de Gmail para enviar los emails |
| GMAIL_PASS | App-password de esa casilla |
| URL_BACKEND | URL pública del backend |
| URL_FRONTEND | URL pública del frontend |
| GROQ_API_KEY | API key de Groq para generar las respuestas de los cracks (corre en el servidor) |

Si `GMAIL_USER` y `GMAIL_PASS` no están configurados, el envío de emails funciona en modo de desarrollo (no envía correos reales), de modo que se puede probar el flujo completo en local. Del mismo modo, si `GROQ_API_KEY` no está configurada, los cracks responden con frases de respaldo en vez de cortar el chat.

## 14. Usuario de prueba

Cuenta de prueba con el **email ya verificado**, lista para usar en la app desplegada:

| Email | Contraseña |
|---|---|
| `cracks.tp.utn@gmail.com` | `Cracks2026!` |

Al iniciar sesión con ella ya aparecen los 12 cracks y un chat de bienvenida. Cualquier persona también puede **registrarse con su propio email**: recibe el correo de verificación, lo confirma y al entrar queda conectada para poder chatear.

## 15. Despliegue

La aplicación está **desplegada y online**:

| Componente | Plataforma | URL |
|---|---|---|
| Frontend (app) | Vercel | https://chat-de-cracks.vercel.app |
| Backend (API) | Render | https://cracks-backend.onrender.com |
| Base de datos | MongoDB Atlas | cluster M0 (gratuito) |

El backend corre en el plan gratuito de Render (se suspende tras inactividad; la primera petición puede demorar ~30-50 s). La base de datos vive en MongoDB Atlas, sembrada con los 12 cracks y la cuenta de prueba mediante los scripts `npm run seed` y `npm run seed:demo`. El CORS del backend está habilitado para el frontend.

## 16. Sobre el modelo de datos

El modelo de datos que sostiene esta aplicación fue diseñado, documentado y **evaluado en la materia Bases de Datos**, donde recibió la siguiente devolución:

> "Tu resolución cumple ampliamente lo requerido y presenta un modelo de datos muy completo y bien estructurado. Identificas correctamente las entidades principales junto con sus atributos, claves primarias y foráneas. También están bien representadas las relaciones entre usuarios, contactos, grupos y mensajes, incluyendo los roles dentro de los grupos. Se destaca especialmente la decisión de unificar conversaciones privadas y grupales con la tabla conversations, ya que evita duplicar estructuras y demuestra una buena comprensión del modelado relacional. Además, el trabajo está muy bien documentado y justifica correctamente las decisiones de diseño. No tengo observaciones a mejorar. Buen trabajo. Aprobado."

Sobre ese modelo aprobado se construyó este backend, adaptándolo a MongoDB y extendiéndolo con `es_bot` y `email_verificado` para soportar a los cracks y la verificación de email exigida por el Trabajo Integrador Final.

## 17. Frontend — buenas prácticas y accesibilidad

El frontend (React + Vite) sigue buenas prácticas de maquetación y accesibilidad, incorporando devoluciones recibidas en la cursada de Front End:

- **HTML semántico:** uso de `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` y `<aside>` en lugar de `<div>` genéricos, lo que mejora la accesibilidad y la estructura del documento.
- **Sin alturas fijas en los encabezados:** los headers usan `padding` y `min-height` en lugar de un `height` fijo, para que escalen correctamente en pantallas grandes.
- **Estados activos en la navegación:** la navegación y los listados marcan el ítem activo con una clase modificadora (`--active`), indicando en qué sección está el usuario.
- **Nombres de clases descriptivos:** convención BEM (`add-panel__result-name`, `cw__bubble--me`), evitando nombres genéricos que dificulten el mantenimiento.
- **Sin valores hardcodeados:** colores, espaciados y radios provienen de tokens CSS (`var(--...)`) definidos en un único lugar, garantizando contraste y coherencia entre los temas claro y oscuro.

**Alcance de la interfaz.** Con el fin de reproducir fielmente la experiencia de WhatsApp Web, la interfaz incorpora algunas secciones de carácter ilustrativo —Estados, Canales, Comunidades, Multimedia y la pantalla de vinculación por QR—. Estas reproducen la estética de la aplicación original a modo de maqueta y no se conectan con la API. Las funcionalidades centrales del Trabajo Integrador —registro con verificación por email, inicio de sesión, gestión de contactos, mensajería privada y grupal, y las respuestas de los cracks generadas por IA— están todas respaldadas por este backend.

---

Fernando Delgado · UTN · Desarrollo Back End
