/**
* This class is the database adapter for the history table
*/
var MAX_HISTORY = 20;

function HistoryAdapter(database) {
	this.database = database;
	this.className = 'HistoryAdapter';
	this.lastSelectCurrent = false;
	Object.seal(this);
}
HistoryAdapter.prototype.drop = function(callback) {
	this.database.executeDDL('drop table if exists History', function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('drop History success');
			callback();
		}
	});
};
HistoryAdapter.prototype.create = function(callback) {
	var statement = 'create table if not exists History(' +
		'timestamp text not null primary key, ' +
		'reference text not null unique, ' +
		'source text not null, ' +
		'search text null)';
	this.database.executeDDL(statement, function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('create History success');
			callback();
		}
	});
};
HistoryAdapter.prototype.selectPassages = function(callback) {
	var that = this;
	var statement = 'select reference from History order by timestamp desc limit ?';
	this.database.select(statement, [ MAX_HISTORY ], function(results) {
		if (results instanceof IOError) {
			console.log('HistoryAdapter.selectAll Error', JSON.stringify(results));
			callback(results);
		} else {
			var array = [];
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				array.push(row.reference);
			}
			that.lastSelectCurrent = true;
			callback(array);
		}
	});
};
HistoryAdapter.prototype.lastItem = function(callback) {
	var statement = 'select reference from History order by rowid desc limit 1';
	this.database.select(statement, [], function(results) {
		if (results instanceof IOError) {
			console.log('HistoryAdapter.lastItem Error', JSON.stringify(results));
			callback(results);
		} else {
			if (results.rows.length > 0) {
				var row = results.rows.item(0);
				callback(row.reference);
			} else {
				callback(null);
			}
		}
	});
};
HistoryAdapter.prototype.lastConcordanceSearch = function(callback) {
	var statement = 'select search from History where search is not null order by timestamp desc limit 1';
	this.database.select(statement, [], function(results) {
		if (results instanceof IOError) {
			console.log('HistoryAdapter.lastConcordance Error', JSON.stringify(results));
			callback(results);
		} else {
			if (results.rows.length > 0) {
				var row = results.rows.item(0);
				callback(row.search);
			} else {
				callback(new IOError('No rows found'));
			}
		}
	});
};
HistoryAdapter.prototype.replace = function(item, callback) {
	var timestampStr = item.timestamp.toISOString();
	var values = [ timestampStr, item.reference, item.source, item.search || null ];
	var statement = 'replace into History(timestamp, reference, source, search) values (?,?,?,?)';
	var that = this;
	this.lastSelectCurrent = false;
	this.database.executeDML(statement, values, function(count) {
		if (count instanceof IOError) {
			console.log('replace error', JSON.stringify(count));
			callback(count);
		} else {
			that.cleanup(function(count) {
				callback(count);
			});
		}
	});
};
HistoryAdapter.prototype.cleanup = function(callback) {
	var statement = ' delete from History where ? < (select count(*) from History) and timestamp = (select min(timestamp) from History)';
	this.database.executeDML(statement, [ MAX_HISTORY ], function(count) {
		if (count instanceof IOError) {
			console.log('delete error', JSON.stringify(count));
			callback(count);
		} else {
			callback(count);
		}
	});
};