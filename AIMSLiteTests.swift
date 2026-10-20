import XCTest
@testable import AIMSLite

final class AIMSLiteTests: XCTestCase {
    func testNormalization() {
        XCTAssertEqual(PlateRules.normalize(" ab-012 3 "), "AB0123")
    }
    func testAutocomplete() {
        let prior = [PlateObservation(id: UUID(), plate: "ABC1234", jurisdiction: "CA", lot: "Loma Linda", operatorName: "X", observedAt: Date(), source: "manual")]
        XCTAssertEqual(PlateRules.suggestions(for: "ab", records: prior), ["ABC1234"])
        XCTAssertEqual(PlateRules.suggestions(for: "abc1234", records: prior), [])
    }
    func testCities() {
        XCTAssertEqual(activeCities, ["Loma Linda", "Murrieta", "San Bernardino"])
    }
    func testValidation() {
        XCTAssertTrue(PlateRules.isPlausible("ABC1234"))
        XCTAssertFalse(PlateRules.isPlausible("A"))
        XCTAssertFalse(PlateRules.isPlausible("CALIFORNIA"))
    }
}
