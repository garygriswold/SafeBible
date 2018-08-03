//
//  VersionDetailViewController.swift
//  StaticCellsSwift
//
//  Created by Gary Griswold on 8/3/18.
//  Copyright © 2018 Short Sands, LLC. All rights reserved.
//

import Foundation
import UIKit

class VersionDetailViewController : UIViewController {
    
    let version: Version
    var textView: UITextView!
    
    init(version: Version) {
        self.version = version
        self.textView = UITextView(frame: .zero)
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) {
        self.version = Version(versionCode: "", languageCode: "", versionName: "", englishName: "",
                               organizationId: "", organizationName: "", copyright: "")
        self.textView = UITextView(frame: .zero)
        super.init(coder: coder)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.view.backgroundColor = UIColor.white
        
        // set Top Bar items
        self.navigationItem.title = version.versionName
        
        self.textView = UITextView(frame: UIScreen.main.bounds)
        let inset = self.textView.frame.width * 0.05
        self.textView.textContainerInset = UIEdgeInsets(top: inset, left: inset, bottom: inset, right: inset)
        self.textView.text = "Hello World"
        self.textView.isEditable = false
        self.textView.isSelectable = true
        //self.textView.allowsEditingTextAttributes = true
        self.textView.font = AppFont.serif(style: .body)
        self.view.addSubview(self.textView)
        
        let notify = NotificationCenter.default
        notify.addObserver(self, selector: #selector(preferredContentSizeChanged(note:)),
                           name: NSNotification.Name.UIContentSizeCategoryDidChange, object: nil)
        
        self.textView.becomeFirstResponder()
    }
    
    @objc func preferredContentSizeChanged(note: NSNotification) {
        self.textView.font = AppFont.sansSerif(style: .body)
    }
}
