import AVFoundation
import Vision
import SwiftUI

final class CameraController: NSObject, ObservableObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    let session = AVCaptureSession()
    @Published var candidate = ""
    @Published var isAuthorized = false
    @Published var cameraError: String?
    private let captureQueue = DispatchQueue(label: "aimslite.capture")
    private let recognitionQueue = DispatchQueue(label: "aimslite.ocr")
    private var configured = false
    private var lastRecognition = Date.distantPast
    private var previousCandidate = ""
    private var consecutiveMatches = 0

    func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: prepare()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async { self?.isAuthorized = granted }
                if granted { self?.prepare() }
            }
        default:
            DispatchQueue.main.async { self.isAuthorized = false; self.cameraError = "Enable Camera access in Settings." }
        }
    }

    private func prepare() {
        DispatchQueue.main.async { self.isAuthorized = true }
        captureQueue.async {
            if !self.configured {
                self.session.beginConfiguration()
                self.session.sessionPreset = .high
                guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                      let input = try? AVCaptureDeviceInput(device: device),
                      self.session.canAddInput(input) else {
                    self.session.commitConfiguration()
                    DispatchQueue.main.async { self.cameraError = "Could not start the rear camera." }
                    return
                }
                self.session.addInput(input)
                let output = AVCaptureVideoDataOutput()
                output.alwaysDiscardsLateVideoFrames = true
                output.setSampleBufferDelegate(self, queue: self.recognitionQueue)
                if self.session.canAddOutput(output) { self.session.addOutput(output) }
                self.session.commitConfiguration()
                self.configured = true
            }
            if !self.session.isRunning { self.session.startRunning() }
        }
    }

    func stop() { captureQueue.async { if self.session.isRunning { self.session.stopRunning() } } }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let now = Date()
        guard now.timeIntervalSince(lastRecognition) > 0.45,
              let pixel = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        lastRecognition = now
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false
        request.minimumTextHeight = 0.018
        do {
            try VNImageRequestHandler(cvPixelBuffer: pixel, orientation: .right, options: [:]).perform([request])
            let candidates = (request.results ?? []).compactMap { item -> (String, Float)? in
                guard let best = item.topCandidates(1).first else { return nil }
                let plate = PlateRules.normalize(best.string)
                guard PlateRules.isPlausible(plate), best.confidence >= 0.35 else { return nil }
                return (plate, best.confidence)
            }
            guard let best = candidates.max(by: { $0.1 < $1.1 }) else { return }
            if best.0 == previousCandidate { consecutiveMatches += 1 }
            else { previousCandidate = best.0; consecutiveMatches = 1 }
            if consecutiveMatches >= 2 {
                DispatchQueue.main.async { self.candidate = best.0 }
            }
        } catch { /* Continue capturing; no images persisted. */ }
    }
}

final class VideoPreviewLayerView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var videoLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}

struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession
    func makeUIView(context: Context) -> VideoPreviewLayerView {
        let view = VideoPreviewLayerView()
        view.videoLayer.session = session
        view.videoLayer.videoGravity = .resizeAspectFill
        return view
    }
    func updateUIView(_ uiView: VideoPreviewLayerView, context: Context) {}
}
