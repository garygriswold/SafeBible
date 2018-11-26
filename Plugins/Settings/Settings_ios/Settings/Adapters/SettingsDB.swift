//
//  SettingsDB.swift
//  Settings
//
//  Created by Gary Griswold on 10/20/18.
//  Copyright © 2018 ShortSands. All rights reserved.
//

import Utility

struct SettingsDB {
    
    static var shared = SettingsDB()
    
    private init() {}
    
    //
    // Settings Table
    //
    func getSettings(name: String) -> [String]? {
        if let value = self.getSetting(name: name) {
            return value.components(separatedBy: ",")
        } else {
            return nil
        }
    }
    
    func getFloat(name: String, ifNone: Float) -> Float {
        if let value = self.getSetting(name: name) {
            if let float = Float(value) {
                return float
            }
        }
        return ifNone
    }
    
    func getBool(name: String, ifNone: Bool) -> Bool {
        if let value = self.getSetting(name: name) {
            return (value == "T") ? true : false
        }
        return ifNone
    }

    func getSetting(name: String) -> String? {
        let sql = "SELECT value FROM Settings WHERE name = ?"
        do {
            let db: Sqlite3 = try self.getSettingsDB()
            let resultSet: [[String?]] = try db.queryV1(sql: sql, values: [name])
            if resultSet.count > 0 && resultSet[0].count > 0 {
                return resultSet[0][0]!
            } else {
                return nil
            }
        } catch let err {
            print("ERROR: SettingsDB.getSettings \(err)")
        }
        return ""
    }
    
    func updateSettings(name: String, settings: [String]) {
        self.updateSetting(name: name, setting: settings.joined(separator: ","))
    }
    
    func updateFloat(name: String, setting: Float) {
        self.updateSetting(name: name, setting: "\(setting)")
    }
    
    func updateBool(name: String, setting: Bool) {
        self.updateSetting(name: name, setting: (setting) ? "T" : "F")
    }
    
    func updateSetting(name: String, setting: String) {
        let sql = "REPLACE INTO Settings (name, value) VALUES (?,?)"
        let values = [name, setting]
        do {
            let db: Sqlite3 = try self.getSettingsDB()
            let count = try db.executeV1(sql: sql, values: values)
            print("Setting updated \(count)")
        } catch let err {
            print("ERROR: SettingsDB.updateSetting \(err)")
        }
    }
    
    
    
    //
    // History Table
    //
    func getHistory() -> [Reference] {
        let db: Sqlite3
        do {
            db = try self.getSettingsDB()
            let sql = "SELECT bibleId, bookId, chapter, verse" +
                    " FROM History ORDER BY datetime asc limit 100"
            let resultSet = try db.queryV1(sql: sql, values: [])
            let history = resultSet.map {
                Reference(bibleId: $0[0]!, bookId: $0[1]!, chapter: Int($0[2]!) ?? 1,
                          verse: ($0[3] != nil) ? Int($0[3]!) : nil)
            }
            return history
        } catch {
            return []
        }
    }
    
    func storeHistory(reference: Reference) {
        let db: Sqlite3
        do {
            db = try self.getSettingsDB()
            let sql = "INSERT INTO History (bibleId, bookId, chapter, verse," +
                    " datetime) VALUES (?,?,?,?,?)"
            let datetime = Date().description
            let values: [Any] = [reference.bibleId, reference.bookId,
                                 reference.chapter, reference.verse, datetime]
            _ = try db.executeV1(sql: sql, values: values)
        } catch let err {
            print("ERROR SettingsDB.storeHistory \(err)")
        }
    }
    
    func clearHistory() {
        let db: Sqlite3
        do {
            db = try self.getSettingsDB()
            let sql = "DELETE FROM History"
            _ = try db.executeV1(sql: sql, values: [])
        } catch let err {
            print("ERROR SettingsDB.clearHistory \(err)")
        }
    }
    
    //
    // Notes Table
    //
    func getNotes(bookId: String, chapter: Int, bibleId: String) -> [Note] {
        let db: Sqlite3
        do {
            db = try self.getSettingsDB()
            let sql = "SELECT verse, bookmark, highlightColor, startChar, endChar, note" +
                " FROM Notes" +
                " WHERE bookId = ?" +
                " AND chapter = ?" +
                " AND (bibleId = ? OR bibleId = '0')"
            let values: [Any] = [bookId, chapter, bibleId]
            let resultSet = try db.queryV1(sql: sql, values: values)
            let notes = resultSet.map {
                Note(bookId: bookId, chapter: chapter, verse: Int($0[0]!)!, bibleId: bibleId,
                     bookmark: $0[1] == "T", highlightColor: $0[2],
                     startChar: toInt($0[3]), endChar: toInt($0[4]), note: $0[5])
            }
            return notes
        } catch let err {
            print("ERROR SettingsDB.getNotes \(err)")
            return []
        }
    }
    
    private func toInt(_ value: String?) -> Int? {
        return (value != nil) ? Int(value!) : nil
    }
    
    func storeNote(note: Note) {
        let db: Sqlite3
        do {
            db = try self.getSettingsDB()
            let sql = "REPLACE INTO Notes (bookId, chapter, verse, bibleId," +
                " bookmark, highlightColor, startChar, endChar, note) VALUES" +
                " (?,?,?,?,?,?,?,?,?)"
            var values = [Any?]()
            values.append(note.bookId)
            values.append(note.chapter)
            values.append(note.verse)
            values.append(note.bibleId)
            values.append(note.bookmark)
            values.append(note.highlightColor)
            values.append(note.startChar)
            values.append(note.endChar)
            values.append(note.note)
            _ = try db.executeV1(sql: sql, values: values)
        } catch let err {
            print("ERROR SettingsDB.storeNote \(err)")
        }
    }
    
    private func getSettingsDB() throws -> Sqlite3 {
        var db: Sqlite3?
        let dbname = "Settings.db"
        do {
            db = try Sqlite3.findDB(dbname: dbname)
        } catch Sqlite3Error.databaseNotOpenError {
            db = try Sqlite3.openDB(dbname: dbname, copyIfAbsent: false)
            let create1 = "CREATE TABLE IF NOT EXISTS Settings(" +
                " name TEXT PRIMARY KEY NOT NULL, value TEXT NULL)"
            _ = try db?.executeV1(sql: create1, values: [])
            let create2 = "CREATE TABLE IF NOT EXISTS History(" +
                " bibleId TEXT NOT NULL," +
                " bookId TEXT NOT NULL," +
                " chapter INT NOT NULL," +
                " verse INT NULL," +
                " datetime TEXT NOT NULL)" ///// ??? The datetime should be primary key
            _ = try db?.executeV1(sql: create2, values: [])
            let create3 = "CREATE TABLE IF NOT EXISTS Notes(" +
                " bookId TEXT NOT NULL," +
                " chapter INT NOT NULL," +
                " verse INT NOT NULL," +
                " bibleId TEXT NOT NULL," +
                " bookmark TEXT check(bookmark IN ('T', 'F'))," +
                " highlightColor TEXT NULL," +
                " startChar INT NULL," +
                " endChar INT NULL," +
                " note TEXT NULL," +
                " PRIMARY KEY (bookId, chapter, verse, bibleId))"
            _ = try db?.executeV1(sql: create3, values: [])
        }
        return db!
    }
}