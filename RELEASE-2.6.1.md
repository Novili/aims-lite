# AIMS-Lite 2.6.1

Fixes from the local review:

- Block form submission while OCR or dictation is active. Disable conflicting controls during OCR and camera/offline preparation during dictation.
- Cancel late OCR initialization and scan passes after timeout; terminate an abandoned worker rather than letting it replace the active worker.
- Handle blocked storage when downloading a JSON backup, and attach the download link to the document for browser compatibility.
- Replace misleading corrupt-history reset instructions with backup/recovery instructions. Original unreadable data remains untouched.
- Detect cross-tab clearing of all storage as well as changes to the history key.
- Avoid periodic replacement of a focused history deletion button.
- Handle speech-recognition constructor failure and retain manual entry.
- Wrap history actions on narrow screens and clamp tiny OCR crops to valid dimensions and bounded width.
- Bump visible version, asset URLs and cache to 2.6.1.

Run `node tests/entry.cjs`. Tests cover legacy data preservation, individual deletion, backup failure, corrupt/unavailable storage, recognition submission guards, storage clearing, speech initialization failure, shell asset existence and tiny OCR images. JavaScript syntax and Git whitespace checks pass. Physical microphone/camera, real-browser layout and offline operation still need device validation. No user-device data was accessed or migrated.

Publication remains pending GitHub authentication with write access to Novili/aims-lite. No successful push or Pages deployment has been verified.
