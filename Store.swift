import Foundation
import SwiftUI

@MainActor final class ObservationStore: ObservableObject {
    @Published private(set) var observations: [PlateObservation] = []
    @Published var errorMessage: String?
    @AppStorage("activeCity") var activeCity = "Loma Linda"
    @AppStorage("activeLot") var activeLot = "Not assigned"
    @AppStorage("operatorName") var operatorName = "Operator 01"
    private let database: ObservationDatabase?

    init() {
        do { database = try ObservationDatabase() }
        catch {
            database = nil
            errorMessage = "Could not open database: \(error.localizedDescription)"
        }
        reload()
    }

    func reload() {
        do { observations = try database?.all() ?? [] }
        catch { errorMessage = "Error loading records: \(error.localizedDescription)" }
    }

    @discardableResult func save(plate: String, jurisdiction: String, source: String) -> Bool {
        let normalized = PlateRules.normalize(plate)
        guard PlateRules.isPlausible(normalized), !activeCity.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Check the plate (4–9 characters, at least one digit) and the city."
            return false
        }
        let observation = PlateObservation(id: UUID(), plate: plate.uppercased().trimmingCharacters(in: .whitespacesAndNewlines), jurisdiction: jurisdiction, lot: activeCity, operatorName: operatorName, observedAt: Date(), source: source)
        do {
            guard let database else { throw NSError(domain: "AIMSLite", code: 1, userInfo: [NSLocalizedDescriptionKey: "Database unavailable"]) }
            try database.insert(observation)
            reload()
            return true
        } catch {
            errorMessage = "Could not save: \(error.localizedDescription)"
            return false
        }
    }

    func delete(_ observation: PlateObservation) {
        do {
            guard let database else { return }
            try database.delete(id: observation.id)
            reload()
        } catch { errorMessage = "Could not delete: \(error.localizedDescription)" }
    }

    func count(for plate: String, jurisdiction: String) -> Int {
        observations.filter { $0.normalizedPlate == PlateRules.normalize(plate) && $0.jurisdiction == jurisdiction }.count
    }
}
