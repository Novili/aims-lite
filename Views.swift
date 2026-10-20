import SwiftUI

@main struct AIMSLiteApp: App {
    @StateObject private var store = ObservationStore()
    var body: some Scene {
        WindowGroup { HomeView().environmentObject(store).environment(\.locale, Locale(identifier: "en_US")) }
    }
}

struct HomeView: View {
    @EnvironmentObject var store: ObservationStore
    @State private var showScanner = false
    var body: some View {
        NavigationStack {
            Form {
                Section("Shift") {
                    Picker("Active city", selection: $store.activeCity) {
                        ForEach(activeCities, id: \.self) { Text($0).tag($0) }
                    }
                    Text("Stays selected until you change it.")
                        .font(.caption).foregroundStyle(.secondary)
                    TextField("Operator", text: $store.operatorName)
                    Text("Current date: \(Date.now.formatted(date: .abbreviated, time: .shortened))")
                }
                Section("Actions") {
                    Button { showScanner = true } label: { Label("Enter plate (keyboard, voice, camera)", systemImage: "keyboard").font(.headline) }
                    NavigationLink { HistoryView() } label: { Label("History and search", systemImage: "clock.arrow.circlepath") }
                }
                Section("Summary") {
                    LabeledContent("Saved readings", value: "\(store.observations.count)")
                    LabeledContent("Unique plates", value: "\(Set(store.observations.map { $0.normalizedPlate + "|" + $0.jurisdiction }).count)")
                }
                Section { Text("Local records. No photos stored; no internet required for manual entry. Use only in authorized parking areas.").font(.footnote) }
            }
            .navigationTitle("AIMS-Lite")
            .sheet(isPresented: $showScanner) { ScannerView() }
            .alert("Notice", isPresented: Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } })) {
                Button("OK") { store.errorMessage = nil }
            } message: { Text(store.errorMessage ?? "") }
        }
    }
}

struct ScannerView: View {
    @EnvironmentObject var store: ObservationStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var camera = CameraController()
    @State private var plate = ""
    @State private var jurisdiction = "Unknown"
    @State private var inputMode: InputMode = .keyboard
    @StateObject private var voice = VoicePlateInput()
    @FocusState private var plateFocused: Bool
    private enum InputMode: String, CaseIterable { case keyboard = "Keyboard", voice = "Voice", camera = "Camera" }
    @State private var lastSaved: String?

    private var plateSuggestions: [String] {
        PlateRules.suggestions(for: plate, records: store.observations)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Label(store.activeCity, systemImage: "mappin.circle.fill")
                        Spacer()
                        Text("\(store.observations.count) records").foregroundStyle(.secondary)
                    }.font(.subheadline)

                    Picker("Input", selection: $inputMode) {
                        ForEach(InputMode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }.pickerStyle(.segmented)

                    if inputMode == .camera {
                        ZStack {
                            CameraPreview(session: camera.session)
                                .frame(height: 230).clipped()
                            if !camera.isAuthorized {
                                Text(camera.cameraError ?? "Requesting permission…")
                                    .foregroundStyle(.white).padding().background(.black.opacity(0.8))
                            }
                        }.clipShape(RoundedRectangle(cornerRadius: 14))
                        if !camera.candidate.isEmpty {
                            Button("Use OCR suggestion: \(camera.candidate)") {
                                plate = camera.candidate
                            }.buttonStyle(.bordered)
                        }
                        Text("Experimental OCR: always check the plate.")
                            .font(.caption).foregroundStyle(.orange)
                    }

                    if inputMode == .voice {
                        HStack {
                            Button {
                                if voice.listening { voice.stop() }
                                else { Task { await voice.start() } }
                            } label: {
                                Label(voice.listening ? "Stop dictation" : "Dictate plate", systemImage: voice.listening ? "stop.circle.fill" : "mic.fill")
                            }.buttonStyle(.borderedProminent)
                            if voice.listening { ProgressView() }
                        }
                        if !voice.transcript.isEmpty {
                            Text("Heard: \(voice.transcript)").font(.subheadline)
                            Button("Use dictated text and edit") {
                                plate = PlateRules.normalize(voice.transcript)
                                voice.stop()
                                plateFocused = true
                            }.buttonStyle(.bordered)
                        }
                        if let error = voice.errorMessage {
                            Text(error).foregroundStyle(.red).font(.caption)
                        }
                        Text("Say letters and numbers one by one in US English (for example, A B C one two three four). Check the result before saving. Speech recognition may require internet on some devices.")
                            .font(.caption).foregroundStyle(.secondary)
                    }

                    TextField("License plate — enter here", text: $plate)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                        .font(.title2.monospaced())
                        .focused($plateFocused)
                        .onChange(of: plate) { _, value in
                            let clean = PlateRules.normalize(value)
                            if plate != clean { plate = clean }
                        }
                        .accessibilityIdentifier("plateField")

                    if !plateSuggestions.isEmpty {
                        Text("Suggestions from history:").font(.caption).foregroundStyle(.secondary)
                        ForEach(plateSuggestions, id: \.self) { value in
                            Button(value) { plate = value; plateFocused = true }
                                .font(.headline.monospaced()).buttonStyle(.bordered)
                        }
                    }

                    Picker("Plate state", selection: $jurisdiction) {
                        ForEach(jurisdictions, id: \.self) { code in
                            Text("\(code) · \(jurisdictionNames[code] ?? code)").tag(code)
                        }
                    }
                    Text("Select the state printed on the plate, regardless of your current city.")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("Previous sightings: \(store.count(for: plate, jurisdiction: jurisdiction))")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Button {
                        if store.save(plate: plate, jurisdiction: jurisdiction,
                                      source: inputMode == .voice ? "voz" : inputMode == .camera ? "ocr-asistido" : "manual") {
                            lastSaved = PlateRules.normalize(plate)
                            plate = ""
                            voice.transcript = ""
                            camera.candidate = ""
                            plateFocused = true
                        }
                    } label: {
                        Label("Save plate and current time", systemImage: "checkmark.circle.fill")
                            .frame(maxWidth: .infinity).padding(.vertical, 9)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!PlateRules.isPlausible(plate))
                    if let lastSaved {
                        Label("Saved: \(lastSaved)", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    }
                }.padding()
            }
            .navigationTitle("Enter plate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Close") { dismiss() } } }
            .onAppear { plateFocused = true }
            .onDisappear { camera.stop(); voice.stop() }
            .onChange(of: inputMode) { _, mode in
                if mode == .camera { voice.stop(); camera.start() }
                else { camera.stop(); if mode != .voice { voice.stop() }; plateFocused = mode == .keyboard }
            }
        }
    }
}

struct HistoryView: View {
    @EnvironmentObject var store: ObservationStore
    @State private var query = ""
    @State private var pendingDeletion: PlateObservation?
    @State private var showDeleteConfirmation = false
    private var filtered: [PlateObservation] {
        guard !query.isEmpty else { return store.observations }
        return store.observations.filter {
            $0.normalizedPlate.contains(PlateRules.normalize(query)) || $0.lot.localizedCaseInsensitiveContains(query)
        }
    }
    var body: some View {
        List {
            ForEach(filtered) { item in
                NavigationLink {
                    PlateHistoryView(plate: item.normalizedPlate, jurisdiction: item.jurisdiction)
                } label: {
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Text(item.plate).font(.headline.monospaced())
                            Spacer()
                            Text("\(store.count(for: item.plate, jurisdiction: item.jurisdiction)) times").font(.caption).foregroundStyle(.secondary)
                        }
                        Text("\(item.jurisdiction) · \(item.lot)").font(.subheadline)
                        Text(item.observedAt.formatted(date: .abbreviated, time: .standard)).font(.caption).foregroundStyle(.secondary)
                    }
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        pendingDeletion = item; showDeleteConfirmation = true
                    } label: { Label("Delete", systemImage: "trash") }
                }
                .contextMenu {
                    Button(role: .destructive) {
                        pendingDeletion = item; showDeleteConfirmation = true
                    } label: { Label("Delete entry", systemImage: "trash") }
                }
            }
        }
        .confirmationDialog("Delete this entry permanently?", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete entry", role: .destructive) {
                if let pendingDeletion { store.delete(pendingDeletion) }
                pendingDeletion = nil
            }
            Button("Cancel", role: .cancel) { pendingDeletion = nil }
        } message: { Text("Only this sighting will be deleted, not the entire plate history.") }
        .searchable(text: $query, prompt: "Plate or city")
        .navigationTitle("History")
    }
}

struct PlateHistoryView: View {
    @EnvironmentObject var store: ObservationStore
    let plate: String
    let jurisdiction: String
    private var matches: [PlateObservation] {
        store.observations.filter { $0.normalizedPlate == plate && $0.jurisdiction == jurisdiction }
    }
    var body: some View {
        List {
            Section("Summary") {
                LabeledContent("Plate", value: plate)
                LabeledContent("State / province", value: jurisdiction)
                LabeledContent("Sightings", value: "\(matches.count)")
            }
            Section("All readings") {
                ForEach(matches) { item in
                    VStack(alignment: .leading) {
                        Text(item.observedAt.formatted(date: .complete, time: .standard))
                        Text("City \(item.lot) · \(item.operatorName) · \(item.source)")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }.navigationTitle("Plate details")
    }
}
