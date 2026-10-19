# AIMS-Lite V2.2 — lectura al regresar de la cámara

Esta revisión procesa la foto automáticamente tanto al recibir change/input del selector como al volver a la página con una foto pendiente. Evita lecturas duplicadas del mismo archivo. Desplaza la vista a 02 / Confirmar registro y muestra allí preparación, progreso, resultado o error. El OCR rellena Placa y no modifica el estado seleccionado. Solo Confirmar y guardar crea el registro del lote activo en 03 / Historial.

## Actualizar
1. Exporta CSV de tu historial por precaución.
2. Descomprime AIMS-Lite-V2.2.zip y sube TODO su contenido a la raíz del repositorio Novili/aims-lite, incluida vendor. Reemplaza archivos; no subas el ZIP como archivo.
3. Espera que termine el despliegue de Pages. Abre la app con conexión, ciérrala y vuelve a abrirla. Debe indicar V2.2 arriba. No borres datos de Safari: contienen tu historial.
4. La versión usa rutas de código con ?v=2.2 y nueva caché para evitar mezclar código viejo. No se ha podido verificar el sitio publicado desde este entorno.
5. Toca el recuadro, toma una foto y elige Usar foto. Al volver debes llegar a Confirmar registro y ver Preparando lectura / Leyendo foto. Espera el resultado: se coloca en Placa. Verifica/edita, elige estado y lote, confirma; revisa Historial.

Si el campo no se llena, el mensaje junto a Placa debe indicar si la imagen no pudo abrirse, si falló el motor OCR o si no encontró una placa clara. Ese mensaje permite distinguir el fallo de una versión anterior en caché. No se garantiza exactitud con fotos reales: la placa debe estar cerca y legible. Estado manual: AR, CA, NV, OR, WA; CA inicial.

## Validación y límites
Pasaron comprobación de sintaxis y pruebas simuladas de recepción de foto, lectura automática, segundo intento OCR, eventos duplicados, edición, confirmación y conservación de estado. No se ejecutó una prueba física de iPhone ni una nueva prueba real del motor OCR; Edge está bloqueado por permisos en este entorno. Se corrigió el manejo de eventos y la visibilidad del proceso, sin afirmar que se haya identificado la causa exacta del fallo reportado.

OCR gratuito incluido localmente (Tesseract.js 6.0.1, core 6.0.0, modelo eng y licencias en vendor). Fotos no subidas ni persistidas. Historial local compatible con V1/V2. Para OCR sin conexión, prepara el motor con internet antes y prueba modo avión. iOS puede eliminar cachés y datos: exporta CSV con frecuencia. No hay sincronización ni respaldo automático. No se publicó desde este entorno por falta de credenciales GitHub.
