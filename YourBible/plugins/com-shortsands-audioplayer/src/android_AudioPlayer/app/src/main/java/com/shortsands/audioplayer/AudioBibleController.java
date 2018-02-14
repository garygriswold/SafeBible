package com.shortsands.audioplayer;

import android.app.Activity;
import android.media.MediaPlayer;
import android.util.Log;
import com.shortsands.aws.AwsS3;
import com.shortsands.aws.CompletionHandler;
import java.util.HashMap;
/**
 * Created by garygriswold on 8/30/17.
 */

public class AudioBibleController {

    private static final String TAG = "AudioBibleController";

    final Activity activity;
    private final AudioBibleController that;
    private final AudioSession audioSession;
    private AudioBible audioBible;
    private AudioBibleView readerView;

    public AudioBibleController(Activity activity) {
        this.activity = activity;
        AwsS3.initialize("us-west-2", activity);
        this.that = this;
        this.audioSession = new AudioSession(this.activity);
    }

    public void present() {
        if (this.audioSession.startAudioSession()) {
            MetaDataReader metaData = new MetaDataReader(this.activity);
            MetaDataReaderResponse response = new MetaDataReaderResponse();
            metaData.read("ENG", "audio", response);
        }
    }

    class MetaDataReaderResponse implements CompletionHandler {

        public void completed(Object result) {
            if (result instanceof HashMap) {
                HashMap<String, TOCAudioBible> metaData = (HashMap<String, TOCAudioBible>)result;
                TOCAudioBible bible = metaData.get("DEMO");
                TOCAudioBook book = bible.booksById.get("TST");

                Reference reference = new Reference(bible.damId, book.sequence, book.bookId, "001", "mp3");
                audioBible = new AudioBible(that, bible, reference);
                readerView = new AudioBibleView(that, audioBible);
                audioSession.setAudioBibleView(readerView);

                audioBible.beginReadFile();
            }
        }
        public void failed(Throwable exception) {
            Log.e(TAG, "MetaDataReader failed " + exception.toString());
        }
    }

    void playHasStarted(MediaPlayer player) {
        if (this.readerView != null) {
            this.readerView.startPlay(player);
        }
    }

    void playHasStopped() {
        if (this.readerView != null) {
            this.readerView.stopPlay();
            this.readerView = null;
        }
        this.audioSession.stopAudioSession();
    }

    /**
     * This method is called by an outside controller to indicate that App has stopped.
     */
    public void appHasExited() {
        this.audioBible.stop();
    }
}