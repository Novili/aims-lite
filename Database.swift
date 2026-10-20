import Foundation
import SQLite3

final class ObservationDatabase {
    private var db: OpaquePointer?

    init() throws {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let path = dir.appendingPathComponent("observations.sqlite").path
        guard sqlite3_open(path, &db) == SQLITE_OK else { throw databaseError() }
        try execute("PRAGMA journal_mode=WAL;")
        try execute("""
            CREATE TABLE IF NOT EXISTS observations (
                id TEXT PRIMARY KEY,
                plate TEXT NOT NULL,
                normalized TEXT NOT NULL,
                jurisdiction TEXT NOT NULL,
                lot TEXT NOT NULL,
                operator_name TEXT NOT NULL,
                observed_at REAL NOT NULL,
                source TEXT NOT NULL
            );
        """)
        try execute("CREATE INDEX IF NOT EXISTS idx_plates ON observations(normalized, jurisdiction);")
        try execute("CREATE INDEX IF NOT EXISTS idx_dates ON observations(observed_at);")
    }

    deinit { sqlite3_close(db) }

    private func databaseError() -> NSError {
        let message = db.map { String(cString: sqlite3_errmsg($0)) } ?? "SQLite error"
        return NSError(domain: "AIMSLite.Database", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }

    private func execute(_ sql: String) throws {
        guard sqlite3_exec(db, sql, nil, nil, nil) == SQLITE_OK else { throw databaseError() }
    }

    func insert(_ observation: PlateObservation) throws {
        let sql = "INSERT INTO observations(id,plate,normalized,jurisdiction,lot,operator_name,observed_at,source) VALUES (?,?,?,?,?,?,?,?);"
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else { throw databaseError() }
        defer { sqlite3_finalize(statement) }
        func bind(_ index: Int32, _ value: String) {
            _ = value.withCString { sqlite3_bind_text(statement, index, $0, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self)) }
        }
        bind(1, observation.id.uuidString)
        bind(2, observation.plate)
        bind(3, observation.normalizedPlate)
        bind(4, observation.jurisdiction)
        bind(5, observation.lot)
        bind(6, observation.operatorName)
        sqlite3_bind_double(statement, 7, observation.observedAt.timeIntervalSince1970)
        bind(8, observation.source)
        guard sqlite3_step(statement) == SQLITE_DONE else { throw databaseError() }
    }


    func delete(id: UUID) throws {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, "DELETE FROM observations WHERE id = ?;", -1, &statement, nil) == SQLITE_OK else { throw databaseError() }
        defer { sqlite3_finalize(statement) }
        _ = id.uuidString.withCString { sqlite3_bind_text(statement, 1, $0, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self)) }
        guard sqlite3_step(statement) == SQLITE_DONE else { throw databaseError() }
    }

    func all() throws -> [PlateObservation] {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, "SELECT id,plate,jurisdiction,lot,operator_name,observed_at,source FROM observations ORDER BY observed_at DESC;", -1, &statement, nil) == SQLITE_OK else { throw databaseError() }
        defer { sqlite3_finalize(statement) }
        var result: [PlateObservation] = []
        while sqlite3_step(statement) == SQLITE_ROW {
            func field(_ index: Int32) -> String { sqlite3_column_text(statement, index).map { String(cString: $0) } ?? "" }
            guard let id = UUID(uuidString: field(0)) else { continue }
            result.append(PlateObservation(id: id, plate: field(1), jurisdiction: field(2), lot: field(3), operatorName: field(4), observedAt: Date(timeIntervalSince1970: sqlite3_column_double(statement, 5)), source: field(6)))
        }
        return result
    }
}
