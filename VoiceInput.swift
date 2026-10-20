import Foundation
import Speech
import AVFoundation

@MainActor final class VoicePlateInput: ObservableObject {
    @Published var transcript = ""
    @Published var listening = false
    @Published var errorMessage: String?
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var tapInstalled = false

    func start() async {
        guard !listening else { return }
        let authorized = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
        guard authorized else { errorMessage = "Enable Speech Recognition in Settings."; return }
        let micAllowed = await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { allowed in continuation.resume(returning: allowed) }
        }
        guard micAllowed else { errorMessage = "Enable Microphone access in Settings."; return }
        guard let recognizer, recognizer.isAvailable else { errorMessage = "Dictation unavailable. Use the keyboard."; return }
        do {
            transcript = ""
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
            try session.setActive(true)
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            request.contextualStrings = ["license plate", "plate number", "letter A", "letter B", "letter C"]
            request.requiresOnDeviceRecognition = recognizer.supportsOnDeviceRecognition
            self.request = request
            let node = engine.inputNode
            let format = node.outputFormat(forBus: 0)
            node.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in request.append(buffer) }
            tapInstalled = true
            engine.prepare()
            try engine.start()
            listening = true
            task = recognizer.recognitionTask(with: request) { [weak self] result, error in
                Task { @MainActor in
                    if let result { self?.transcript = result.bestTranscription.formattedString }
                    if error != nil || result?.isFinal == true { self?.stop() }
                }
            }
        } catch {
            stop()
            errorMessage = "Could not start microphone: \(error.localizedDescription)"
        }
    }

    func stop() {
        if engine.isRunning { engine.stop() }
        if tapInstalled { engine.inputNode.removeTap(onBus: 0); tapInstalled = false }
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        listening = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
