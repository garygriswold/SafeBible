/*
* This must be called with a String plugin name, String method name,
* handler is an anonymous function, and a parameter array.  The items
* in the array can be any String, number, or boolean.
*/
var pluginCallCount = 0;
var pluginCallMap = {};

/**
* This method is called by Javascript code to call Native functions
* handler is normally an anonymous function that will receive the results.
*/
function callNative(plugin, method, parameters, rtnType, handler) {
	var callbackId = plugin + "." + method + "." + pluginCallCount++;
	pluginCallMap[callbackId] = {handler: handler, rtnType: rtnType};
	callNativeForOS(callbackId, plugin, method, parameters);
}

function handleNative(callbackId, isJson, error, results) {
	//console.log(results);
	var callObj = pluginCallMap[callbackId];
	if (callObj) {
		delete pluginCallMap[callbackId];
		
		var rtnType = callObj.rtnType;
		var handler = callObj.handler;
		
		if (rtnType === "N") {
			handler();
		} else if (rtnType === "E") {
			handler(error);
		} else if (rtnType === "S") {
			if (isJson > 0) {
				try {
					var obj = JSON.parse(results);
					handler(obj);
				} catch(err) {
					console.log("ERROR JSON.parse ", err.message);
					handler(results);
				}
			} else {
				handler(results);
			}
		} else {
			if (isJson > 0) {
				try {
					var obj = JSON.parse(results);
					handler(error, obj);
				} catch(err) {
					console.log("ERROR JSON.parse ", err.message);
					handler(error, results);
				}
			} else {
				handler(error, results);
			}
		}
	} else {
		console.log("ERROR CallNative Duplicate return for " + callbackId);
	}
}


