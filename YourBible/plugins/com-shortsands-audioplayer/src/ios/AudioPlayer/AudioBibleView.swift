//
//  BibleReaderView.swift
//  AudioPlayer
//
//  Created by Gary Griswold on 8/7/17.
//  Copyright © 2017 ShortSands. All rights reserved.
//

import AVFoundation
import UIKit

class AudioBibleView {
    
    private static var instance: AudioBibleView?
    static func shared(view: UIView, audioBible: AudioBible) -> AudioBibleView {
        if (AudioBibleView.instance == nil) {
            AudioBibleView.instance = AudioBibleView(view: view, audioBible: audioBible)
        }
        return AudioBibleView.instance!
    }
    
    private unowned let view: UIView
    private unowned let audioBible: AudioBible
    private let playButton: UIButton
    private let pauseButton: UIButton
    private let stopButton: UIButton
    private let scrubSlider: UISlider
    private let verseLabel: CALayer
    private let verseLabelYPos: CGFloat
    private let verseNumLabel: CATextLayer
    private var progressLink: CADisplayLink?
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
        let screenWidth = screenSize.width
        let screenHeight = screenSize.height
        
        let playBtn = UIButton(type: .custom)
        playBtn.frame = CGRect(x: screenWidth/3-40, y: screenHeight - 85, width: 80, height: 80)
        let playUpImg = UIImage(named: "UIPlayUPButton.png")
        playBtn.setImage(playUpImg, for: UIControlState.normal)
        let playDnImg = UIImage(named: "UIPlayDNButton.png")
        playBtn.setImage(playDnImg, for: UIControlState.highlighted)
        self.playButton = playBtn
        
        let pauseBtn = UIButton(type: .custom)
        pauseBtn.frame = CGRect(x: screenWidth/3-40, y: screenHeight - 85, width: 80, height: 80)
        let pauseUpImg = UIImage(named: "UIPauseUPButton.png")
        pauseBtn.setImage(pauseUpImg, for: UIControlState.normal)
        let pauseDnImg = UIImage(named: "UIPauseDNButton.png")
        pauseBtn.setImage(pauseDnImg, for: UIControlState.highlighted)
        self.pauseButton = pauseBtn
        
        let stopBtn = UIButton(type: .custom)
        stopBtn.frame = CGRect(x: screenWidth*2/3-40, y: screenHeight - 85, width: 80, height: 80)
        let stopUpImg = UIImage(named: "UIStopUPButton.png")
        stopBtn.setImage(stopUpImg, for: UIControlState.normal)
        let stopDnImg = UIImage(named: "UIStopDNButton.png")
        stopBtn.setImage(stopDnImg, for: UIControlState.highlighted)
        self.stopButton = stopBtn
        
        let scrubRect = CGRect(x: screenWidth * 0.05, y: screenHeight - 145, width: screenWidth * 0.9, height: 60)
        let scrub = UISlider(frame: scrubRect)
        scrub.isContinuous = true
        let thumbUpImg = UIImage(named: "UIThumbUP.png")
        scrub.setThumbImage(thumbUpImg, for: UIControlState.normal)
        let thumbDnImg = UIImage(named: "UIThumbDN.png")
        scrub.setThumbImage(thumbDnImg, for: UIControlState.highlighted)
        
        let sliderMinImg = UIImage(named: "UISliderMin.png")
        let sliderMinInsets = UIEdgeInsets(top: 0.0, left: 8.0, bottom: 0.0, right: 0.0)
        let sliderMin = sliderMinImg?.resizableImage(withCapInsets: sliderMinInsets,
                                                     resizingMode: UIImageResizingMode.stretch)
        scrub.setMinimumTrackImage(sliderMin, for: UIControlState.normal)
        
        let sliderMaxImg = UIImage(named: "UISliderMax.png")
        let sliderMaxInsets = UIEdgeInsets(top: 0.0, left: 0.0, bottom: 0.0, right: 8.0)
        let sliderMax = sliderMaxImg?.resizableImage(withCapInsets: sliderMaxInsets,
                                                     resizingMode: UIImageResizingMode.stretch)
        scrub.setMaximumTrackImage(sliderMax, for: UIControlState.normal)
        
        scrub.setValue(0.0, animated: false)
        self.scrubSlider = scrub
        
        // Precompute Values for positionVersePopup()
        self.sliderRange = scrub.frame.size.width - (scrub.currentThumbImage?.size.width)!
        self.sliderOrigin = scrub.frame.origin.x + ((scrub.currentThumbImage?.size.width)! / 2.0)
        
        self.verseLabelYPos = screenHeight - 165
        let verse = CALayer()
        verse.frame = CGRect(x: screenWidth * 0.05, y: self.verseLabelYPos, width: 32, height: 32)
        verse.backgroundColor = UIColor.white.cgColor
        verse.contentsScale = UIScreen.main.scale
        verse.borderColor = UIColor.lightGray.cgColor
        verse.borderWidth = 1.0
        verse.cornerRadius = verse.frame.width / 2
        verse.masksToBounds = false
        verse.opacity = 0 // Will be set to 1 if data is available
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
        stopBtn.layer.shadowOpacity = 0.5
        stopBtn.layer.shadowOffset = CGSize(width: 2.0, height: 1.0)
        verse.shadowOpacity = 0.5
        verse.shadowOffset = CGSize(width: 1.0, height: 0.5)
        scrub.layer.shadowOpacity = 0.5
        scrub.layer.shadowOffset = CGSize(width: 2.0, height: 1.0)
    }
    
    deinit {
        print("***** Deinit AudioBibleView *****")
    }
    
    @objc func play() {
        self.audioBible.play()
        if (self.isAudioViewActive) {
            self.playButton.removeFromSuperview()
            self.view.addSubview(self.pauseButton)
        }
    }
    
    @objc func pause() {
        self.audioBible.pause()
        if (self.isAudioViewActive) {
            self.pauseButton.removeFromSuperview()
            self.view.addSubview(self.playButton)
        }
    }
    
    @objc private func stop() {
        self.audioBible.stop()
    }
    
    func startPlay() {
        self.isAudioViewActive = true
        if self.audioBible.isPlaying() {
            self.view.addSubview(self.pauseButton)
        } else {
            self.view.addSubview(self.playButton)
        }
        self.view.addSubview(self.pauseButton)
        self.view.addSubview(self.stopButton)
        self.view.addSubview(self.scrubSlider)
        self.view.layer.addSublayer(self.verseLabel)
        self.verseLabel.addSublayer(self.verseNumLabel)
        
        self.progressLink = CADisplayLink(target: self, selector: #selector(updateProgress))
        self.progressLink!.add(to: .current, forMode: .defaultRunLoopMode)
        self.progressLink!.preferredFramesPerSecond = 15
        
        self.playButton.addTarget(self, action: #selector(self.play), for: .touchUpInside)
        self.pauseButton.addTarget(self, action: #selector(self.pause), for: .touchUpInside)
        self.stopButton.addTarget(self, action: #selector(self.stop), for: .touchUpInside)
        self.scrubSlider.addTarget(self, action: #selector(scrubSliderChanged), for: .valueChanged)
        self.scrubSlider.addTarget(self, action: #selector(touchDown), for: .touchDown)
        self.scrubSlider.addTarget(self, action: #selector(touchUpInside), for: .touchUpInside)
        self.scrubSlider.addTarget(self, action: #selector(touchUpInside), for: .touchUpOutside)
        self.initNotifications()
    }
    
    func stopPlay() {
        self.isAudioViewActive = false
        self.playButton.removeFromSuperview()
        self.pauseButton.removeFromSuperview()
        self.stopButton.removeFromSuperview()
        self.scrubSlider.removeFromSuperview()
        self.verseLabel.removeFromSuperlayer()
        self.progressLink?.invalidate()
        self.removeNotifications()
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
        if let verse = self.audioBible.getCurrentReference()?.audioChapter {
            if (self.scrubSlider.value == 0.0) {
                self.verseNum = 0
            }
            let newVerseNum = verse.findVerseByPosition(priorVerse: self.verseNum, seconds: Double(self.scrubSlider.value))
            if newVerseNum != self.verseNum {
                self.verseNumLabel.string = String(newVerseNum)
                if updateControlCenter {
                    AudioControlCenter.shared.updateNowPlaying(verse: newVerseNum, position: position)
                }
                self.verseNum = newVerseNum
            }
            self.verseLabel.opacity = 1
            self.verseLabel.position = positionVersePopup()
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
    * BUG: When the slider is dragged and released it sometimes momentarily jumps back to its starting point.
    * I have verified that this is not because updateProgress was unfinished.  It seems like it must be a
    * saved screen update.  I need to learn how to discard such when the
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
    private func removeNotifications() {
        let notify = NotificationCenter.default
        notify.removeObserver(self, name: .UIApplicationWillEnterForeground, object: nil)
    }
    @objc private func applicationWillEnterForeground(note: Notification) {
        print("\n****** APP WILL ENTER FOREGROUND IN VIEW \(Date().timeIntervalSince1970)")
        if let play = self.audioBible.getPlayer() {
            if (play.rate == 0.0) {
                self.pauseButton.removeFromSuperview()
                self.view.addSubview(self.playButton)
            } else {
                self.playButton.removeFromSuperview()
                self.view.addSubview(self.pauseButton)
            }
        }
    }
}
