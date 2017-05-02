/**
* This class opens the 
* This is a test and demonstration program that reads in locale information
* and uses it to access Jesus Film Meta Data, and parses out data that is 
* needed for processing.
*/
"use strict";

function VideoTableAdapter() {
	this.database = new DatabaseHelper('Versions.db', true);
	this.className = 'VideoTableAdapter';
}
/**
* NOTE: This method is only counting KOG videos.  This must be changed when the Jesus Film is released.
* Deprecated and not currently used.
*/
VideoTableAdapter.prototype.hasVideos = function(langCode, langPrefCode, callback) {
	var that = this;
	var statement = 'SELECT count(*) AS count FROM Video WHERE langCode IN (?,?) AND mediaId like "KOG%"';
	this.database.select(statement, [langCode, langPrefCode], function(results) {
		if (results instanceof IOError) {
			console.log('SQL Error in VideoTableAdapter.hasVideos', results);
			callback(0);
		} else {
			callback(results.rows.item(0).count)
		}
	});
};

VideoTableAdapter.prototype.selectJesusFilmLanguage = function(countryCode, silCode, callback) {
	var that = this;
	var statement = 'SELECT languageId FROM JesusFilm WHERE countryCode=? AND silCode=? ORDER BY population DESC';
	this.database.select(statement, [ countryCode, silCode ], function(results) {
		if (results instanceof IOError) {
			console.log('SQL Error in selectJesusFilmLanguage, query 1', results);
			callback({});
		} else if (results.rows.length > 0) {
			callback(results.rows.item(0));
		} else {
			statement = 'SELECT languageId FROM JesusFilm WHERE silCode=? ORDER BY population DESC';
			that.database.select(statement, [ silCode ], function(results) {
				if (results instanceof IOError) {
					console.log('SQL Error in selectJesusFilmLanguage, query 2', results);
					callback({});	
				} else if (results.rows.length > 0) {
					callback(results.rows.item(0));
				} else {
					callback({});
				}
			});
		}
	});
};
/**
* NOTE: This method must be prevented from returning Jesus videos.  This must be changed when the Jesus Film is released.
*/
VideoTableAdapter.prototype.selectVideos = function(languageId, silCode, langCode, langPrefCode, deviceType, callback) {
	var that = this;
	var selectList = 'SELECT languageId, mediaId, silCode, langCode, title, lengthMS, HLS_URL, MP4_1080, MP4_720, MP4_540, MP4_360,' +
			' longDescription FROM Video';
	var statement = selectList + ' WHERE languageId IN (?,?) AND mediaId like "KOG%"';
	this.database.select(statement, [ languageId, silCode ], function(results) {
		if (results instanceof IOError) {
			console.log('found Error', results);
			callback({});
		} else {
			if (results.rows.length > 0) {
				returnVideoMap(languageId, silCode, results, callback);
			} else {
				statement = selectList + ' WHERE langCode IN (?,?) AND mediaId like "KOG%"';
				that.database.select(statement, [langCode, langPrefCode], function(results) {
					if (results instanceof IOError) {
						callback({});
					} else {
						if (results.rows.length > 0) {
							returnVideoMap(languageId, silCode, results, callback);
						} else {
							statement = selectList + ' WHERE langCode = "en" AND mediaId like "KOG%"';
							that.database.select(statement, [], function(results) {
								if (results instanceof IOError) {
									callback({});
								} else {
									returnVideoMap(languageId, silCode, results, callback);
								}
							});
						}
					}
				});
			}
        }
	});
	
	function returnVideoMap(languageId, silCode, results, callback) {
		var videoMap = {};
		for (var i=0; i<results.rows.length; i++) {
			var row = results.rows.item(i);
			var meta = new VideoMetaData();
			meta.languageId = languageId;
			meta.silCode = silCode;
			meta.langCode = row.langCode;
			meta.mediaId = row.mediaId;
			meta.title = row.title;
			meta.lengthInMilliseconds = row.lengthMS;
			meta.longDescription = row.longDescription;
			switch(deviceType) {
				case 'ios':
					meta.mediaURL = row.HLS_URL;
					break;
				case 'android':
					meta.mediaURL = row.MP4_540;
					if (meta.mediaURL == null) meta.mediaURL = row.MP4_360;
					if (meta.mediaURL == null) meta.mediaURL = row.MP4_720;
					break;
				default:
			}
			videoMap[row.mediaId] = meta;
		}
        callback(videoMap);		
	}
};
