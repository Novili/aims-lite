# AIMS-Lite 2.6

English interface and optional American English (`en-US`) plate dictation, manual entry with history-based plate suggestions, persistent operator/city/state/lot preferences, and Loma Linda, Murrieta and San Bernardino city suggestions. State choices include Pacific and Mountain states, including states partly in Mountain time, plus Arkansas. These are plate jurisdictions, not a change to record time zones; visit counts still use device time.

Existing history remains in `aims-lite-v1-history`, with all record fields preserved. No history migration is required. Before each write or deletion, the exact previous JSON is saved to `aims-lite-v1-history-backup-before-change`; failure to back up blocks the write. Download JSON backup exports the current and previous raw history and preferences. Keep downloaded backups separately; local backups share the same device storage. Invalid history is never overwritten. Changes detected from another tab require reload.

Individual deletion confirms the plate, state and timestamp. Bulk deletion also requires confirmation. Voice suggestions require review and explicit Save. Browser speech services may need internet and transmit audio to their provider; manual entry remains available when speech is unsupported or denied.

The application shell cache and all script/style URLs use 2.6. Cache activation does not touch localStorage. Existing open tabs show an update message and can reload after finishing an entry. Offline OCR must be prepared again after a version update.

Validation: JavaScript syntax checks and automated application harness covering legacy data preservation, backup before save, individual deletion, concurrent changes, corrupt/unavailable storage, and speech token parsing. Real microphone, iPhone camera and airplane-mode testing still require physical devices.
