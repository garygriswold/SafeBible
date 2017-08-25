//
//  BibleReaderView.swift
//  AudioPlayer
//
//  Created by Gary Griswold on 8/7/17.
//  Copyright © 2017 ShortSands. All rights reserved.
//

import Foundation
import AVFoundation
import UIKit

class AudioBibleView : NSObject {
    
    var controller: AudioBibleViewController
    var view: UIView
    let audioBible: AudioBible
    let playButton: UIButton
    let pauseButton: UIButton
    let stopButton: UIButton
    let scrubSlider: UISlider
    // Transient State Variables
    var scrubSliderDuration: CMTime
    var scrubSliderDrag: Bool
    
    init(controller: AudioBibleViewController, audioBible: AudioBible) {
        self.controller = controller
        self.view = controller.view
        self.audioBible = audioBible
        self.scrubSliderDuration = kCMTimeZero
        self.scrubSliderDrag = false

        let screenSize = UIScreen.main.bounds
        let screenWidth = screenSize.width
        
        let playBtn = UIButton(type: .custom)
        playBtn.frame = CGRect(x: screenWidth/4-25, y: 100, width: 50, height: 50)
        playBtn.layer.cornerRadius = 0.5 * playBtn.bounds.size.width
        playBtn.backgroundColor = .green
        playBtn.alpha = 0.6
        playBtn.setTitle("Play", for: .normal)
        playBtn.addTarget(self.audioBible, action: #selector(self.audioBible.play), for: .touchUpInside)
        self.view.addSubview(playBtn)
        self.playButton = playBtn
        
        let pauseBtn = UIButton(type: .custom)
        pauseBtn.frame = CGRect(x: screenWidth*2/4-25, y: 100, width: 50, height: 50)
        pauseBtn.layer.cornerRadius = 0.5 * pauseBtn.bounds.size.width
        pauseBtn.backgroundColor = .orange
        pauseBtn.alpha = 0.6
        pauseBtn.setTitle("Pause", for: .normal)
        pauseBtn.addTarget(self.audioBible, action: #selector(self.audioBible.pause), for: .touchUpInside)
        self.view.addSubview(pauseBtn)
        self.pauseButton = pauseBtn
        
        let stopBtn = UIButton(type: .custom)
        stopBtn.frame = CGRect(x: screenWidth*3/4-25, y: 100, width: 50, height: 50)
        stopBtn.layer.cornerRadius = 0.5 * stopBtn.bounds.size.width
        stopBtn.backgroundColor = .red
        stopBtn.alpha = 0.6
        stopBtn.setTitle("Stop", for: .normal)
        stopBtn.addTarget(self.audioBible, action: #selector(self.audioBible.stop), for: .touchUpInside)
        self.view.addSubview(stopBtn)
        self.stopButton = stopBtn
        
        let scrubRect = CGRect(x: screenWidth * 0.05, y: 200, width: screenWidth * 0.9, height: 100)
        let scrub = UISlider(frame: scrubRect)
        scrub.isContinuous = false
        scrub.minimumTrackTintColor = UIColor.green
        scrub.maximumTrackTintColor = UIColor.purple
        scrub.alpha = 0.6
        scrub.setValue(0.0, animated: false)
        self.view.addSubview(scrub)
        self.scrubSlider = scrub
    }
    
    deinit {
        print("***** Deinit AudioBibleView *****")
        // Do I need to remove listeners from controls here
    }
    
    func startPlay() {
        self.updateProgress()
        self.scrubSlider.addTarget(self, action: #selector(scrubSliderChanged), for: .valueChanged)
        self.scrubSlider.addTarget(self, action: #selector(touchDown), for: .touchDown)
        self.scrubSlider.addTarget(self, action: #selector(touchUpInside), for: .touchUpInside)
        
        let progressLink = CADisplayLink(target: self, selector: #selector(updateProgress))
        progressLink.add(to: .current, forMode: .defaultRunLoopMode)
        progressLink.preferredFramesPerSecond = 15
    }
    
    func stopPlay() {
        self.playButton.removeFromSuperview()
        self.pauseButton.removeFromSuperview()
        self.stopButton.removeFromSuperview()
        self.scrubSlider.removeFromSuperview()
    }
    
    /**
    * Scrub Slider Animation
    */
    func updateProgress() {
        if self.scrubSliderDrag { return }
        
        if let item = self.audioBible.player?.currentItem {
            if CMTIME_IS_NUMERIC(item.duration) {
                if item.duration != self.scrubSliderDuration {
                    self.scrubSliderDuration = item.duration
                    let duration = CMTimeGetSeconds(item.duration)
                    self.scrubSlider.maximumValue = Float(duration)
                }
            }
            let current = CMTimeGetSeconds(item.currentTime())
            self.scrubSlider.setValue(Float(current), animated: true)
        }
    }
    
    /**
    * Scrub Slider Event Handler
    */
    func scrubSliderChanged(sender: UISlider, forEvent event: UIEvent) {
        let slider = self.scrubSlider
        print("scrub slider changed to \(slider.value)")
        if let play = self.audioBible.player {
            if (slider.value < slider.maximumValue) {
                var current: Float
                if let verse = self.audioBible.audioChapter {
                    current = verse.findVerseByPosition(seconds: slider.value)
                } else {
                    current = slider.value
                }
                let time: CMTime = CMTime(seconds: Double(current), preferredTimescale: CMTimeScale(1.0))
                play.seek(to: time)
            } else {
                play.advanceToNextItem()
            }
        }
    }
    func touchDown() {
        print("**** touchDown ***")
        self.scrubSliderDrag = true
    }
    func touchUpInside() {
        print("**** touchUpInside ***")
        self.scrubSliderDrag = false
    }
 }
