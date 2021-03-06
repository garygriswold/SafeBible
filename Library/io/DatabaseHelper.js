/**
* This class encapsulates the WebSQL function calls, and exposes a rather generic SQL
* interface so that WebSQL could be easily replaced if necessary.
*/
function DatabaseHelper(dbname, isCopyDatabase) {
	this.dbname = dbname;
	callNative('Sqlite', 'openDB', [dbname, isCopyDatabase], "E", function(error) {
		// The error has already been reported in JS glue layer
		// All subsequent access to database will fail, because it is not open.
	});
	Object.seal(this);
}
DatabaseHelper.prototype.select = function(statement, values, callback) {
	callNative('Sqlite', 'queryJS', [this.dbname, statement, values], "ES", function(error, results) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(new ResultSet(results));
		}
	});
};
DatabaseHelper.prototype.selectHTML = function(statement, values, callback) {
	callNative('Sqlite', 'queryHTML', [this.dbname, statement, values], "S", function(results) {
		callback(results);
	});
};
DatabaseHelper.prototype.selectSSIF = function(statement, values, callback) {
	callNative('Sqlite', 'querySSIF', [this.dbname, statement, values], "ES", function(error, results) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(results.split("~"));
		}
	});
};
DatabaseHelper.prototype.executeDML = function(statement, values, callback) {
	callNative('Sqlite', 'executeJS', [this.dbname, statement, values], "ES", function(error, rowCount) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(rowCount);
		}
	});
};
DatabaseHelper.prototype.bulkExecuteDML = function(statement, array, callback) {
	callNative('Sqlite', 'bulkExecuteJS', [this.dbname, statement, array], "ES", function(error, rowCount) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(rowCount);
		}
	});
};
DatabaseHelper.prototype.executeDDL = function(statement, callback) {
	callNative('Sqlite', 'executeJS', [this.dbname, statement, []], "ES", function(error, rowCount) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(rowCount);
		}
	});
};
DatabaseHelper.prototype.close = function() {
	callNative('Sqlite', 'closeDB', [this.dbname], "E", function(error) {
		// The error has already been logged in the JS glue layer
	});
};
/** A smoke test is needed before a database is opened. */
/** A second more though test is needed after a database is opened.*/
DatabaseHelper.prototype.smokeTest = function(callback) {
    var statement = 'select count(*) from tableContents';
    this.select(statement, [], function(results) {
        if (results instanceof IOError) {
            console.log('found Error', JSON.stringify(results));
            callback(false);
        } else if (results.rows.length === 0) {
            callback(false);
        } else {
            var row = results.rows.item(0);
            console.log('found', JSON.stringify(row));
            var count = row['count(*)'];
            console.log('count=', count);
            callback(count > 0);
        }
    });
};

function ResultSet(results) {
	this.rows = new RowItems(results);
}
function RowItems(results) {
	this.rows = results;
	this.length = this.rows.length;
}
RowItems.prototype.item = function(index) {
	return(this.rows[index]);
};

