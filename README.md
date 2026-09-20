# Gastrosoto

Aplicación de recetas y planificación de menús semanales/mensuales, pensada
para una familia, siguiendo las recomendaciones de la OMS y el método del
plato de Harvard (50% verduras y fruta, 25% proteína, 25% cereales/hidratos).

## Estado actual

`index.html` es la misma aplicación, ya con **cuentas de usuario propias**
(Firebase Authentication) y **guardado en la nube** (Firestore) conectados.
Es un único archivo autocontenido — sin nada que instalar — listo para
publicarse tal cual en GitHub Pages.

Al abrirla, pide iniciar sesión o crear una cuenta (correo + contraseña).
Cada cuenta ve únicamente sus propias recetas, familia, plan y lista de la
compra — quedan aisladas por cuenta gracias a las reglas de Firestore
(`firestore.rules`).

Lo único que todavía no incluye, fuera de Claude:

- **Sugerencias de recetas con IA** (el buscador de "Ideas" en Recetas).
  Necesita un pequeño servidor intermedio para no exponer una clave de
  API en una página pública — ver más abajo.

El botón de "Compartir" en PDF **sí funciona** fuera de Claude: ya no hay
sandbox, así que usa la descarga clásica del navegador.

## Antes de publicar: activa las reglas de Firestore

Por defecto, un proyecto de Firestore recién creado deniega todas las
lecturas y escrituras (o las permite a cualquiera, si se creó en "modo de
prueba" — igual de mal, porque cualquiera podría leer o borrar los datos
de cualquier cuenta). Hay que subir las reglas de este repositorio:

1. En la consola de Firebase, entra en **Firestore Database → Reglas**.
2. Sustituye el contenido por el de `firestore.rules` (en este mismo
   repositorio).
3. Pulsa **Publicar**.

Sin este paso, la app se queda "colgada" al guardar o leer datos, aunque
el login funcione.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (puede ser privado).
2. Sube `index.html`, `README.md` y `firestore.rules` a la raíz.
3. En el repositorio: **Settings → Pages → Deploy from a branch**, rama
   `main`, carpeta `/ (root)`. Guarda.
4. En un par de minutos tendrás una URL tipo
   `https://tu-usuario.github.io/tu-repositorio/`.
5. En la consola de Firebase, ve a **Authentication → Settings →
   Authorized domains** y añade ese dominio de GitHub Pages (y
   `localhost` si vas a probarlo en tu ordenador antes). Sin este paso,
   Firebase rechaza los intentos de acceso desde esa web por seguridad.

## Cómo probarlo en tu ordenador antes de publicarlo

No hace falta ningún servidor especial: basta con abrir `index.html`
directamente en el navegador, o con un servidor local sencillo, por
ejemplo (con Python instalado):

```
python3 -m http.server 8000
```

y visitar `http://localhost:8000`. Recuerda añadir `localhost` a los
dominios autorizados de Firebase (paso 5 de arriba) para poder probar el
login en local.

## Pendiente / próxima fase (opcional): sugerencias con IA

Las sugerencias de recetas con IA necesitan que el navegador llame a un
modelo (como Claude), y una clave de API nunca debe guardarse en una
página pública. Para eso hace falta un pequeño servidor intermedio — por
ejemplo una Cloudflare Worker gratuita, o una Firebase Cloud Function
(esta última necesita pasar el proyecto al plan "Blaze", de pago por uso,
aunque tiene una capa gratuita generosa). Es un paso aparte y no bloquea
nada de lo anterior.

## Instalarla en el móvil como una app

Ya está preparada para "Añadir a pantalla de inicio" con icono propio y
sin la barra del navegador (modo PWA):

- **Android (Chrome):** abre la web, menú ⋮ → **"Instalar aplicación"**
  (o "Añadir a pantalla de inicio").
- **iPhone (Safari):** abre la web, botón de compartir (el cuadrado con
  la flecha hacia arriba) → **"Añadir a pantalla de inicio"**. En iOS
  tiene que ser desde Safari — desde Chrome en iPhone no funciona este
  paso, es una limitación de Apple.

Esto solo funciona una vez esté publicada en una URL con **https**
(GitHub Pages ya lo da automáticamente) — no vale con abrir el archivo
suelto desde el propio teléfono.

## Estructura de archivos

```
gastrosoto/
├── index.html            # La aplicación completa (HTML + CSS + JS)
├── firestore.rules       # Reglas de seguridad: cada cuenta ve solo lo suyo
├── manifest.json         # Datos de la app instalable (nombre, icono, colores)
├── sw.js                 # Service worker: permite instalarla y abrir la carcasa sin red
├── icon-192.png           # Icono de la app
├── icon-512.png           # Icono de la app (tamaño grande)
├── icon-maskable-512.png  # Icono adaptado a las formas de Android (círculo, gota…)
├── apple-touch-icon.png   # Icono para "Añadir a pantalla de inicio" en iPhone
└── README.md              # Este archivo
```

## Notas técnicas (por si retomamos esto más adelante)

- La configuración de Firebase (`firebaseConfig`) vive al principio del
  `<body>` de `index.html`, en un `<script type="module">` separado del
  resto de la app. Son claves públicas, no secretas.
- Toda la lógica de la app sigue hablando con los datos a través de una
  interfaz `state.db` (con `.collection().onSnapshot()/.add()` y
  `.doc().get()/.set()/.update()/.delete()`), igual que cuando vivía
  dentro de Claude. Lo único que cambió es qué hay detrás de esa interfaz:
  antes era la capacidad "db" de Claude, ahora es un pequeño adaptador
  (`makeFirestoreDb`) que habla con Firestore de verdad, escribiendo bajo
  `users/{uid}/...`. Si en el futuro quieres añadir alguna colección
  nueva, solo hace falta seguir ese mismo patrón.
- Si esta misma página se llegase a reabrir alguna vez dentro de un
  artefacto de Claude, sigue funcionando como antes (sin cuentas,
  usando la capacidad "db" de Claude): detecta que Firebase no carga
  (los scripts externos están bloqueados ahí) y usa automáticamente el
  modo clásico.
