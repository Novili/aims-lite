# AIMS-Lite iOS — Paso 3 · versión inicial

Código fuente de una primera aplicación **nativa** para iPhone: cámara real, OCR de Apple Vision, confirmación/corrección, selección manual de jurisdicción, lote, operador, registro con fecha/hora local y UTC implícito (Date), SQLite e historial persistente.

## Preparación en una Mac

1. Instala Xcode actual desde Apple y sus componentes de iOS.
2. Instala XcodeGen desde https://github.com/yonaskolb/XcodeGen (`brew install xcodegen`, si utilizas Homebrew).
3. En Terminal, abre esta carpeta y ejecuta: `xcodegen generate`.
4. Abre `AIMSLite.xcodeproj` con Xcode.
5. Selecciona el target AIMSLite, configura tu Team y cambia el Bundle Identifier por uno único.
6. Selecciona un **iPhone físico** compatible con iOS 17 o posterior; el simulador no ofrece una cámara real utilizable para esta prueba.
7. Compila con Cmd+B y ejecuta con Cmd+R. Acepta el permiso de cámara.
8. Para ejecutar pruebas: Cmd+U.

## Flujo

En Inicio introduce lote y operador → Iniciar escáner → apunta a placa → verifica o edita el texto → selecciona la jurisdicción → Guardar → consulta Historial.

## Alcance y limitaciones

- Es código entregado **sin compilación ni pruebas en Xcode**, porque este entorno no cuenta con macOS/Xcode. Pueden requerirse ajustes según la versión de Xcode.
- Apple Vision detecta **texto**, no específicamente placas. En esta versión se filtran candidatos por longitud y caracteres; no existe todavía un detector de placa Core ML ni reconocimiento fiable del estado/provincia.
- No hay confirmación automática: cada observación requiere Guardar.
- No se guardan fotografías, solo metadatos de las lecturas confirmadas.
- El conteo de 'veces vista' se hace por placa normalizada + jurisdicción seleccionada.
- Para reconocer placas particulares con letras solamente, o formatos más cortos/largos, será necesario ampliar reglas de validación por jurisdicción.
- El historial actual muestra una fila por lectura; falta una vista agrupada por placa.
- No implementados aún: CSV, sincronización, permisos de operador, cifrado adicional de base local, control de retención, ubicación, listas de autorizados, modelos específicos de placas, pruebas físicas y Android.
- Para uso profesional se debe validar precisión y privacidad en estacionamientos autorizados antes del despliegue.

## Archivos

`project.yml` configuración de XcodeGen; `Models.swift` reglas de placa; `Database.swift` SQLite; `Store.swift` lógica de guardado; `Camera.swift` AVFoundation + Vision; `Views.swift` interfaces SwiftUI; `AIMSLiteTests.swift` pruebas iniciales.
