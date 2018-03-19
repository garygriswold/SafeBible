package com.shortsands.audioplayer;

/**
 * Created by garygriswold on 8/30/17.
 */
import android.util.Log;
import java.util.HashMap;
import java.util.Iterator;

class AudioTOCTestament {

    private static String TAG = "AudioTOCTestament";

    AudioTOCBible bible;
    String damId;
    String dbpLanguageCode;
    String dbpVersionCode;
    String collectionCode;
    String mediaType;
    HashMap<String, AudioTOCBook> booksById;
    HashMap<Integer, AudioTOCBook> booksBySeq;

    AudioTOCTestament(AudioTOCBible bible, AudioSqlite3 database, String[] dbRow) {
        this.bible = bible;
        this.booksById = new HashMap<String, AudioTOCBook>();
        this.booksBySeq = new HashMap<Integer, AudioTOCBook>();
        this.damId = dbRow[0];
        this.collectionCode = dbRow[1];
        this.mediaType = dbRow[2];
        this.dbpLanguageCode = dbRow[3];
        this.dbpVersionCode = dbRow[4];

        String query = "SELECT bookId, bookOrder, numberOfChapters" +
            " FROM AudioBook" +
            " WHERE damId = ?" +
            " ORDER BY bookOrder";
        String[] values = new String[1];
        values[0] = this.damId;
        try {
            String[][] resultSet = database.queryV1(query, values);
            for (int i=0; i<resultSet.length; i++) {
                String[] row = resultSet[i];
                AudioTOCBook book = new AudioTOCBook(this, row);
                this.booksById.put(book.bookId, book);
                this.booksBySeq.put(book.sequence, book);
            }
        } catch (Exception err) {
            Log.d(TAG,"ERROR " + AudioSqlite3.errorDescription(err));
        }
    }

    //deinit {
    //    print("***** Deinit TOCAudioTOCBible *****")
    //}

    AudioReference nextChapter(AudioReference ref) {
        AudioTOCBook book = ref.tocAudioBook;
        if (ref.chapterNum() < book.numberOfChapters) {
            int next = ref.chapterNum() + 1;
            return AudioReference.factory(ref.tocAudioBook, next, ref.fileType);
        } else {
            AudioTOCBook nextBook = this.booksBySeq.get(ref.sequenceNum() + 1);
            if (nextBook != null) {
                return AudioReference.factory(nextBook, 1, ref.fileType);
            }
        }
        return null;
    }

    AudioReference priorChapter(AudioReference ref) {
        int prior = ref.chapterNum() - 1;
        if (prior > 0) {
            return AudioReference.factory(ref.tocAudioBook, prior, ref.fileType);
        } else {
            AudioTOCBook priorBook = this.booksBySeq.get(ref.sequenceNum() - 1);
            if (priorBook != null) {
                return AudioReference.factory(priorBook, priorBook.numberOfChapters, ref.fileType);
            }
        }
        return null;
    }

    String getBookList() {
        StringBuffer array = new StringBuffer();
        Iterator<AudioTOCBook> it = this.booksBySeq.values().iterator();
        while(it.hasNext()) {
            array.append(",");
            array.append(it.next().bookId);
        }
        return array.toString();
    }

    public String toString() {
        String str = "damId=" + this.damId +
                "\n languageCode=" + this.dbpLanguageCode +
                "\n versionCode=" + this.dbpVersionCode +
                "\n mediaType=" + this.mediaType +
                "\n collectionCode=" + this.collectionCode;
        return str;
    }
}

