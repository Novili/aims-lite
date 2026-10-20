import Foundation

struct PlateObservation: Identifiable, Hashable {
    let id: UUID
    let plate: String
    let jurisdiction: String
    let lot: String
    let operatorName: String
    let observedAt: Date
    let source: String

    var normalizedPlate: String { PlateRules.normalize(plate) }
}

enum PlateRules {
    static func normalize(_ plate: String) -> String {
        plate.uppercased().filter { $0.isASCII && $0.isLetter || $0.isASCII && $0.isNumber }
    }
    static func isPlausible(_ plate: String) -> Bool {
        let value = normalize(plate)
        return (4...9).contains(value.count) && value.contains(where: { $0.isNumber })
    }
}

// Plates emitidas por estados que utilizan horario del Pacífico o de la Montaña
// en alguna parte de su territorio. La jurisdicción de la placa NO determina
// la zona horaria del evento; Date registra el instante de la observación.
let jurisdictions = [
    "—", "CA", "WA", "OR", "NV", "ID", "AZ", "UT", "MT", "WY",
    "CO", "NM", "ND", "SD", "NE", "KS", "TX", "OTRO"
]
let jurisdictionNames: [String: String] = [
    "—":"Unknown", "CA":"California", "WA":"Washington", "OR":"Oregon",
    "NV":"Nevada", "ID":"Idaho", "AZ":"Arizona", "UT":"Utah",
    "MT":"Montana", "WY":"Wyoming", "CO":"Colorado", "NM":"New Mexico",
    "ND":"North Dakota", "SD":"South Dakota", "NE":"Nebraska",
    "KS":"Kansas", "TX":"Texas (western part)", "OTRO":"Other state/province"
]
let activeCities = ["Loma Linda", "Murrieta", "San Bernardino"]

extension PlateRules {
    static func suggestions(for input: String, records: [PlateObservation]) -> [String] {
        let prefix = normalize(input)
        guard !prefix.isEmpty else { return [] }
        return Array(Set(records.map(\.normalizedPlate).filter { $0.hasPrefix(prefix) && $0 != prefix }))
            .sorted().prefix(5).map { $0 }
    }
}
