//
//  AppFont.swift
//  Settings
//
//  Created by Gary Griswold on 8/1/18.
//  Copyright © 2018 Short Sands, LLC. All rights reserved.
//

import UIKit

public class AppFont {

    public static var serifFont: UIFont?
    private static var _userFontDelta: CGFloat?
    private static var _bodyLineHeight: Float?
    
    public static var userFontDelta: CGFloat {
        get {
            if _userFontDelta == nil {
                let adapter = SettingsAdapter()
                _userFontDelta = adapter.getUserFontDelta()
            }
            return _userFontDelta!
        }
        set(newValue) {
            _userFontDelta = newValue
            let adapter = SettingsAdapter()
            adapter.setUserFontDelta(fontDelta: newValue)
        }
    }
    
    public static var bodyLineHeight: Float {
        get {
            if _bodyLineHeight == nil {
                _bodyLineHeight = SettingsDB.shared.getFloat(name: "body-line-height", ifNone: 1.8)
            }
            return _bodyLineHeight!
        }
        set(newValue) {
            _bodyLineHeight = newValue
            SettingsDB.shared.updateFloat(name: "body-line-height", setting: newValue)
        }
    }

    public static func sansSerif(style: UIFont.TextStyle) -> UIFont {
        let font = UIFont.preferredFont(forTextStyle: style)
        return font.withSize(font.pointSize * userFontDelta)
    }
    
    public static func sansSerif(ofSize: CGFloat) -> UIFont {
        return UIFont.systemFont(ofSize: ofSize * userFontDelta)
    }
    
    public static func sansSerif(ofSize: CGFloat, weight: UIFont.Weight) -> UIFont {
        return UIFont.systemFont(ofSize: ofSize * userFontDelta, weight: weight)
    }
    
    public static func boldSansSerif(ofSize: CGFloat) -> UIFont {
        return UIFont.boldSystemFont(ofSize: ofSize * userFontDelta)
    }
    
    public static func italicSansSerif(ofSize: CGFloat) -> UIFont {
        return UIFont.italicSystemFont(ofSize: ofSize * userFontDelta)
    }
    
    public static func monospaced(ofSize: CGFloat, weight: UIFont.Weight) -> UIFont {
        return UIFont.monospacedDigitSystemFont(ofSize: ofSize * userFontDelta, weight: weight)
    }
    
    public static func serif(style: UIFont.TextStyle) -> UIFont {
        let font = UIFont.preferredFont(forTextStyle: style)
        return getSerifFont().withSize(font.pointSize * userFontDelta)
    }
    
    public static func serif(ofSize: CGFloat) -> UIFont {
        return getSerifFont().withSize(ofSize * userFontDelta)
    }
    
    public static func serif(ofActualSize: CGFloat) -> UIFont {
        return getSerifFont().withSize(ofActualSize)
    }
    
    public static func serif(ofRelativeSize: CGFloat) -> UIFont {
        let font = UIFont.preferredFont(forTextStyle: .body)
        return getSerifFont().withSize(font.pointSize * ofRelativeSize)
    }
    
    // This does not appear to work. It must be that NavigationBar is overridding this setting.
    public static func updateSearchFontSize() {
        UITextField.appearance(whenContainedInInstancesOf: [UISearchBar.self]).font = AppFont.sansSerif(style: .body)
    }
    
    private static func getSerifFont() -> UIFont {
        if serifFont == nil {
            serifFont = UIFont(name: "Cambria", size: 16.0)
            if serifFont == nil {
                serifFont = UIFont(name: "Times", size: 16.0)
                if serifFont == nil {
                    serifFont = UIFont(name: "Cochin", size: 16.0)
                    if serifFont == nil {
                        serifFont = UIFont.systemFont(ofSize: 16.0)
                    }
                }
            }
        }
        return serifFont!
    }
}
