//
//  SettingsViewDelegate.swift
//  StaticCellsSwift
//
//  Created by Gary Griswold on 7/24/18.
//  Copyright © 2018 Short Sands, LLC All rights reserved.
//

import Foundation
import UIKit
import StoreKit

class SettingsViewDelegate : NSObject, UITableViewDelegate {
    
    let controller: SettingsViewController
    let dataModel: SettingsModelInterface
    let settingsViewType: SettingsViewType
    let selectedSection: Int
    let availableSection: Int
    
    init(controller: SettingsViewController, selectionViewSection: Int) {
        self.controller = controller
        self.dataModel = controller.dataModel
        self.settingsViewType = controller.settingsViewType
        self.selectedSection = selectionViewSection
        self.availableSection = selectionViewSection + 1
        super.init()
    }
    
    deinit {
        print("****** Deinit SettingsViewDelegate ******")
    }
    
    //func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
    //    return UITableViewAutomaticDimension
    //}
    
    //func tableView(_ tableView: UITableView, estimatedHeightForRowAt indexPath: IndexPath) -> CGFloat {}
    
    // Define edit actions for a row swipe
    //func tableView(_ tableView: UITableView, editActionsForRowAt indexPath: IndexPath) -> [UITableViewRowAction]? {}
 
    // Does the same as didSelectRow at, not sure why I could not call it directly.
    func tableView(_ tableView: UITableView, accessoryButtonTappedForRowWith indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        switch self.settingsViewType {
        case .primary:
            primaryViewRowSelect(tableView: tableView, indexPath: indexPath)
        case .version:
            versionViewRowSelect(tableView: tableView, indexPath: indexPath)
        case .language:
            languageViewRowSelect(tableView: tableView, indexPath: indexPath)
        }
    }

    // Handle row selection.
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        switch self.settingsViewType {
        case .primary:
            primaryViewRowSelect(tableView: tableView, indexPath: indexPath)
        case .version:
            versionViewRowSelect(tableView: tableView, indexPath: indexPath)
        case .language:
            languageViewRowSelect(tableView: tableView, indexPath: indexPath)
        }
    }
    
    private func primaryViewRowSelect(tableView: UITableView, indexPath: IndexPath) {
        switch indexPath.section {
        case 0:
            switch indexPath.row {
            case 0:
                let version = Float(UIDevice.current.systemVersion) ?? 0.0
                if version >= 10.3 {
                    SKStoreReviewController.requestReview()
                }
            case 1:
                let feedbackController = FeedbackViewController()
                self.controller.navigationController?.pushViewController(feedbackController, animated: true)
            default:
                print("Unknown row \(indexPath.row) in section 0")
            }
        case 1:
            print("section 1 is not selectable")
        case 2:
            let languageController = SettingsViewController(settingsViewType: .language)
            self.controller.navigationController?.pushViewController(languageController, animated: true)
        default:
            versionViewRowSelect(tableView: tableView, indexPath: indexPath)
        }
    }
    
    private func versionViewRowSelect(tableView: UITableView, indexPath: IndexPath) {
        switch indexPath.section {
        case self.selectedSection:
            if let version = self.dataModel.getSelectedVersion(row: indexPath.row) {
                let detailController = VersionDetailViewController(version: version)
                self.controller.navigationController?.pushViewController(detailController, animated: true)
            }
        case self.availableSection:
            if let version = self.dataModel.getAvailableVersion(row: indexPath.row) {
                let detailController = VersionDetailViewController(version: version)
                self.controller.navigationController?.pushViewController(detailController, animated: true)
            }
        default:
            print("Unknown section \(indexPath.row)")
        }
    }
    
    private func languageViewRowSelect(tableView: UITableView, indexPath: IndexPath) {
        switch indexPath.section {
        case self.selectedSection:
            print("Selected \(indexPath.row) clicked")
            let language = self.dataModel.getSelectedLanguage(row: indexPath.row)
            let versionController = SettingsViewController(settingsViewType: .version)
            self.controller.navigationController?.pushViewController(versionController, animated: true)
        case self.availableSection:
            let language = self.dataModel.getAvailableLanguage(row: indexPath.row)
            let versionController = SettingsViewController(settingsViewType: .version)
            self.controller.navigationController?.pushViewController(versionController, animated: true)
        default:
            print("Unknown section \(indexPath.row)")
        }
    }

    // This is required for heightForHeaderInSection to work
    //func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
    //    return nil
    //}
    
    // This is required for heightForFooterInSection to work
    //func tableView(_ tableView: UITableView, viewForFooterInSection section: Int) -> UIView? {
    //    return nil
    //}
 
    //func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
    //    return (section == 0) ? 0.0 : -1.0
    //}
    
    //func tableView(_ tableView: UITableView, heightForFooterInSection section: Int) -> CGFloat {
    //    return (section == self.searchSection) ? 0.0 : -1.0
    //}

    // Called when swipe is used to begin editing
    //func tableView(_ tableView: UITableView, willBeginEditingRowAt indexPath: IndexPath)
    
    // Called when editing is ended that was initiated by swipe
    //func tableView(_ tableView: UITableView, didEndEditingRowAt indexPath: IndexPath?)
    
    // Identifies Add and Delete Rows
    func tableView(_ tableView: UITableView, editingStyleForRowAt: IndexPath) -> UITableViewCellEditingStyle {
        switch editingStyleForRowAt.section {
        case self.selectedSection: return UITableViewCellEditingStyle.delete
        case self.availableSection: return UITableViewCellEditingStyle.insert
        default: return UITableViewCellEditingStyle.none
        }
    }
    
    //func tableView(_ tableView: UITableView, titleForDeleteConfirmationButtonForRowAt indexPath: IndexPath) -> String? {
    //    return (indexPath.section == 3) ? "Remove" : nil
    //}
    
    // Keeps non-editable rows from indenting
    func tableView(_ tableView: UITableView, shouldIndentWhileEditingRowAt: IndexPath) -> Bool {
        switch shouldIndentWhileEditingRowAt.section {
        case self.selectedSection: return true
        case self.availableSection: return true
        default: return false
        }
    }
    
    // Limit the movement of rows
    func tableView(_ tableView: UITableView, targetIndexPathForMoveFromRowAt sourceIndexPath: IndexPath,
                   toProposedIndexPath proposedDestinationIndexPath: IndexPath) -> IndexPath {
        let curSection = sourceIndexPath.section
        let newSection = proposedDestinationIndexPath.section
        if newSection == curSection {
            return proposedDestinationIndexPath
        } else if newSection < curSection {
            return IndexPath(item: 0, section: curSection)
        } else {
            // It would be better if I could make this the last row in a section, but I don't know what this is.
            return sourceIndexPath
        }
    }
    
    // Called when a cell is removed from the view
    //func tableView(_ tableView: UITableView, didEndDisplaying cell: UITableViewCell, forRowAt indexPath: IndexPath)
    
    //func tableView(_ tableView: UITableView,
    //               leadingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration?
    
    //func tableView(_ tableView: UITableView,
    //               trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration?
}

