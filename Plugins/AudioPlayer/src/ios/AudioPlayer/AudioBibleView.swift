//
//  AudioBibleView.swift
//  AudioPlayer
//
//  Created by Gary Griswold on 8/7/17.
//  Copyright © 2017 ShortSands. All rights reserved.
//

import AVFoundation
import UIKit
import WebKit

class AudioBibleView {
    
    private static var instance: AudioBibleView?
    static func shared(view: UIView, audioBible: AudioBible) -> AudioBibleView {
        if (AudioBibleView.instance == nil) {
            AudioBibleView.instance = AudioBibleView(view: view, audioBible: audioBible)
        }
        return AudioBibleView.instance!
    }
    static var webview: WKWebView? {
        get {
            if let singleton = instance {
                return singleton.view as? WKWebView
            } else {
                return nil
            }
        }
    }
    
    private unowned let view: UIView
    private unowned let audioBible: AudioBible
    private let audioPanel: UIView
    private let playButton: UIButton
    private let pauseButton: UIButton
    //private let stopButton: UIButton
    private let scrubSlider: UISlider
    private let verseLabel: CALayer
    private let verseLabelYPos: CGFloat
    private let verseNumLabel: CATextLayer
    private var progressLink: CADisplayLink?
    // Constraints
    //private let panelWidth: NSLayoutConstraint
    private let panelLeft: NSLayoutConstraint
    private let panelRight: NSLayoutConstraint
    private let panelHeight: NSLayoutConstraint
    private let panelBottom: NSLayoutConstraint
    private let playTop: NSLayoutConstraint
    private let pauseTop: NSLayoutConstraint
    private let playCenter: NSLayoutConstraint
    private let pauseCenter: NSLayoutConstraint
    // Precomputed for positionVersePopup
    private let sliderRange: CGFloat
    private let sliderOrigin: CGFloat
    // Transient State Variables
    private var scrubSliderDuration: CMTime
    private var scrubSliderDrag: Bool
    private var scrubSuspendedPlay: Bool
    private var verseNum: Int = 0
    private var isAudioViewActive: Bool = false
    
    private init(view: UIView, audioBible: AudioBible) {
        self.view = view
        self.audioBible = audioBible
        self.scrubSliderDuration = kCMTimeZero
        self.scrubSliderDrag = false
        self.scrubSuspendedPlay = false

        let screenSize = UIScreen.main.bounds
        let screenWidth: CGFloat = screenSize.width
        //let screenHeight: CGFloat = screenSize.height
        
        let panel = UIView()
        let audioPanelWidth: CGFloat = screenWidth * 0.96
        
        //let audioPanelHeight: CGFloat = 110.0
        //panel.frame = CGRect(x: screenWidth * 0.02, y: screenHeight - 120.0,
        //                     width: audioPanelWidth, height: audioPanelHeight)
        panel.layer.cornerRadius = 20
        panel.layer.masksToBounds = true
        self.audioPanel = panel
        
        let panelInsetX = screenSize.width * 0.03
        let panelInsetY = screenSize.width * 0.01
        self.audioPanel.translatesAutoresizingMaskIntoConstraints = false
        self.panelLeft = self.audioPanel.leadingAnchor.constraint(equalTo: self.view.leadingAnchor,
                                                                  constant: panelInsetX)
        self.panelRight = self.audioPanel.trailingAnchor.constraint(equalTo: self.view.trailingAnchor,
                                                                    constant: -panelInsetX)
        self.panelHeight = self.audioPanel.heightAnchor.constraint(equalToConstant: 110.0)
        self.panelBottom = self.audioPanel.bottomAnchor.constraint(equalTo: self.view.bottomAnchor,
                                                                   constant: -panelInsetY)
        if !UIAccessibilityIsReduceTransparencyEnabled() {
            self.audioPanel.backgroundColor = .clear
            
            let blur = UIBlurEffect(style: .light)
            let blurView = UIVisualEffectView(effect: blur)
            
            let vibrancy = UIVibrancyEffect(blurEffect: blur)
            let vibrancyView = UIVisualEffectView(effect: vibrancy)
            vibrancyView.translatesAutoresizingMaskIntoConstraints = false
            
            blurView.contentView.addSubview(vibrancyView)
            //blurView.frame = self.audioPanel.bounds
            blurView.translatesAutoresizingMaskIntoConstraints = false
            
            self.audioPanel.addSubview(blurView)
            blurView.translatesAutoresizingMaskIntoConstraints = false
            blurView.topAnchor.constraint(equalTo: self.audioPanel.topAnchor).isActive = true
            blurView.leadingAnchor.constraint(equalTo: self.audioPanel.leadingAnchor).isActive = true
            blurView.trailingAnchor.constraint(equalTo: self.audioPanel.trailingAnchor).isActive = true
            blurView.bottomAnchor.constraint(equalTo: self.audioPanel.bottomAnchor).isActive = true
        } else {
            self.audioPanel.backgroundColor = .white
        }
        
        let playBtn = UIButton(type: .custom)
        //playBtn.frame = CGRect(x: audioPanelWidth/2-20, y: 65, width: 40, height: 40)
        let playUpImg = UIImage(named: "UIPlayUPButton90.png")
        playBtn.setImage(playUpImg, for: UIControlState.normal)
        let playDnImg = UIImage(named: "UIPlayDNButton90.png")
        playBtn.setImage(playDnImg, for: UIControlState.highlighted)
        self.playButton = playBtn
        self.playButton.isEnabled = false
        
        let pauseBtn = UIButton(type: .custom)
        //pauseBtn.frame = CGRect(x: audioPanelWidth/2-20, y: 65, width: 40, height: 40)
        let pauseUpImg = UIImage(named: "UIPauseUPButton90.png")
        pauseBtn.setImage(pauseUpImg, for: UIControlState.normal)
        let pauseDnImg = UIImage(named: "UIPauseDNButton90.png")
        pauseBtn.setImage(pauseDnImg, for: UIControlState.highlighted)
        self.pauseButton = pauseBtn
        
        //let scrubX = audioPanelWidth * 0.05
        //let scrubWidth = audioPanelWidth * 0.9
        //let scrubRect = CGRect(x: scrubX, y: 40, width: scrubWidth, height: 10)
        //let scrub = UISlider(frame: scrubRect)
        let scrub = UISlider()
        scrub.isContinuous = true
        let thumbUpImg = UIImage(named: "UIThumbUP30.png")
        scrub.setThumbImage(thumbUpImg, for: UIControlState.normal)
        let thumbDnImg = UIImage(named: "UIThumbDN30.png")
        scrub.setThumbImage(thumbDnImg, for: UIControlState.highlighted)
        
        scrub.setValue(0.0, animated: false)
        self.audioPanel.addSubview(scrub)
        self.scrubSlider = scrub
        
        self.scrubSlider.translatesAutoresizingMaskIntoConstraints = false
        self.scrubSlider.topAnchor.constraint(equalTo: self.audioPanel.topAnchor).isActive = true
        self.scrubSlider.leadingAnchor.constraint(equalTo: self.audioPanel.leadingAnchor).isActive = true
        self.scrubSlider.trailingAnchor.constraint(equalTo: self.audioPanel.trailingAnchor).isActive = true
        //self.scrubSlider.widthAnchor.constraint(equalTo: self.audioPanel.widthAnchor)
        
        self.playButton.translatesAutoresizingMaskIntoConstraints = false
        self.playTop = self.playButton.topAnchor.constraint(equalTo: self.scrubSlider.bottomAnchor)
        self.pauseTop = self.pauseButton.topAnchor.constraint(equalTo: self.scrubSlider.bottomAnchor)
        self.playCenter = self.playButton.centerXAnchor.constraint(equalTo: self.audioPanel.centerXAnchor)
        self.pauseCenter = self.pauseButton.centerXAnchor.constraint(equalTo: self.audioPanel.centerXAnchor)
        
        // Precompute Values for positionVersePopup()
        self.sliderRange = scrub.frame.size.width - (scrub.currentThumbImage?.size.width)!
        self.sliderOrigin = scrub.frame.origin.x + ((scrub.currentThumbImage?.size.width)! / 2.0)
        
        self.verseLabelYPos = 20
        let verse = CALayer()
        verse.frame = CGRect(x: audioPanelWidth * 0.05, y: self.verseLabelYPos, width: 32, height: 32)
        verse.backgroundColor = UIColor.white.cgColor
        verse.contentsScale = UIScreen.main.scale
        verse.borderColor = UIColor.lightGray.cgColor
        verse.borderWidth = 1.0
        verse.cornerRadius = verse.frame.width / 2
        verse.masksToBounds = false
        verse.opacity = 0 // Will be set to 1 if data is available
        self.audioPanel.layer.addSublayer(verse)
        self.verseLabel = verse
        
        let verse2 = CATextLayer()
        verse2.frame = CGRect(x: 0, y: 8, width: 32, height: 16)
        verse2.string = "1"
        verse2.font = "HelveticaNeue" as CFString
        verse2.fontSize = 12
        verse2.foregroundColor = UIColor.black.cgColor
        verse2.isWrapped = false
        verse2.alignmentMode = kCAAlignmentCenter
        verse2.contentsGravity = kCAGravityCenter // Why doesn't contentsGravity work
        self.verseLabel.addSublayer(verse2)
        self.verseNumLabel = verse2
/*
        // PositionLabel is for Debug only
        let position = CATextLayer()
        position.frame = CGRect(x: screenWidth * 0.05, y: 180, width: 64, height: 32)
        position.string = "0"
        position.fontSize = 12
        position.foregroundColor = UIColor.black.cgColor
        self.view.layer.addSublayer(position)
        self.positionLabel = position
*/
        // UI control shadows
        playBtn.layer.shadowOpacity = 0.5
        playBtn.layer.shadowOffset = CGSize(width: 2.0, height: 1.0)
        pauseBtn.layer.shadowOpacity = 0.5
        pauseBtn.layer.shadowOffset = CGSize(width: 2.0, height: 1.0)
        //stopBtn.layer.shadowOpacity = 0.5
        //stopBtn.layer.shadowOffset = CGSize(width: 2.0, height: 1.0)
        verse.shadowOpacity = 0.5
        verse.shadowOffset = CGSize(width: 1.0, height: 0.5)
        scrub.layer.shadowOpacity = 0.5
        scrub.layer.shadowOffset = CGSize(width: 2.0, height: 1.0)
        
        self.initNotifications()
        print("***** Init AudioBibleView *****")
    }
    
    deinit {
        print("***** Deinit AudioBibleView *****")
    }
    
    func audioBibleActive() -> Bool {
        return self.isAudioViewActive
    }
    
    func audioReadyToPlay(enabled: Bool) {
        self.playButton.isEnabled = enabled
    }
    
    @objc func play() {
        self.audioBible.play()
        if (self.isAudioViewActive) {
            self.playButton.removeFromSuperview()
            self.audioPanel.addSubview(self.pauseButton)
        }
    }
    
    @objc func pause() {
        self.audioBible.pause()
        if (self.isAudioViewActive) {
            self.pauseButton.removeFromSuperview()
            self.audioPanel.addSubview(self.playButton)
        }
    }
    
    @objc private func stop() {
        self.audioBible.stop()
        self.dismissPlayer()
    }
    
    func presentPlayer() {
        self.isAudioViewActive = true
        self.audioPanel.center.y = self.view.bounds.height + self.audioPanel.bounds.height / 2.0
        let homeBarSafe = self.view.bounds.height * 0.01
        self.view.addSubview(self.audioPanel)
        self.panelLeft.isActive = true
        self.panelRight.isActive = true
        self.panelHeight.isActive = true
        self.panelBottom.isActive = true
        UIView.animate(withDuration: 1.0, delay: 0.0,
                       options: UIViewAnimationOptions.curveEaseOut,
                       animations: { self.audioPanel.center.y -= self.audioPanel.bounds.height + homeBarSafe },
                       completion: nil
        )
        if self.audioBible.isPlaying() {
            self.audioPanel.addSubview(self.pauseButton)
            self.pauseTop.isActive = true
            self.pauseCenter.isActive = true
        } else {
            self.audioPanel.addSubview(self.playButton)
            self.playTop.isActive = true
            self.playCenter.isActive = true
            self.audioReadyToPlay(enabled: false)
        }
        self.progressLink = CADisplayLink(target: self, selector: #selector(updateProgress))
        self.progressLink!.add(to: .current, forMode: .defaultRunLoopMode)
        self.progressLink!.preferredFramesPerSecond = 15
        
        self.playButton.addTarget(self, action: #selector(self.play), for: .touchUpInside)
        self.pauseButton.addTarget(self, action: #selector(self.pause), for: .touchUpInside)
        //self.stopButton.addTarget(self, action: #selector(self.stop), for: .touchUpInside)
        self.scrubSlider.addTarget(self, action: #selector(scrubSliderChanged), for: .valueChanged)
        self.scrubSlider.addTarget(self, action: #selector(touchDown), for: .touchDown)
        self.scrubSlider.addTarget(self, action: #selector(touchUpInside), for: .touchUpInside)
        self.scrubSlider.addTarget(self, action: #selector(touchUpInside), for: .touchUpOutside)
        
        UIApplication.shared.isIdleTimerDisabled = true
    }

    func dismissPlayer() {
        self.isAudioViewActive = false
        UIView.animate(withDuration: 1.0, delay: 0.0,
                       options: UIViewAnimationOptions.curveEaseOut,
                       animations: { self.audioPanel.center.y += self.audioPanel.bounds.height * 1.2 },
                       completion: { _ in
                        //self.panelWidth.isActive = false
                        self.panelLeft.isActive = false
                        self.panelRight.isActive = false
                        self.panelHeight.isActive = false
                        self.panelBottom.isActive = false
                        self.audioPanel.removeFromSuperview() }
        )
        self.progressLink?.invalidate()
        
        UIApplication.shared.isIdleTimerDisabled = false
    }
    
    /**
    * Scrub Slider Animation
    */
    @objc private func updateProgress() {
        if self.scrubSliderDrag { return }
        //print("Update progress \(CFAbsoluteTimeGetCurrent())")
        
        if let item = self.audioBible.getPlayer()?.currentItem {
            if CMTIME_IS_NUMERIC(item.duration) {
                if item.duration != self.scrubSliderDuration {
                    self.scrubSliderDuration = item.duration
                    let duration = CMTimeGetSeconds(item.duration)
                    self.scrubSlider.maximumValue = Float(duration)
                }
            }
            let current = CMTimeGetSeconds(item.currentTime())
            self.scrubSlider.setValue(Float(current), animated: true)
            
            self.labelVerseNum(updateControlCenter: true, position: current)
        }
        //print("Finished progress \(CFAbsoluteTimeGetCurrent())")
    }
    
    private func labelVerseNum(updateControlCenter: Bool, position: Double) {
        if let reference = self.audioBible.getCurrentReference() {
            if let verse = reference.audioChapter {
                if (self.scrubSlider.value == 0.0) {
                    self.verseNum = 0
                }
                let newVerseNum = verse.findVerseByPosition(priorVerse: self.verseNum, seconds: Double(self.scrubSlider.value))
                if newVerseNum != self.verseNum {
                    self.verseNumLabel.string = String(newVerseNum)
                    if updateControlCenter {
                        AudioControlCenter.shared.updateNowPlaying(reference: reference,
                                                                   verse: newVerseNum, position: position)
                    }
                    self.verseNum = newVerseNum
                }
                self.verseLabel.opacity = 1
                self.verseLabel.position = positionVersePopup()
            } else {
                self.verseLabel.opacity = 0
            }
        } else {
            self.verseLabel.opacity = 0
        }
    }
    
    private func positionVersePopup() -> CGPoint {
        let slider = self.scrubSlider
        let sliderPct: Float = (slider.value - slider.minimumValue) / (slider.maximumValue - slider.minimumValue)
        let sliderValueToPixels: CGFloat = (CGFloat(sliderPct) * self.sliderRange) + self.sliderOrigin
        return CGPoint(x: sliderValueToPixels, y: self.verseLabelYPos)
    }
    
    /**
    * Scrub Slider Event Handler
    */
    @objc private func scrubSliderChanged(sender: UISlider) {
        self.labelVerseNum(updateControlCenter: false, position: 0.0)
    }
    @objc private func touchDown() {
        self.scrubSliderDrag = true
        if self.audioBible.isPlaying() {
            self.audioBible.getPlayer()?.pause()
            self.scrubSuspendedPlay = true
        }
        //print("**** touchDown **** \(CFAbsoluteTimeGetCurrent())")
    }
    @objc private func touchUpInside(sender: UISlider) {
        //print("**** touchUpInside **** \(CFAbsoluteTimeGetCurrent())")
        
        if let play = self.audioBible.getPlayer() {
            if sender.value < sender.maximumValue || !self.scrubSuspendedPlay {
                var current: CMTime
                if let verse = self.audioBible.getCurrentReference()?.audioChapter {
                    current = verse.findPositionOfVerse(verse: self.verseNum)
                } else {
                    current = CMTime(seconds: Double(sender.value), preferredTimescale: CMTimeScale(1000))
                }
                play.seek(to: current)
                self.labelVerseNum(updateControlCenter: true, position: current.seconds)
            } else {
                self.audioBible.nextChapter()
            }
            self.scrubSliderDrag = false
            if self.scrubSuspendedPlay {
                play.play()
                self.scrubSuspendedPlay = false
            }
        }
    }

    private func initNotifications() {
        let notify = NotificationCenter.default
        notify.addObserver(self, selector: #selector(applicationWillEnterForeground(note:)),
                           name: .UIApplicationWillEnterForeground, object: nil)
    }
    @objc private func applicationWillEnterForeground(note: Notification) {
        print("\n****** APP WILL ENTER FOREGROUND IN VIEW \(Date().timeIntervalSince1970)")
        if let play = self.audioBible.getPlayer() {
            if (play.rate == 0.0) {
                self.pauseButton.removeFromSuperview()
                self.audioPanel.addSubview(self.playButton)
            } else {
                self.presentPlayer()
            }
        }
    }
}
