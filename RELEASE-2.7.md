# AIMS-Lite 2.7

Compact English entry form: Location (Loma Linda, Murrieta, San Bernardino), Lot (PAT/PHY/SERV), Operator (up to 3 uppercase letters/digits), Plate (up to 12 characters), State (uppercase code with smaller full name). Location is a fixed select; widths wrap on smaller screens. Entry precedes the photo card. Existing records and stored lot values remain unchanged. Older operator preferences that do not fit are left stored; the visible field asks for new initials rather than truncating a name into an identifier.

Voice displays interim results instead of waiting only for final recognition. It uses already-installed on-device en-US recognition when the browser reports it available, otherwise the existing browser service. No language pack is installed, no new account/API key is required, and no new third-party speech service is added. Stop dictation and review the plate before saving. Recognition latency and accuracy still depend on the browser/device/service and have not been benchmarked with a real microphone.

Validation: syntax and regression checks, including field order, uppercase conversion, input length limits, interim speech results and legacy data preservation. Local browser preview failed with a connection timeout, so actual visual and microphone checks remain pending. Cache and version updated to 2.7.
