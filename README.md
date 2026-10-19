# AIMS-Lite V2.1

Toca el recuadro de la placa para solicitar la cámara nativa del teléfono. Safari/iOS controla la interfaz y puede ofrecer opciones adicionales. Toma la foto y confirma Usar foto; al regresar, la aplicación ejecuta OCR automáticamente. Revisa o edita la placa y pulsa Confirmar y guardar. No se guarda por confianza automática.

Estado: selector AR (Arkansas), CA (California, inicial), NV (Nevada), OR (Oregon), WA (Washington), ordenado por abreviatura. Se conserva la selección para la próxima foto; el OCR no cambia el estado.

El OCR lee la imagen completa y, si no encuentra una propuesta con suficiente confianza, intenta una zona central ampliada con contraste. No garantiza precisión: usa una foto cercana, placa horizontal y sin reflejos. Si falla, puedes escribir la placa. No se probó con placas reales en iPhone.

## Publicación
Exporta primero tus registros V1/V2. Descomprime AIMS-Lite-V2.1.zip y sube su contenido completo (incluida vendor) a la raíz de Novili/aims-lite, reemplazando archivos. No subas solo el ZIP. Confirma el commit. Con Pages configurado para main / raíz, espera el despliegue. Abre https://novili.github.io/aims-lite/ con conexión; cierra y reabre si sigue mostrando una versión anterior. Debe indicar V2.1. No borres datos del navegador para actualizar. No se publicó desde este entorno; no hay credenciales de escritura disponibles.

## Sin conexión y privacidad
Con conexión pulsa Preparar OCR sin conexión y espera confirmación; después verifica modo avión. Safari puede eliminar cachés y registros. Exporta CSV frecuentemente. No se suben ni guardan fotos; solo se guarda texto confirmado en este navegador. Se mantiene la clave de historial de V1. Safari y PWA pueden tener datos distintos. Todo el motor y modelo se incluyen, sin API, CDN ni servicios de pago.

## Verificación de esta revisión
Pasaron revisión de sintaxis y una prueba de flujo con cámara/OCR simulados: apertura del selector desde recuadro, lectura automática, segundo intento, edición, guardado explícito y conservación de estado. La ejecución de Edge está bloqueada por permisos de este entorno. No se afirma una nueva prueba real de OCR ni prueba física de iPhone. La versión anterior sí leyó una imagen sintética sin red en Edge; eso no demuestra exactitud en placas reales.

## Prueba en tu iPhone
Comprueba V2.1 → toca recuadro → toma foto → Usar foto → espera OCR → corrige placa si hace falta → selecciona estado → confirma y guarda → verifica historial tras recarga. Repite con una foto ilegible y cancelando cámara. Prueba también instalada en inicio y sin conexión después de preparar OCR. Operador y localidad son obligatorios para guardar.

Dependencias: Tesseract.js 6.0.1, core 6.0.0 y modelo eng local de @tesseract.js-data/eng 1.0.0, con licencias incluidas en vendor.
