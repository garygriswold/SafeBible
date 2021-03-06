//
//  ReaderViewQueue.swift
//  Settings
//
//  Created by Gary Griswold on 11/9/18.
//  Copyright © 2018 ShortSands. All rights reserved.
//
import UIKit

class ReaderViewQueue {
    
    static let shared = ReaderViewQueue()
    
    private enum PreviousCall {
        case first
        case next
        case prior
        case preload
    }
    
    private static let QUEUE_MAX: Int = 10
    private static let EXTRA_NEXT: Int = 1
    private static let EXTRA_PRIOR: Int = 1
    
    private var queue: [ReaderViewController]
    private var unused: Set<ReaderViewController>
    private var previousCall: PreviousCall
    
    private init() {
        self.queue = [ReaderViewController]()
        self.unused = Set<ReaderViewController>()
        self.previousCall = .first
    }
    
    func first(reference: Reference) -> ReaderViewController {
        self.previousCall = .first
        for controller in self.queue {
            self.addUnused(controller: controller)
        }
        self.queue.removeAll()
        let controller = self.getUnused(reference: reference)
        self.queue.append(controller)
        return controller
    }
    
    /**
    * The ReaderViewController is one that is already in the queue.
    * So, it is guarantteed to be found within the list.
    */
    func next(controller: UIViewController) -> ReaderViewController? {
        self.previousCall = .next
        if let index = self.findController(controller: controller) {
            if index < (queue.count - 1) {
                return self.queue[index + 1]
            } else {
                return appendAfter()
            }
        } else {
            return nil
        }
    }
    
    func prior(controller: UIViewController) -> ReaderViewController? {
        self.previousCall = .prior
        if let index = self.findController(controller: controller) {
            if index > 0 {
                return self.queue[index - 1]
            } else {
                return insertBefore()
            }
        } else {
            return nil
        }
    }
    
    /**
    * UIPageViewController is usually calling next and prior to preload the next and prior pages,
    * but never for the initial set, and only most of the time when the page is swiped.
    * This method is called after any page is loaded to add one additional pages before and or after
    */
    func preload() {
        switch self.previousCall {
        case .first:
            _ = self.appendAfter()
            _ = self.insertBefore()
        case .next:
            _ = self.appendAfter()
        case .prior:
            _ = self.insertBefore()
        case .preload:
            _ = 1 // do nothing
        }
        self.previousCall = .preload
    }
    
    func updateCSS(css: String) {
        print("update Rule in ReaderViewQueue: \(css)")
        for webView in self.queue {
            webView.execJavascript(message: css)
        }
    }
    
    func reloadIfActive(reference: Reference) {
        for reader in self.queue {
            if reader.reference == reference {
                reader.reloadReference()
                return
            }
        }
    }
    
    private func appendAfter() -> ReaderViewController {
        let reference = self.queue.last!.reference!
        let controller = self.getUnused(reference: reference.nextChapter())
        self.queue.append(controller)
        
        if self.queue.count > ReaderViewQueue.QUEUE_MAX {
            let first = self.queue.removeFirst()
            self.addUnused(controller: first)
        }
        return controller
    }
    
    private func insertBefore() -> ReaderViewController {
        let reference = self.queue[0].reference!
        let controller = self.getUnused(reference: reference.priorChapter())
        self.queue.insert(controller, at: 0)
        
        if self.queue.count > ReaderViewQueue.QUEUE_MAX {
            let last = self.queue.removeLast()
            self.addUnused(controller: last)
        }
        return controller
    }
    
    private func getUnused(reference: Reference) -> ReaderViewController {
        var webView = self.unused.popFirst()
        if webView == nil {
            webView = ReaderViewController()
        }
        webView!.clearWebView() // Needed to clear old content off page, 0.4 ms to 0.0ms
        webView!.loadReference(reference: reference) // The page is loaded when this is called
        return webView!
    }
    
    private func addUnused(controller: ReaderViewController) {
        controller.view.removeFromSuperview()
        self.unused.insert(controller)
    }
    
    private func findController(controller: UIViewController) -> Int? {
        guard let readController = controller as? ReaderViewController
            else { fatalError("ReaderViewQueue.findController must receive ReaderViewController") }
        let reference = readController.reference!
        for index in 0..<self.queue.count {
            if self.queue[index].reference == reference {
                return index
            }
        }
        return nil
    }
}
