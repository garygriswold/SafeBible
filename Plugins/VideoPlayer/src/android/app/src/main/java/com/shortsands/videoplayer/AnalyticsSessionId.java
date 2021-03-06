package com.shortsands.videoplayer;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

import java.util.UUID;
/**
*  AnalyticsSessionId.swift
*  AnalyticsProto
*
*  Created by Gary Griswold on 6/29/17.
*  Copyright © 2017 ShortSands. All rights reserved.
*/

class AnalyticsSessionId {
    
    private static String SESSION_KEY = "ShortSandsSessionId";

    Context context;

    AnalyticsSessionId(Context context) {
        this.context = context;
    }
    
    String getSessionId() {
        String sessionId = this.retrieveSessionId();
        if (sessionId != null) {
            return sessionId;
        } else {
            String newSessionId = UUID.randomUUID().toString();
            this.saveSessionId(newSessionId);
            return newSessionId;
        }
    }
    
    private String retrieveSessionId() {
        SharedPreferences savedState = this.context.getSharedPreferences(SESSION_KEY, Context.MODE_PRIVATE);
        return (savedState != null) ? savedState.getString(SESSION_KEY, null) : null;
    }
    
    private void saveSessionId(String sessionId) {
        SharedPreferences savedState = this.context.getSharedPreferences(SESSION_KEY, Context.MODE_PRIVATE);
        Editor editor = savedState.edit();
        editor.putString(SESSION_KEY, sessionId);
        editor.commit();
    }
}


