/**
* This database adapter is different from the others in this package.  It accesses
* not the Bible, but a different database, which contains a catalog of versions of the Bible.
*
* The App selects from, but never modifies this data.
*/
function VersionsAdapter() {
    this.className = 'VersionsAdapter';
	var size = 2 * 1024 * 1024;
    if (window.sqlitePlugin === undefined) {
        console.log('opening Versions SQL Database, stores in Cache');
        this.database = window.openDatabase("Versions", "1.0", "Versions", size);
    } else {
        console.log('opening SQLitePlugin Versions Database, stores in Documents with no cloud');
        this.database = window.sqlitePlugin.openDatabase({name:"Versions", location:2, createFromLocation:1});
    }
	Object.seal(this);
}
VersionsAdapter.prototype.selectCountries = function(callback) {
	var statement = 'SELECT countryCode, localName, flagIcon FROM Country ORDER BY localName';
	this.select(statement, null, function(results) {
		if (results instanceof IOError) {
			callback(results)
		} else {
			var array = [];
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				array.push(row);
			}
			callback(array);
		}
	});
};
VersionsAdapter.prototype.selectVersions = function(countryCode, callback) {
	var statement = 'SELECT cv.localLanguageName, cv.localVersionName, v.scope, o.ownerName, v.copyrightYear' +
		' FROM CountryVersion cv' +
		' JOIN Version v ON cv.versionCode=v.versionCode' +
		' JOIN Language l ON v.silCode=l.silCode' +
		' JOIN Owner o ON v.ownerCode=o.ownerCode' +
		' WHERE cv.countryCode = ?' +
		' ORDER BY cv.localLanguageName, cv.localVersionName';
	this.select(statement, [countryCode], function(results) {
		if (results instanceof IOError) {
			callback(results);
		} else {
			var array = [];
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				array.push(row);
			}
			callback(array);
		}
	});
};
VersionsAdapter.prototype.select = function(statement, values, callback) {
    this.database.readTransaction(function(tx) {
        console.log(statement, values);
        tx.executeSql(statement, values, onSelectSuccess, onSelectError);
    });
    function onSelectSuccess(tx, results) {
        console.log('select success results, rowCount=', results.rows.length);
        callback(results);
    }
    function onSelectError(tx, err) {
        console.log('select error', JSON.stringify(err));
        callback(new IOError(err));
    }
};
