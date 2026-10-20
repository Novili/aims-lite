# AIMS-Lite — English-only user experience

All visible iPhone labels, prompts, permissions and error messages in the Swift source have been changed to US English. Speech recognizer locale is explicitly `en-US`; the SwiftUI app also sets `en_US` as its display locale. Cities remain **Loma Linda, Murrieta, San Bernardino**. State codes remain unchanged.

**Use:** Choose Voice, tap Dictate plate, say letters individually in US English (e.g. “A B C one two three four”), tap Use dictated text and edit, verify the plate, and tap Save plate and current time. Alternative: enter using Keyboard. Camera OCR remains experimental.

**Limitations:** Generic speech-to-text can merge/spell out words or confuse letters and digits. PlateRules.normalize removes spaces and punctuation and uppercases; ALWAYS confirm before save. Offline speech depends on device support; a data connection may be required. This package is source only, not an installed app and has NOT been compiled on Xcode.

**Existing data:** Code changes alone do not delete the SQLite database, but uninstalling or changing app identity may. Back up existing observations before changing installation methods.
