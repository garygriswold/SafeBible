/**
* This class implements a simplified logger, which is similar to a log4j logger
* in the most basic of ways.
*/
"use strict";
var FS = require('fs');

var log = {
	filepath: 'stdout',
	useConsole: true,
	
	init: function(path) {
		log.filepath = path;
		log.useConsole = (path == 'stdout');
	},
	error: function(msg, source) {
		msg.level = 'error';
		log._log(msg, source);
	},
	warn: function(msg, source) {
		msg.level = 'warn';
		log._log(msg, source);
	},
	info: function(msg, source) {
    	msg.level = 'info';
    	log._log(msg, source);
  	},
  	_log: function(msg, source) {
		if (log.useConsole) {
			if (source) console.log(msg, 'AT', source);
			else console.log(msg);
		} else {
			if (msg.error) {
				error = msg.error;
				// restify next(err) is making message property non-iterable
				// this step is needed to recover it, so it will be in JSON.
				msg.error = error.message;
			}
			var str = JSON.stringify(msg);
			if (source) str += ' AT ' + source;
			str += '\n';
		  	FS.appendFile(log.filepath, str, function(err) {
		  		if (err) {
			  		console.log(message);
				}  
			});
		}
  	}
};

module.exports = log;

