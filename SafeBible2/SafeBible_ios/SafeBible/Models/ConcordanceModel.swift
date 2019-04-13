//
//  SearchModel.swift
//  SafeBible
//
//  Created by Gary Griswold on 4/8/19.
//  Copyright © 2019 ShortSands. All rights reserved.
//

import Foundation

struct WordRef : Equatable, Hashable {
    
    private static let delims = CharacterSet(charactersIn: ":;")
    
    let bookId: String
    let chapter: UInt8
    let verse: UInt8
    var positions: [UInt8]
    var wordPositions: WordPositions!
    
    init(reference: String) {
        let parts = reference.components(separatedBy: WordRef.delims)
        self.bookId = parts[0]
        self.chapter = UInt8(parts[1])!
        self.verse = UInt8(parts[2])!
        self.positions = [UInt8(parts[3])!]
    }
    
    mutating func add(position: UInt8) {
        self.positions.append(position)
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.bookId)
        hasher.combine(self.chapter)
        hasher.combine(self.verse)
    }
    
    static func == (lhs: WordRef, rhs: WordRef) -> Bool {
        return lhs.bookId == rhs.bookId && lhs.chapter == rhs.chapter && lhs.verse == rhs.verse
    }
}

struct WordPositions {
    var positions: [[UInt8]]
    
    init(numWords: Int) {
        self.positions = Array(repeating: [UInt8](), count: numWords)
    }
    
    var numWords: Int {
        return self.positions.count
    }
    
    mutating func addWord(word: Int, positions: [UInt8]) {
        self.positions[word] = positions
    }
    
    mutating func addReference(positions: [UInt8]) {
        for wordIndex in 0..<positions.count {
            self.positions[wordIndex].append(positions[wordIndex])
        }
    }
}


struct ConcordanceModel {
    
    struct TempWordRef : Equatable, Hashable {
        let nodeId: String
        var position: Int  // Should be unsigned byte, or unsigned short
        
        init(reference: String) {
            let parts = reference.components(separatedBy: ";")
            self.nodeId = parts[0]
            self.position = Int(parts[1])!
        }
        
        //var hashValue: Int {
        //    return self.nodeId.hashValue
        //}
        
        func hash(into hasher: inout Hasher) {
            hasher.combine(self.nodeId)
        }
        
        var reference: String {
            get {
                return self.nodeId + ";" + String(self.position)
            }
        }
        
        mutating func next() {
            self.position += 1
        }
        
        static func == (lhs: TempWordRef, rhs: TempWordRef) -> Bool {
            //return lhs.nodeId == rhs.nodeId && lhs.position == rhs.position
            return lhs.nodeId == rhs.nodeId
        }
    }
    
    //let wordsLookAhead = 0
    
    /**
    * This method searches for all verses that contain all of the words entered.
    * It does not consider the position of the words, but it keeps track of each occurrance.
    */
    func search1(bible: Bible, words: [String]) -> [WordRef] {
        var result = [WordRef]()
        let measure = Measurement()
        if words.count == 0 {
            return result
        }
        let refLists: [[WordRef]] = BibleDB.shared.selectRefList3(bible: bible, words: words)
        if refLists.count != words.count {
            return result
        }
        measure.duration(location: "database select complete")
        // Prepare second to nth word
        var mapList = [[WordRef: [UInt8]]]()
        for index in 1..<refLists.count {
            var map = [WordRef: [UInt8]]()
            for wordRef in refLists[index] {
                map[wordRef] = wordRef.positions
            }
            mapList.append(map)
        }
        measure.duration(location: "build hashtables")
        let firstList = refLists[0]
        for index in 0..<firstList.count {
            var wordRef: WordRef = firstList[index]
            let wordPos = presentInAllSets(mapList: mapList, wordRef: wordRef)
            if wordPos != nil {
                wordRef.wordPositions = wordPos
                result.append(wordRef)
            }
        }
        measure.final(location: "search1")
        return result
    }
    
    private func presentInAllSets(mapList: [[WordRef: [UInt8]]], wordRef: WordRef) -> WordPositions? {
        var result = WordPositions(numWords: (mapList.count + 1))
        result.addWord(word: 0, positions: wordRef.positions)
        for index in 0..<mapList.count {
            let map = mapList[index]
            let found: [UInt8]? = map[wordRef]
            if found != nil {
                result.addWord(word: (index + 1), positions: found!)
            } else {
                return nil
            }
        }
        return result
    }

    /**
    * This method searches for all of the words entered, but only returns references
    * where they are entered in the consequtive order of the search parameters.
    * This search method should be used for chinese
    */
/*
    func search2(bible: Bible, words: [String]) -> [WordRef: WordPositions] {
        var finalResult = [WordRef: WordPositions]()
        let results1 = self.search1(bible: bible, words: words)
        if results1.count == 0 {
            return finalResult
        }
        for (wordRef, positions) in results1 {
            let updatedPostions = self.matchToEachReference(wordPositions: positions)
            if updatedPostions.positions[0].count > 0 {
                finalResult[wordRef] = updatedPostions
            }
        }
        return finalResult
    }
*/
    private func matchToEachReference(wordPositions: WordPositions) -> WordPositions {
        var updatedPositions = WordPositions(numWords: wordPositions.numWords)
        let firstWordPositions: [UInt8] = wordPositions.positions[0]
        for index in 0..<firstWordPositions.count {
            let matches: [UInt8]? = self.matchToEachWord(wordPositions: wordPositions, index: index)
            if matches != nil {
                updatedPositions.addReference(positions: matches!)
            }
        }
        return updatedPositions
    }
    
    private func matchToEachWord(wordPositions: WordPositions, index: Int) -> [UInt8]? {
        var updatedPositions: [UInt8] = Array(repeating: 0, count: wordPositions.numWords)
        var nextPosition: UInt8 = wordPositions.positions[0][index]
        updatedPositions[0] = nextPosition
        for wordIndex in 1..<wordPositions.numWords {
            let oneWordPositions: [UInt8] = wordPositions.positions[wordIndex]
            nextPosition += 1
            if !oneWordPositions.contains(nextPosition) {
                return nil
            }
            updatedPositions[wordIndex] = nextPosition
        }
        return updatedPositions
    }

    /**
     * This method searches for all verses that contain all of the words entered.
     * It also ensures that the words are in the sequence entered in the search.
     */
    func search3(bible: Bible, words: [String]) -> [TempWordRef] {
        let measure = Measurement()
        if words.count == 0 {
            return [TempWordRef]()
        }
        let refLists2: [[String]] = BibleDB.shared.selectRefList2(bible: bible, words: words)
        measure.duration(location: "database select")
        if refLists2.count != words.count {
            return [TempWordRef]()
        }
        var refLists = [[TempWordRef]]()
        for list in refLists2 {
            refLists.append(list.map { TempWordRef(reference: $0) })
        }
        measure.duration(location: "remove position")
        let setList: [Set<TempWordRef>] = refLists.map { Set($0) }
        measure.duration(location: "make sets")
        
        var result = [TempWordRef]()
        let shortList = self.findShortest(refLists: refLists)
        measure.duration(location: "find shortest")
        for reference in shortList {
            if presentInAllSets(setList: setList, reference: reference) {
                result.append(reference)
            }
        }
        measure.final(location: "search3")
        return result
    }
    private func findShortest(refLists: [[TempWordRef]]) -> [TempWordRef] {
        var count = 100000
        var best = 0
        for index in 0..<refLists.count {
            if refLists[index].count < count {
                count = refLists[index].count
                best = index
            }
        }
        return refLists[best]
    }
    private func presentInAllSets(setList: [Set<TempWordRef>], reference: TempWordRef) -> Bool {
        for set in setList {
            if !set.contains(reference) {
                return false
            }
        }
        return true
    }
}


