//
//  BibleInitialSelect.swift
//  Settings
//
//  Created by Gary Griswold on 8/15/18.
//  Copyright © 2018 ShortSands. All rights reserved.
//
// This class is used when the user first starts an App, and has not yet specified any preferences
// of Bible Versions.  This class is uses to sort iso3 languges in the order that might be most
// relevant to them, and then to sort the Bibles into the best sequence.
//
// It is intended that the selected Bibles are returned first in the order of the selected languages
// and second within the score for the specific language
//

import Utility

struct BibleInitialSelect {
    
    class LanguageScore : Equatable {
        let iso3: String
        let country: String?
        let score: Float
        
        init(iso3: String, country: String?, score: Float) {
            self.iso3 = iso3
            self.country = country
            self.score = score
        }
        
        static func == (lhs: LanguageScore, rhs: LanguageScore) -> Bool {
            return lhs.iso3 == rhs.iso3
        }
    }
    
    class BibleScore : Equatable {
        let bibleId: String     // FCBH 6 to 8 char code
        let abbr: String        // Version Abbreviation
        let iso3: String        // SIL 3 char SIL language code
        let name: String        // Name in the language, but sometimes in English
        let script: String?     // Optional script code of the Bible
        let country: String?    // Optional country code of the Bible
        var score: Float
        
        init(bibleId: String, abbr: String, iso3: String, name: String, script: String?, country: String?, score: Float) {
            self.bibleId = bibleId
            self.abbr = abbr
            self.iso3 = iso3
            self.name = name
            self.script = script
            self.country = country
            self.score = score
        }
        
        static func == (lhs: BibleScore, rhs: BibleScore) -> Bool {
            return lhs.bibleId == rhs.bibleId
        }
    }
    
    private var adapter: SettingsAdapter
    
    init(adapter: SettingsAdapter) {
        self.adapter = adapter
    }
    
    func getBiblesSelected(locales: [Locale]) -> [Bible] {
        var selected = [Bible]()
        for locale in locales {
            let langs = self.getInitialLanguageDetail(locale: locale)
            let langsSorted = langs.sorted{ $0.score > $1.score }
            var bibles = self.getBiblesSelected(locale: locale, languages: langsSorted)
            self.scoreBibles(locale: locale, bibles: &bibles)
            var biblesSorted = bibles.sorted{ $0.score > $1.score }
            while biblesSorted.count > 3 {
                _ = biblesSorted.popLast()
            }
            for bb in biblesSorted {
                let bible = Bible(bibleId: bb.bibleId, abbr: bb.abbr, iso3: bb.iso3, name: bb.name)
                if !selected.contains(bible) {
                    selected.append(bible)
                }
            }
        }
        return selected
    }

    /**
    * Retrieve all iso3 languages for a locale and sort those languages by a score that is
    * based upon population and country match with the locale
    */
    private func getInitialLanguageDetail(locale: Locale) -> [LanguageScore] {
        var details = [LanguageScore]()
        var sql: String
        if locale.languageCode?.count == 2 {
            sql = "SELECT iso3, country, pop FROM Language WHERE iso1 = ?"
        } else {
            sql = "SELECT iso3, country, pop FROM Language WHERE iso3 = ?"
        }
        do {
            let db = try self.adapter.getVersionsDB()
            let resultSet = try db.queryV1(sql: sql, values: [locale.languageCode])
            for row in resultSet {
                let country = row[1]
                var score: Float = (row[2] != nil) ? Float(row[2]!)! : 0.1 // set score to pop, default is 0.1
                if country != nil && locale.regionCode == country {
                    score *= 10.0
                } else if country == "*" {
                    score *= 5.0
                }
                let lang = LanguageScore(iso3: row[0]!, country: country, score: score)
                details.append(lang)
            }
            return details
        } catch let err {
            print("ERROR: SettingsAdapter.updateSettings \(err)")
        }
        return []
    }
    
    /**
     * Using a sorted list of languages, retrieve the Bibles that match.
     */
    private func getBiblesSelected(locale: Locale, languages: [LanguageScore]) -> [BibleScore] {
        var langScore = [String: Float]()
        for lang in languages {
            langScore[lang.iso3] = lang.score
        }
        let sql =  "SELECT bibleId, abbr, iso3, name, script, country FROM Bible WHERE iso3" +
            self.adapter.genQuest(array: languages)

        var bibles = [BibleScore]()
        let iso3s = languages.map { $0.iso3 }
        do {
            let db: Sqlite3 = try self.adapter.getVersionsDB()
            let resultSet: [[String?]] = try db.queryV1(sql: sql, values: iso3s)
            for row in resultSet {
                let iso3 = row[2]!
                let score = (langScore[iso3] != nil) ? langScore[iso3]! : 0.10
                bibles.append(BibleScore(bibleId: row[0]!, abbr: row[1]!, iso3: iso3, name: row[3]!,
                                         script: row[4], country: row[5], score: score))
            }
        } catch let err {
            print("ERROR: BibleInitSelect.getBiblesSelected \(err)")
        }
        return bibles
    }

    private func scoreBibles(locale: Locale, bibles: inout [BibleScore]) {
        switch locale.languageCode {
        case "en":
            for i in 0..<bibles.count {
                switch bibles[i].abbr {
                case "ESV":
                    bibles[i].score *= 7.0
                case "NIV":
                    bibles[i].score *= 6.0
                case "NKJV":
                    bibles[i].score *= 5.0
                default:
                    bibles[i].score *= 1.0
                }
            }
        default:
            print("")
        }
        if let script = locale.scriptCode {
            for i in 0..<bibles.count {
                if bibles[i].script == script {
                    bibles[i].score *= 20
                }
            }
        }
        if let country = locale.regionCode {
            if locale.languageCode == "es" {
                for i in 0..<bibles.count {
                    if bibles[i].country == "es" && country == "es" {
                        bibles[i].score *= 10
                    } else if bibles[i].country != "es" && country != "es" {
                        bibles[i].score *= 10 // Assume that user and Bible is in America
                    }
                }
            } else {
                for i in 0..<bibles.count {
                    if bibles[i].country == country {
                        bibles[i].score *= 10
                    }
                }
            }
        }
    }
}