# AIMS-Lite V1

Prototipo gratuito, móvil y en español. Sin compilación, cuentas, claves API, servicios externos ni dependencias. No es un sistema de control de acceso de producción.

## Publicar en GitHub Pages
1. Descomprime AIMS-Lite-V1.zip. Sube **el contenido** al repositorio (no subas solo el ZIP ni una carpeta contenedora). index.html debe quedar en la raíz junto a app.js, styles.css, sw.js, manifest.webmanifest e iconos.
2. En GitHub: Settings → Pages → Deploy from a branch → selecciona tu rama (normalmente main) y /(root) → Save.
3. Espera el despliegue y abre la URL HTTPS que muestra Pages. Para el repositorio Novili/aims-lite, la URL esperada es https://novili.github.io/aims-lite/ cuando Pages esté habilitado. Este paquete no publica ni cambia tu repositorio.
4. En iPhone abre en Safari, permite cámara y usa Compartir → Agregar a pantalla de inicio. Visita una vez con conexión hasta ver “App lista para abrir sin conexión”.

## Funciones implementadas
- Vista de cámara de video tras pulsar Activar cámara, cámara trasera preferida, sin audio. Requiere permiso y HTTPS (o localhost para desarrollo). Se detiene al ocultar la app.
- Placa y estado/provincia editables, localidad Hospital, lotes Pacientes / Doctores / Servicio. El lote activo se usa al guardar; cambiarlo no modifica registros anteriores.
- Historial local con fecha ISO y visualización en hora del dispositivo; persiste al recargar si el navegador permite localStorage.
- CSV UTF-8 con BOM y comillas, todos los lotes, fecha ISO y local. Se neutralizan prefijos de fórmulas de hojas de cálculo.
- Manifest, iconos y service worker con rutas relativas compatibles con subcarpetas de Pages. La app se puede abrir sin conexión después del primer cacheo completo.

## Experimental y límites
El OCR usa exclusivamente TextDetector si existe en el navegador. No se incluye un motor OCR externo ni se descargan modelos. No se garantiza disponibilidad en iPhone; si falta, el botón se desactiva con explicación. Lee texto de una captura en memoria de todo el cuadro y lo propone como placa; no es un detector de matrículas. Nunca guarda automáticamente. Estado/provincia siempre manual. No hay lectura continua, búsqueda en bases oficiales, sincronización, cuentas, conteo de ocupación ni validación legal.

No se envían ni guardan imágenes/video. Los registros quedan en este navegador/origen, visibles a quien use el mismo perfil. Safari y pantalla de inicio pueden tener datos separados. Limpiar datos o perder el dispositivo puede eliminar el historial. Exporta CSV regularmente; no hay importación CSV en V1. El modo privado o una cuota agotada puede impedir guardar, en cuyo caso se muestra error. La cámara y el OCR dependen del navegador y deben probarse en el iPhone real.

## Prueba manual en iPhone
Abre la URL HTTPS → permite cámara → comprueba video y Detener → escribe placa y estado → guarda un registro en cada lote → recarga y verifica los tres registros → exporta y abre el CSV → instala en inicio → abre con conexión → modo avión y reabre → verifica formulario e historial. Prueba denegar cámara: la captura manual debe seguir disponible. Borrar historial requiere confirmación.

## Desarrollo
Sirve esta carpeta con `python -m http.server 8000` y abre localhost:8000 en la misma computadora. Para iPhone usa Pages HTTPS. Abrir index.html directamente no prueba instalación ni caché. Para nuevas versiones incrementa CACHE en sw.js.
