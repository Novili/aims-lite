# AIMS-Lite V2 — publicación y pruebas

## Publicar sin costo
1. Exporta CSV de V1 en cada navegador o app instalada que uses.
2. Descomprime AIMS-Lite-V2.zip. En Novili/aims-lite → Code → Add file → Upload files, arrastra TODOS los archivos y la carpeta vendor a la raíz. No subas el ZIP ni una carpeta contenedora. Conserva nombres y subcarpetas.
3. Confirma el commit. El paquete reemplaza la aplicación V1; el historial conserva la misma clave local y no se borra. No cambia ajustes de Pages.
4. Si Pages ya publica main / raíz, espera el despliegue en Actions. Si no, Settings → Pages → Deploy from a branch → main → /(root).
5. Abre https://novili.github.io/aims-lite/ con conexión. Cierra y vuelve a abrir si aún muestra V1: el nuevo service worker puede necesitar una segunda apertura para servir todos los archivos nuevos. No borres los datos del sitio para actualizar.
6. Comprueba que muestra V2. Pulsa Preparar OCR sin conexión y espera confirmación. Prueba modo avión antes de salir al campo.

Alternativa con Git: aplica AIMS-Lite-V2.patch con `git apply --binary`, revisa los cambios, agrega los archivos y publica un commit en la rama que usa Pages.

## Uso en iPhone (pendiente de validación real)
- Safari HTTPS → Compartir → Agregar a pantalla de inicio. El formulario usa campos de 16 px o mayores y el selector nativo de fotos/cámara con preferencia trasera.
- Completa operador y localidad. Selecciona Pacientes, Doctores o Servicio antes de confirmar; cambiar lote no altera registros anteriores.
- Toma foto cercana con la placa horizontal, legible y sin reflejos. Pulsa Leer placa. Revisa cada carácter y jurisdicción; se admite entrada manual aunque falle OCR. La opción central es experimental: usa la imagen completa si no lee bien.
- Guarda un registro por lote y recarga; verifica fecha/hora, operador y localidad. Comprueba que los registros V1 siguen visibles.
- Exporta CSV y guarda en Archivos. Prueba denegar cámara, cancelar selector y una imagen ilegible: el formulario debe seguir funcionando.
- Prepara OCR con conexión; activa modo avión, cierra/abre la PWA y lee otra foto. Comprueba también Safari por separado. No se ha probado en un iPhone físico por el autor de este paquete.

## Alcance y límites
Tesseract.js 6.0.1 / core 6.0.0 y modelo inglés local, sin API ni claves ni servidor de pago. La jurisdicción usa una lista limitada de nombres explícitos reconocidos: California, Florida, Texas, New York, New Jersey, Arizona, Nevada, Puerto Rico, Ontario, Quebec, Jalisco, Nuevo León, Chihuahua, Sonora, Baja California, Ciudad de México y Estado de México. No se adivina por patrón ni se consulta una base oficial. Otros nombres requieren entrada manual. OCR experimental; no es detección especializada de matrículas ni garantiza exactitud.

No se suben ni persisten fotos. El navegador procesa la foto y conserva solo texto. El historial permanece en localStorage, compatible con V1; si no puede leerse, no se sobrescribe hasta borrado explícito. No hay sincronización, recuperación en nube ni importación CSV. Eliminar datos, perder el dispositivo o la expulsión de almacenamiento de iOS puede perder registros y cachés. Exporta frecuentemente. El OCR sin conexión requiere preparación completa previa y caché conservada. El formulario se almacena separado del motor para poder seguir trabajando manualmente si la preparación falla.

## Dependencias incluidas
vendor contiene distribución de tesseract.js, dos núcleos LSTM con WASM incrustado (SIMD y no SIMD), modelo eng de @tesseract.js-data/eng 1.0.0 y licencias/notices correspondientes. Descargados desde npm; no hay dependencias en CDN al ejecutar. No es necesario npm ni compilación para publicar.

## Pruebas de escritorio
Se verificó en Edge sin interfaz a 390×844: conservación de registros V1, confirmación manual, lote, operador/localidad, persistencia tras recarga, preparación del motor, recarga sin red y OCR real de imagen sintética ABC1234 con confianza 92%. Sin errores JavaScript en ese recorrido. La opción de recorte central no leyó esa imagen; por eso se deja desactivada por defecto. Estas pruebas no certifican cámara, Safari, instalación PWA ni almacenamiento en iOS.
