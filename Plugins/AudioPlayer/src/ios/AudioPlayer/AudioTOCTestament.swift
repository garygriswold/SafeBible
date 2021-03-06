//
//  AudioTOCTestament.swift
//  AudioPlayer
//
//  Created by Gary Griswold on 8/8/17.
//  Copyright © 2017 ShortSands. All rights reserved.
//

import Utility

class AudioTOCTestament {
    
    let bible: AudioTOCBible
    let damId: String
    var booksById: Dictionary<String, AudioTOCBook>
    private var booksBySeq: Dictionary<Int, AudioTOCBook>

    init(bible: AudioTOCBible, database: Sqlite3, damId: String) {
        self.bible = bible
        self.damId = damId
        self.booksById = Dictionary<String, AudioTOCBook>()
        self.booksBySeq = Dictionary<Int, AudioTOCBook>()

        let query = "SELECT bookId, bookOrder, bookName, numberOfChapters" +
            " FROM AudioBook" +
            " WHERE damId = ?" +
            " ORDER BY bookOrder"
        do {
            let resultSet = try database.queryV1(sql: query, values: [self.damId])
            for index in 0..<resultSet.count {
                let row = resultSet[index]
                let book = AudioTOCBook(testament: self, index: index, dbRow: row)
                self.booksById[book.bookId] = book
                self.booksBySeq[book.sequence] = book
            }
        } catch let err {
            print("ERROR \(Sqlite3.errorDescription(error: err))")
        }
    }
    
    deinit {
       print("***** Deinit TOCAudioTOCBible *****") 
    }
    
    func nextChapter(reference: AudioReference) -> AudioReference? {
        let ref = reference
        let book = ref.tocAudioBook
        if (ref.chapterNum < book.numberOfChapters) {
            let next = ref.chapterNum + 1
            return AudioReference(book: ref.tocAudioBook, chapterNum: next, fileType: ref.fileType)
        } else {
            if let nextBook = self.booksBySeq[reference.sequenceNum + 1] {
                return AudioReference(book: nextBook, chapter: "001", fileType: ref.fileType)
            }
        }
        return nil
    }
    
    func priorChapter(reference: AudioReference) -> AudioReference? {
        let ref = reference
        let prior = ref.chapterNum - 1
        if (prior > 0) {
            return AudioReference(book: ref.tocAudioBook, chapterNum: prior, fileType: ref.fileType)
        } else {
            if let priorBook = self.booksBySeq[reference.sequenceNum - 1] {
                return AudioReference(book: priorBook,
                                 chapterNum: priorBook.numberOfChapters, fileType: ref.fileType)
            }
        }
        return nil
    }
    
    func getBookList() -> String {
        var array = [String]()
        for (_, book) in self.booksBySeq {
            array.append(book.bookId)
        }
        return array.joined(separator: ",")
    }
    
    func toString() -> String {
        let str = "damId=" + self.damId
        return str
    }
}
