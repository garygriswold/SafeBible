//
//  TableContentsViewController.swift
//  Settings
//
//  Created by Gary Griswold on 10/21/18.
//  Copyright © 2018 ShortSands. All rights reserved.
//

import UIKit

class TOCBooksViewController : AppTableViewController, UITableViewDataSource {
    
    static func push(controller: UIViewController?) {
        let tableContents = TOCBooksViewController()
        controller?.navigationController?.pushViewController(tableContents, animated: true)
    }

    private var dataModel: TableContentsModel!
    private var topAnchor: NSLayoutConstraint!
    
    deinit {
        print("**** deinit TOCBooksViewController ******")
    }
    
    override func loadView() {
        super.loadView()
        
        self.navigationItem.title = NSLocalizedString("Books", comment: "Table Contents view page title")
        let history = NSLocalizedString("History", comment: "Button to display History")
        self.navigationItem.rightBarButtonItem = UIBarButtonItem(title: history, style: .plain,
                                                                 target: self,
                                                                 action: #selector(historyHandler))
        self.tableView.layer.borderWidth = 0.4
        self.tableView.layer.borderColor = UIColor(white: 0.8, alpha: 1.0).cgColor

        self.tableView.register(UITableViewCell.self, forCellReuseIdentifier: "otherCell")
        self.tableView.dataSource = self
        
        let margins = view.safeAreaLayoutGuide
        self.topAnchor = self.tableView.topAnchor.constraint(equalTo: margins.topAnchor)
        self.topAnchor.isActive = true
        
        self.createToolbar()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        self.dataModel = HistoryModel.shared.currTableContents
        self.dataModel.clearFilteredBooks()
        self.navigationController?.isToolbarHidden = false
        
        if let index = HistoryModel.shared.current().book?.ordinal {
            let indexPath = IndexPath(item: index, section: 0)
            self.tableView.scrollToRow(at: indexPath, at: .middle, animated: false)
        }
    }
    
    override func viewWillTransition(to size: CGSize,
                                     with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        
        self.dataModel.clearFilteredBooks()
        self.tableView.reloadData()
        self.positionMidView()
    }
    
    @objc func historyHandler(sender: UIBarButtonItem) {
        HistoryViewController.push(controller: self)
    }
    
    private func createToolbar() {
        if let nav = self.navigationController {
            
            nav.toolbar.isTranslucent = false
            nav.toolbar.barTintColor = AppFont.backgroundColor
        }
        var items = [UIBarButtonItem]()
        
        let trad = NSLocalizedString("Traditional", comment: "Bible books in traditional sequence")
        let alpha = NSLocalizedString("Alphabetical", comment: "Bible books in alphabetical sequence")
        let sortControl = UISegmentedControl(items: [trad, alpha])
        sortControl.selectedSegmentIndex = 0
        sortControl.addTarget(self, action: #selector(sortHandler), for: .valueChanged)
        
        let sortCtrl = UIBarButtonItem(customView: sortControl)
        items.append(sortCtrl)
        
        self.setToolbarItems(items, animated: true)
    }
    
    @objc func sortHandler(sender: UISegmentedControl) {
        self.dataModel.clearFilteredBooks()
        let index = sender.selectedSegmentIndex
        if index == 0 {
            self.dataModel.sortBooksTraditional()
        } else {
            self.dataModel.sortBooksAlphabetical()
        }
        self.tableView.reloadData()
        self.positionMidView()
    }
    
    private func positionMidView() {
        var blankSpace: CGFloat = 0.0
        let contentHeight = self.tableView.contentSize.height
        let safeHeight = self.view.safeAreaLayoutGuide.layoutFrame.height
        if contentHeight < safeHeight {
            blankSpace = (safeHeight - contentHeight) / 2.0
        }
        if blankSpace != self.topAnchor.constant {
            self.topAnchor.isActive = false
            self.topAnchor = self.tableView.topAnchor.constraint(
                equalTo: self.view.safeAreaLayoutGuide.topAnchor, constant: blankSpace)
            self.topAnchor.isActive = true
        }
    }

    //
    // Data Source
    //
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.dataModel.filteredBookCount
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        return self.dataModel.generateBookCell(tableView: tableView, indexPath: indexPath)
    }
    
    func sectionIndexTitles(for tableView: UITableView) -> [String]? {
        return self.dataModel.sideIndex
    }
    
    func tableView(_ tableView: UITableView, sectionForSectionIndexTitle title: String,
                   at index: Int) -> Int {
        self.dataModel.filterBooks(letter: title)
        tableView.reloadData()
        self.positionMidView()
        return -1
    }
    //
    // Delegate
    //
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if let book = self.dataModel.getFilteredBook(row: indexPath.row) {
            tableView.deselectRow(at: indexPath, animated: true)
            if book.lastChapter > 1 {
                TOCChaptersViewController.push(book: book, controller: self)
            } else {
                // book.lastChapter can be zero or one.  It is zero for GLO and FRT
                HistoryModel.shared.changeReference(bookId: book.bookId, chapter: book.lastChapter)
                NotificationCenter.default.post(name: ReaderPagesController.NEW_REFERENCE,
                                                object: HistoryModel.shared.current())
                self.navigationController?.popToRootViewController(animated: true)
            }
        }
    }
}
