//
//  ProgressCircle.swift
//  AWS
//
//  Created by Gary Griswold on 4/7/18.
//  Copyright © 2018 ShortSands. All rights reserved.
//

import Foundation

public class ProgressCircle : UIView {

    let circleBackLayer = CAShapeLayer()
    let circlePathLayer = CAShapeLayer()
    let circleRadius: CGFloat = 50.0

    override init(frame: CGRect) {
        super.init(frame: frame)
        configure()
    }

    public required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        configure()
    }

    func configure() {
        progress = 0.0
        backgroundColor = UIColor.clear
        
        circleBackLayer.frame = bounds
        circleBackLayer.lineWidth = 6
        circleBackLayer.fillColor = UIColor.clear.cgColor
        circleBackLayer.strokeColor = UIColor(white: 0.2, alpha: 0.2).cgColor
        circleBackLayer.strokeStart = 0
        circleBackLayer.strokeEnd = 1
        layer.addSublayer(circleBackLayer)
        
        circlePathLayer.frame = bounds
        circlePathLayer.lineWidth = 6
        circlePathLayer.fillColor = UIColor.clear.cgColor
        circlePathLayer.strokeColor = UIColor.red.cgColor
        circlePathLayer.strokeStart = 0
        circlePathLayer.strokeEnd = 0
        layer.addSublayer(circlePathLayer)
    }
    
    func addToParentAndCenter(view: UIView) {
        view.addSubview(self)
        view.addConstraints(NSLayoutConstraint.constraints(
            withVisualFormat: "V:|[v]|", options: .init(rawValue: 0),
            metrics: nil, views: ["v": self]))
        view.addConstraints(NSLayoutConstraint.constraints(
            withVisualFormat: "H:|[v]|", options: .init(rawValue: 0),
            metrics: nil, views:  ["v": self]))
        self.translatesAutoresizingMaskIntoConstraints = false
    }
    
    var progress: CGFloat {
        get {
            return circlePathLayer.strokeEnd
        }
        set {
            if newValue > 1 {
                circlePathLayer.strokeEnd = 1
            } else if newValue < 0 {
                circlePathLayer.strokeEnd = 0
            } else {
                circlePathLayer.strokeEnd = newValue
            }
        }
    }
    
    func remove() {
        UIView.animate(withDuration: 0.7, delay: 0.3,
                       options: UIViewAnimationOptions.curveLinear,
                       animations: { self.layer.opacity = 0 },
                       completion: { (finished) in self.removeFromSuperview() }
        )
    }
    
    func circleFrame() -> CGRect {
        var circleFrame = CGRect(x: 0, y: 0, width: 2 * circleRadius, height: 2 * circleRadius)
        let circlePathBounds = circlePathLayer.bounds
        circleFrame.origin.x = circlePathBounds.midX - circleFrame.midX
        circleFrame.origin.y = circlePathBounds.midY - circleFrame.midY
        return circleFrame
    }
    
    func circlePath() -> UIBezierPath {
        return UIBezierPath(ovalIn: circleFrame())
    }
    
    public override func layoutSubviews() {
        super.layoutSubviews()
        circleBackLayer.frame = bounds
        circleBackLayer.path = circlePath().cgPath
        circlePathLayer.frame = bounds
        circlePathLayer.path = circlePath().cgPath
    }
}
