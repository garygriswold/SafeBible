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

exports.locale = function(callback) {
    exec(callback, function(error) {
	    Utility.logError("locale", error);
	    callback(null);
    }, "Utility", "locale", []);	
};

exports.platform = function(callback) {
    exec(callback, function(error) {
	    Utility.logError("platform", error);
	    callback(null);
    }, "Utility", "platform", []);
};

exports.modelType = function(callback) {
    exec(callback, function(error) {
	    Utility.logError("model", error);
	    callback(null);
    }, "Utility", "modelType", []);
};

exports.modelName = function(callback) {
    exec(callback, function(error) {
		Utility.logError("modelName", error);
	    callback(null);			    
    }, "Utility", "modelName", []);
};

exports.deviceSize = function(callback) {
    exec(callback, function(error) {
	    Utility.logError("deviceSize", error);
	    callback(null);			    
    }, "Utility", "deviceSize", []);
};

exports.openDatabase = function(database, isCopyDatabase, callback) {
	exec(function(results) {
		callback(null);
	},
	function(error) {
		callback(error);
		Utility.logError("openDatabase", error);
	}, "Utility", "open", [database, isCopyDatabase]);
};

exports.queryJS = function(database, statement, values, callback) {
	exec(function(results) {
		callback(null, results);
	},
	function(error) {
		Utility.logError("queryJS", error);
		callback(error);
	}, "Utility", "queryJS", [database, statement, values]);
};

exports.executeJS = function(database, statement, values, callback) {
	exec(function(results) {
		callback(null, results);
	},
	function(error) {
		Utility.logError("executeJS", error);
		callback(error);
	}, "Utility", "executeJS", [database, statement, values]);	
};

exports.bulkExecuteJS = function(database, statement, values, callback) {
	exec(function(results) {
		callback(null, results);
	},
	function(error) {
		Utility.logError("bulkExecuteJS", error);
		callback(error);
	}, "Utility", "bulkExecuteJS", [database, statement, values]);	
};

exports.closeDatabase = function(database, callback) {
	exec(function(results) {
		callback(null);
	},
	function(error) {
		Utility.logError("closeDatabase", error);
		callback(error);
	}, "Utility", "close", [database]);	
};

exports.listDB = function(callback) {
	exec(function(results) {
		callback(results);
	},
	function(error) {
		Utility.logError("listDB", error);
		callback([]);
	}, "Utility", "listDB", []);	
};

exports.deleteDB = function(database, callback) {
	exec(function(results) {
		callback(null);
	},
	function(error) {
		Utility.logError("deleteDB", error);
		callback(error);
	}, "Utility", "deleteDB", [database]);	
};

exports.hideKeyboard = function(callback) {
	exec(function(results) {
		callback(results);
	},
	function(error) {
		Utility.logError("hideKeyboard", error);
		callback(error);
	}, "Utility", "hideKeyboard", []);	
};

exports.logError = function(method, error) {
	var msg = ["\nERROR: Utility."];
	msg.push(method);
	msg.push(" -> " + error);
	console.log(msg.join(""));	
};

