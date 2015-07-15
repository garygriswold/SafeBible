/**
* This class is a facade over the database that is used to store bible text, concordance,
* table of contents, history and questions.
*/
function DeviceDatabase(code, name) {
	this.code = code;
	this.name = name;
    this.className = 'DeviceDatabase';
	var size = 30 * 1024 * 1024;
    if (window.sqlitePlugin === undefined) {
        console.log('opening WEB SQL Database, stores in Cache');
        this.database = window.openDatabase(this.code, "1.0", this.name, size);
    } else {
        console.log('opening SQLitePlugin Database, stores in Documents with no cloud');
        this.database = window.sqlitePlugin.openDatabase({name: this.code + '.sqlite', location: 2});
    }
	this.codex = new CodexAdapter(this);
	this.tableContents = new TableContentsAdapter(this);
	this.concordance = new ConcordanceAdapter(this);
	this.styleIndex = new StyleIndexAdapter(this);
	this.styleUse = new StyleUseAdapter(this);
	this.history = new HistoryAdapter(this);
	this.questions = new QuestionsAdapter(this);
	Object.freeze(this);
}
DeviceDatabase.prototype.select = function(statement, values, callback) {
    this.database.readTransaction(function(tx) {
        console.log(statement, values);
        tx.executeSql(statement, values, onSelectSuccess, onSelectError);
    });
    function onSelectError(tx, err) {
        console.log('select tran error', JSON.stringify(err));
        callback(new IOError(err));
    }
    function onSelectSuccess(tx, results) {
        console.log('select success results, rowCount=', results.rows.length);
        callback(results);
    }
};
DeviceDatabase.prototype.executeDML = function(statement, values, callback) {
    this.database.transaction(onTranStart, onTranError);

    function onTranStart(tx) {
        console.log('exec tran start', statement, values);
        tx.executeSql(statement, values, onExecSuccess);
    }
    function onTranError(err) {
        console.log('execute tran error', JSON.stringify(err));
        callback(new IOError(err));
    }
    function onExecSuccess(tx, results) {
    	console.log('excute sql success', results.rowsAffected);
    	callback(results.rowsAffected);
    }
};
DeviceDatabase.prototype.bulkExecuteDML = function(statement, array, callback) {
    var rowCount = 0;
	this.database.transaction(onTranStart, onTranError, onTranSuccess);

    function onTranStart(tx) {
  		console.log('bulk tran start', statement);
  		for (var i=0; i<array.length; i++) {
        	tx.executeSql(statement, array[i], onExecSuccess);
        }
    }
    function onTranError(err) {
        console.log('bulk tran error', JSON.stringify(err));
        callback(new IOError(err));
    }
    function onTranSuccess() {
        console.log('bulk tran completed');
        callback(rowCount);
    }
    function onExecSuccess(tx, results) {
        rowCount += results.rowsAffected;
    }
};
DeviceDatabase.prototype.executeDDL = function(statement, callback) {
    this.database.transaction(onTranStart, onTranError);

    function onTranStart(tx) {
        console.log('exec tran start', statement);
        tx.executeSql(statement, [], onExecSuccess);
    }
    function onTranError(err) {
        callback(new IOError(err));
    }
    function onExecSuccess(tx, results) {
        callback();
    }
};

