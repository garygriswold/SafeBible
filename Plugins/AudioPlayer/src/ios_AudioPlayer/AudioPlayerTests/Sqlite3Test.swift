//
//  Sqlite3Test.swift
//  AudioPlayerTests
//
//  Created by Gary Griswold on 11/20/17.
//  Copyright © 2017 ShortSands. All rights reserved.
//

import XCTest

class Sqlite3Test: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    func testNonExistantDB() {
        let db = Sqlite3()
        do {
            try db.open(dbPath: "NonExistant.db", copyIfAbsent: false)
            assert(false, "Exception expected")
        } catch Sqlite3Error.databaseNotFound {
            assert(true)
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
    }
    
    func testNonExistantWithCopy() {
        let db = Sqlite3()
        do {
            try db.open(dbPath: "NonExistant.db", copyIfAbsent: true)
            assert(false, "Exception Expected")
        } catch Sqlite3Error.databaseNotInBundle {
            assert(true)
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
    }
    
    /**
    * This is succeeding, but I really wanted it to fail, because it is not a DB."
    */
    func testNonDBInBundle() {
        let db = Sqlite3()
        do {
            try db.open(dbPath: "EmmaFirstLostTooth.mp3", copyIfAbsent: true)
            db.close()
            assert(true)
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
    }
    
    func testValidDBInBundle() {
        let db = Sqlite3()
        do {
            try db.open(dbPath: "Versions.db", copyIfAbsent: true)
            db.close()
            assert(true)
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
    }
    
    func testInvalidSelect() {
        let db = Sqlite3()
        do {
            try db.open(dbPath: "Versions.db", copyIfAbsent: true)
            defer { db.close() }
            let query = "select * from NonExistantTable"
            try db.stringSelect(query: query, complete: { resultSet in
                assert(false, "Throw should prevent this")
            })
        } catch Sqlite3Error.selectPrepareFailed {
            assert(true)
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
    }
    
    func testValidSelectNoRows() {
        let db = Sqlite3()
        do {
            let ready = expectation(description: "ready")
            try db.open(dbPath: "Versions.db", copyIfAbsent: true)
            defer { db.close() }
            let query = "select * from Video where languageId is null"
            try db.stringSelect(query: query, complete: { resultSet in
                assert(resultSet.count == 0, "There should be no rows returned")
                ready.fulfill()
            })
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
        waitForExpectations(timeout: 5, handler: { error in
            XCTAssertNil(error, "Error")
        })
    }
    
    func testValidSelectRows() {
        let db = Sqlite3()
        do {
            let ready = expectation(description: "ready")
            try db.open(dbPath: "Versions.db", copyIfAbsent: true)
            defer { db.close() }
            let query = "select languageId, mediaId, lengthMS from Video"
            try db.stringSelect(query: query, complete: { resultSet in
                assert(resultSet.count > 10, "There should be many rows")
                let row: [String?] = resultSet[0]
                assert(row.count == 3, "There should be 3 columns.")
                ready.fulfill()
            })
        } catch let err {
            assert(false, Sqlite3.errorDescription(error: err))
        }
        waitForExpectations(timeout: 5, handler: { error in
            XCTAssertNil(error, "Error")
        })
    }
    
    func NOtestPerformanceExample() {
        // This is an example of a performance test case.
        self.measure {
            // Put the code you want to measure the time of here.
        }
    }
}
