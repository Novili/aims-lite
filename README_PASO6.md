# AIMS-Lite · revisión de entrada rápida (Paso 6)

## Cambios solicitados
- Entrada principal **manual**, con teclado inicialmente enfocado.
- Modo **Voz** mediante Apple Speech y micrófono: muestra transcripción; operador pulsa **Usar texto dictado y corregir** y luego **Guardar**. No guarda automáticamente y puede necesitar acceso a Internet según el modelo/idioma.
- Modo **Cámara/OCR experimental** opcional; no rellena automáticamente la placa (evita sobreescritura de la entrada manual). OCR general de pantalla completa continúa sin detector específico de matrículas y puede fallar.
- Autocompletado **por prefijo** desde placas registradas previamente: las cinco primeras sugerencias; toque para completar.
- Abreviaturas: CA, WA, OR, NV, ID, AZ, UT, MT, WY, CO, NM, ND, SD, NE, KS, TX. Incluye estados con una región en horario Montaña, aunque la mayor parte de su territorio esté en otra zona. **La zona horaria del lugar del registro se toma del iPhone, no de la jurisdicción de la placa.**
- Selector de ciudad persistente: **Loma Linda, Murrieta, San Bernardino**. La ciudad solo cambia al elegir otra. Guardamos el nombre de ciudad en el campo SQLite `lot` por compatibilidad con la base anterior; en un paso posterior conviene separar columnas `city` y `lot` mediante migración.
- En Historial, deslizar a izquierda o mantener presionado y elegir **Borrar entrada**; pedir confirmación. El borrado afecta solo a esa lectura.

## Archivos cambiados
- `AIMSLite/Views.swift`: UI manual/voz/cámara, sugerencias, ciudad, eliminación.
- `AIMSLite/VoiceInput.swift`: dictado.
- `AIMSLite/Models.swift`: estados, ciudades y autocompletado.
- `AIMSLite/Store.swift`: ciudad persistente y borrado.
- `AIMSLite/Database.swift`: `DELETE` por UUID.
- `project.yml`: descripciones de permisos Speech/Microphone.
- `AIMSLiteTests/AIMSLiteTests.swift`: pruebas complementarias.

## Compatibilidad y limitaciones
El paquete **no fue compilado en macOS/Xcode ni instalado en iPhone** desde este entorno. Se requiere compilar en un runner macOS y firmar para probar el hardware. No se ejecutó ninguna migración destructiva; los registros anteriores se conservan si instalas la actualización sin eliminar la app. Los históricos previos podrían mostrar códigos antiguos de estado con su denominación completa y el valor previo de lote: no se convierten automáticamente. El borrado es irreversible y no tiene papelera.

## Próximas pruebas en iPhone
1. Instalar como actualización con el **mismo bundle identifier y firma compatible**, sin borrar la aplicación anterior.
2. Escribir una placa y comprobar sugerencias; guardar, buscar, repetir y borrar una sola observación.
3. Conceder permiso para micrófono y reconocimiento de voz; pronunciar letras por separado; comprobar/corregir antes de guardar.
4. Cambiar ciudad y cerrar/reabrir app; verificar que persiste y se atribuyen los nuevos registros a la ciudad correcta.
5. Medir al menos 100 lecturas manual/voz/OCR en condiciones reales antes de comparar resultados.
