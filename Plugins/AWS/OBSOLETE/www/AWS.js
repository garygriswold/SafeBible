/**
* A consistent interface pattern is applied here.
* 1. Each native method can return success or error.
* 2. The errors are output to the console.log here
* 3. Methods that return data when there is a success
* will return a null when there is an error.
* 4. Native methods that return no data when there is a success
* will return true here and false if there was an error.
*/
"use strict";
var exec = require('cordova/exec');

exports.initializeRegion = function(callback) {
	exec(function() {
		callback(true);
	}, function(error) {
		console.log("ERROR: AWS.initializeRegion " + error);
		callback(false);
	}, "AWS", "initializeRegion", []);
};

exports.echo1 = function(message, callback) {
	console.log("AWS.echo1 " + message);
	callback(message);	
};

exports.echo2 = function(message, callback) {
	console.log("INSIDE echo2");
	exec(callback, function(error) {
		AWS.logError("echo2", error, message, null, null);
		callback(error);
	}, "AWS", "echo2", [message]);	
};

exports.echo3 = function(message, callback) {
	console.log("INSIDE echo3");
	exec(callback, function(error) {
		AWS.logError("echo3", error, message, null, null);
		callback(error);
	}, "AWS", "echo3", [message]);	
};

exports.preSignedUrlGET = function(s3Bucket, s3Key, expires, callback) {
    exec(callback, function(error) {
	    AWS.logError("preSignedUrlGET", error, s3Bucket, s3Key, null);
	    callback(null);
    }, "AWS", "preSignedUrlGET", [s3Bucket, s3Key, expires]);
};

exports.preSignedUrlPUT = function(s3Bucket, s3Key, expires, contentType, callback) {
    exec(callback, function(error) {
	    AWS.logError("preSignedUrlPUT", error, s3Bucket, s3Key, null);
	    callback(null);		    
    }, "AWS", "preSignedUrlPUT", [s3Bucket, s3Key, expires, contentType]);
};

exports.downloadText = function(s3Bucket, s3Key, callback) {
    exec(callback, function(error) {
		AWS.logError("downloadText", error, s3Bucket, s3Key, null);
	    callback(null);			    
    }, "AWS", "downloadText", [s3Bucket, s3Key]);
};

exports.downloadData = function(s3Bucket, s3Key, callback) {
    exec(callback, function(error) {
	    AWS.logError("downloadData", error, s3Bucket, s3Key, null);
	    callback(null);			    
    }, "AWS", "downloadData", [s3Bucket, s3Key]);
};

exports.downloadFile = function(s3Bucket, s3Key, filePath, callback) {
    exec(function() {
	    callback(true);
	}, function(error) {
		AWS.logError("downloadFile", error, s3Bucket, s3Key, filePath);
	    callback(false);			    
    }, "AWS", "downloadFile", [s3Bucket, s3Key, filePath]);
};

exports.downloadZipFile = function(s3Bucket, s3Key, filePath, callback) {
    exec(function() {
	    callback(null);
	},  function(error) {
		AWS.logError("downloadZipFile", error, s3Bucket, s3Key, filePath);
	    callback(error);			    
    }, "AWS", "downloadZipFile", [s3Bucket, s3Key, filePath]);
};

exports.uploadAnalytics = function(sessionId, timestamp, prefix, json, callback) {
    exec(function() {
	    callback(true);
	}, function(error) {
		AWS.logError("uploadAnalytics", error, sessionId, timestamp, null);
	    callback(false);				
	}, "AWS", "uploadAnalytics", [sessionId, timestamp, prefix, json]);
};

exports.uploadText = function(s3Bucket, s3Key, data, contentType, callback) {
    exec(function() {
	    callback(true);
	}, function(error) {
		AWS.logError("uploadText", error, s3Bucket, s3Key, null);
	    callback(false);		
	}, "AWS", "uploadText", [s3Bucket, s3Key, data, contentType]);
};

exports.uploadData = function(s3Bucket, s3Key, data, contentType, callback) {
    exec(function() {
	    callback(true);
	}, function(error) {
		AWS.logError("uploadData", error, s3Bucket, s3Key, null);
	    callback(false);			
	}, "AWS", "uploadData", [s3Bucket, s3Key, data, contentType]);
};

/**
* Warning: this does not use the uploadFile method of TransferUtility,
* See note in iOS AwsS3.uploadFile for more info.
*/
exports.uploadFile = function(s3Bucket, s3Key, filePath, contentType, callback) {
    exec(function() {
	    callback(true);
    }, function(error) {
	    AWS.logError("uploadFile", error, s3Bucket, s3Key, filePath);
	    callback(false);		    
    }, "AWS", "uploadFile", [s3Bucket, s3Key, filePath, contentType]);
};

exports.logError = function(method, error, s3Bucket, s3Key, filePath) {
	var msg = ["\nERROR: AWS."];
	msg.push(method);
	if (s3Bucket) msg.push(" " + s3Bucket);
	if (s3Key) msg.push("." + s3Key);
	if (filePath) msg.push(" " + filePath);
	msg.push(" -> " + error);
	console.log(msg.join(""));	
};
