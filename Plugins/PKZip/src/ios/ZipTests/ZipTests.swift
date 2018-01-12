//
//  ZipTests.swift
//  ZipTests
//
//  Created by Roy Marmelstein on 13/12/2015.
//  Copyright © 2015 Roy Marmelstein. All rights reserved.
//

import XCTest
@testable import PKZip

class ZipTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
    }
    
    override func tearDown() {
        super.tearDown()
    }
    
    func testQuickUnzip() {
        do {
            let filePath = Bundle(for: ZipTests.self).url(forResource: "bb8", withExtension: "zip")!
            let destinationURL = try PKZipper.quickUnzipFile(filePath)
            let fileManager = FileManager.default
            XCTAssertTrue(fileManager.fileExists(atPath: destinationURL.path))
        }
        catch {
            XCTFail()
        }
    }
    
    func testQuickUnzipNonExistingPath() {
        do {
            let filePathURL = Bundle(for: ZipTests.self).resourcePath
            let filePath = NSURL(string:"\(filePathURL!)/bb9.zip")
            let destinationURL = try PKZipper.quickUnzipFile(filePath! as URL)
            let fileManager = FileManager.default
            XCTAssertFalse(fileManager.fileExists(atPath:destinationURL.path))
        }
        catch {
            XCTAssert(true)
        }
    }
    
    func testQuickUnzipNonZipPath() {
        do {
            let filePath = Bundle(for: ZipTests.self).url(forResource: "3crBXeO", withExtension: "gif")!
            let destinationURL = try PKZipper.quickUnzipFile(filePath)
            let fileManager = FileManager.default
            XCTAssertFalse(fileManager.fileExists(atPath:destinationURL.path))
        }
        catch {
            XCTAssert(true)
        }
    }
    
    func testQuickUnzipProgress() {
        do {
            let filePath = Bundle(for: ZipTests.self).url(forResource: "bb8", withExtension: "zip")!
            _ = try PKZipper.quickUnzipFile(filePath, progress: { (progress) -> () in
                XCTAssert(true)
            })
        }
        catch {
            XCTFail()
        }
    }
    
    func testQuickUnzipOnlineURL() {
        do {
            let filePath = NSURL(string: "http://www.google.com/google.zip")!
            let destinationURL = try PKZipper.quickUnzipFile(filePath as URL)
            let fileManager = FileManager.default
            XCTAssertFalse(fileManager.fileExists(atPath:destinationURL.path))
        }
        catch {
            XCTAssert(true)
        }
    }
    
    func testUnzip() {
        do {
            let filePath = Bundle(for: ZipTests.self).url(forResource: "bb8", withExtension: "zip")!
            let documentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] as NSURL
            
            try PKZipper.unzipFile(filePath, destination: documentsFolder as URL, overwrite: true, password: "password", progress: { (progress) -> () in
                print(progress)
            })
            
            let fileManager = FileManager.default
            XCTAssertTrue(fileManager.fileExists(atPath:documentsFolder.path!))
        }
        catch {
            XCTFail()
        }
    }
    
    func testImplicitProgressUnzip() {
        do {
            let progress = Progress()
            progress.totalUnitCount = 1
            
            let filePath = Bundle(for: ZipTests.self).url(forResource: "bb8", withExtension: "zip")!
            let documentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] as NSURL
            
            progress.becomeCurrent(withPendingUnitCount: 1)
            try PKZipper.unzipFile(filePath, destination: documentsFolder as URL, overwrite: true, password: "password", progress: nil)
            progress.resignCurrent()
            
            XCTAssertTrue(progress.totalUnitCount == progress.completedUnitCount)
        }
        catch {
            XCTFail()
        }
        
    }
    
    func testImplicitProgressZip() {
        do {
            let progress = Progress()
            progress.totalUnitCount = 1
            
            let imageURL1 = Bundle(for: ZipTests.self).url(forResource: "3crBXeO", withExtension: "gif")!
            let imageURL2 = Bundle(for: ZipTests.self).url(forResource: "kYkLkPf", withExtension: "gif")!
            let documentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] as NSURL
            let zipFilePath = documentsFolder.appendingPathComponent("archive.zip")
            
            progress.becomeCurrent(withPendingUnitCount: 1)
            try PKZipper.zipFiles(paths: [imageURL1, imageURL2], zipFilePath: zipFilePath!, password: nil, progress: nil)
            progress.resignCurrent()
            
            XCTAssertTrue(progress.totalUnitCount == progress.completedUnitCount)
        }
        catch {
            XCTFail()
        }
    }
    
    
    func testQuickZip() {
        do {
            let imageURL1 = Bundle(for: ZipTests.self).url(forResource: "3crBXeO", withExtension: "gif")!
            let imageURL2 = Bundle(for: ZipTests.self).url(forResource: "kYkLkPf", withExtension: "gif")!
            let destinationURL = try PKZipper.quickZipFiles([imageURL1, imageURL2], fileName: "archive")
            let fileManager = FileManager.default
            XCTAssertTrue(fileManager.fileExists(atPath:destinationURL.path))
        }
        catch {
            XCTFail()
        }
    }
    
    func testQuickZipFolder() {
        do {
            let fileManager = FileManager.default
            let imageURL1 = Bundle(for: ZipTests.self).url(forResource: "3crBXeO", withExtension: "gif")!
            let imageURL2 = Bundle(for: ZipTests.self).url(forResource: "kYkLkPf", withExtension: "gif")!
            let folderURL = Bundle(for: ZipTests.self).bundleURL.appendingPathComponent("Directory")
            let targetImageURL1 = folderURL.appendingPathComponent("3crBXeO.gif")
            let targetImageURL2 = folderURL.appendingPathComponent("kYkLkPf.gif")
            if fileManager.fileExists(atPath:folderURL.path) {
                try fileManager.removeItem(at: folderURL)
            }
            try fileManager.createDirectory(at: folderURL, withIntermediateDirectories: false, attributes: nil)
            try fileManager.copyItem(at: imageURL1, to: targetImageURL1)
            try fileManager.copyItem(at: imageURL2, to: targetImageURL2)
            let destinationURL = try PKZipper.quickZipFiles([folderURL], fileName: "directory")
            XCTAssertTrue(fileManager.fileExists(atPath:destinationURL.path))
        }
        catch {
            XCTFail()
        }
    }
    
    
    func testZip() {
        do {
            let imageURL1 = Bundle(for: ZipTests.self).url(forResource: "3crBXeO", withExtension: "gif")!
            let imageURL2 = Bundle(for: ZipTests.self).url(forResource: "kYkLkPf", withExtension: "gif")!
            let documentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] as NSURL
            let zipFilePath = documentsFolder.appendingPathComponent("archive.zip")
            try PKZipper.zipFiles(paths: [imageURL1, imageURL2], zipFilePath: zipFilePath!, password: nil, progress: { (progress) -> () in
                print(progress)
            })
            let fileManager = FileManager.default
            XCTAssertTrue(fileManager.fileExists(atPath:(zipFilePath?.path)!))
        }
        catch {
            XCTFail()
        }
    }
    
    func testZipUnzipPassword() {
        do {
            let imageURL1 = Bundle(for: ZipTests.self).url(forResource: "3crBXeO", withExtension: "gif")!
            let imageURL2 = Bundle(for: ZipTests.self).url(forResource: "kYkLkPf", withExtension: "gif")!
            let documentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0] as NSURL
            let zipFilePath = documentsFolder.appendingPathComponent("archive.zip")
            try PKZipper.zipFiles(paths: [imageURL1, imageURL2], zipFilePath: zipFilePath!, password: "password", progress: { (progress) -> () in
                print(progress)
            })
            let fileManager = FileManager.default
            XCTAssertTrue(fileManager.fileExists(atPath:(zipFilePath?.path)!))
            guard let fileExtension = zipFilePath?.pathExtension, let fileName = zipFilePath?.lastPathComponent else {
                throw ZipError.unzipFail
            }
            let directoryName = fileName.replacingOccurrences(of: ".\(fileExtension)", with: "")
            let documentsUrl = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0] as NSURL
            let destinationUrl = documentsUrl.appendingPathComponent(directoryName, isDirectory: true)
            try PKZipper.unzipFile(zipFilePath!, destination: destinationUrl!, overwrite: true, password: "password", progress: nil)
            XCTAssertTrue(fileManager.fileExists(atPath:(destinationUrl?.path)!))
        }
        catch {
            XCTFail()
        }
    }

    func testUnzipWithUnsupportedPermissions() {
        do {
            let permissionsURL = Bundle(for: ZipTests.self).url(forResource: "unsupported_permissions", withExtension: "zip")!
            let unzipDestination = try PKZipper.quickUnzipFile(permissionsURL)
            print(unzipDestination)
            let fileManager = FileManager.default
            let permission644 = unzipDestination.appendingPathComponent("unsupported_permission").appendingPathExtension("txt")
            do {
                let attributes644 = try fileManager.attributesOfItem(atPath: permission644.path)
                XCTAssertEqual(attributes644[.posixPermissions] as? Int, 0o644)
            } catch {
                XCTFail("Failed to get file attributes \(error)")
            }
        } catch {
            XCTFail("Failed extract unsupported_permissions.zip")
        }
    }

    func testUnzipPermissions() {
        do {
            let permissionsURL = Bundle(for: ZipTests.self).url(forResource: "permissions", withExtension: "zip")!
            let unzipDestination = try PKZipper.quickUnzipFile(permissionsURL)
            let fileManager = FileManager.default
            let permission777 = unzipDestination.appendingPathComponent("permission_777").appendingPathExtension("txt")
            let permission600 = unzipDestination.appendingPathComponent("permission_600").appendingPathExtension("txt")
            let permission604 = unzipDestination.appendingPathComponent("permission_604").appendingPathExtension("txt")
            
            do {
                let attributes777 = try fileManager.attributesOfItem(atPath: permission777.path)
                let attributes600 = try fileManager.attributesOfItem(atPath: permission600.path)
                let attributes604 = try fileManager.attributesOfItem(atPath: permission604.path)
                XCTAssertEqual(attributes777[.posixPermissions] as? Int, 0o777)
                XCTAssertEqual(attributes600[.posixPermissions] as? Int, 0o600)
                XCTAssertEqual(attributes604[.posixPermissions] as? Int, 0o604)
            } catch {
                XCTFail("Failed to get file attributes \(error)")
            }
        } catch {
            XCTFail("Failed extract permissions.zip")
        }
    }
    
    func testQuickUnzipSubDir() {
        do {
            let bookURL = Bundle(for: ZipTests.self).url(forResource: "bb8", withExtension: "zip")!
            let unzipDestination = try PKZipper.quickUnzipFile(bookURL)
            let fileManager = FileManager.default
            let subDir = unzipDestination.appendingPathComponent("subDir")
            let imageURL = subDir.appendingPathComponent("r2W9yu9").appendingPathExtension("gif")
            
            XCTAssertTrue(fileManager.fileExists(atPath:unzipDestination.path))
            XCTAssertTrue(fileManager.fileExists(atPath:subDir.path))
            XCTAssertTrue(fileManager.fileExists(atPath:imageURL.path))
        } catch {
            XCTFail()
        }
    }

    func testFileExtensionIsNotInvalidForValidUrl() {
        let fileUrl = NSURL(string: "file.cbz")
        let result = PKZipper.fileExtensionIsInvalid(fileUrl?.pathExtension)
        XCTAssertFalse(result)
    }
    
    func testFileExtensionIsInvalidForInvalidUrl() {
        let fileUrl = NSURL(string: "file.xyz")
        let result = PKZipper.fileExtensionIsInvalid(fileUrl?.pathExtension)
        XCTAssertTrue(result)
    }
    
    func testAddedCustomFileExtensionIsValid() {
        let fileExtension = "cstm"
        PKZipper.addCustomFileExtension(fileExtension)
        let result = PKZipper.isValidFileExtension(fileExtension)
        XCTAssertTrue(result)
        PKZipper.removeCustomFileExtension(fileExtension)
    }
    
    func testRemovedCustomFileExtensionIsInvalid() {
        let fileExtension = "cstm"
        PKZipper.addCustomFileExtension(fileExtension)
        PKZipper.removeCustomFileExtension(fileExtension)
        let result = PKZipper.isValidFileExtension(fileExtension)
        XCTAssertFalse(result)
    }
    
    func testDefaultFileExtensionsIsValid() {
        XCTAssertTrue(PKZipper.isValidFileExtension("zip"))
        XCTAssertTrue(PKZipper.isValidFileExtension("cbz"))
    }
    
    func testDefaultFileExtensionsIsNotRemoved() {
        PKZipper.removeCustomFileExtension("zip")
        PKZipper.removeCustomFileExtension("cbz")
        XCTAssertTrue(PKZipper.isValidFileExtension("zip"))
        XCTAssertTrue(PKZipper.isValidFileExtension("cbz"))
    }
    
}
