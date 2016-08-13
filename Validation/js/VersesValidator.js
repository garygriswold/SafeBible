/**
* This program validates that the HTML copy of the Bible that is generated by the Publisher program,
* contains exactly the same text as the original USX files.  The verses table was generated from the USX
* files by Library/manuacture/VersesBuilder.js  It did this by reading the USX files using the USXParser,
* This program reads the HTML files in the version.db Chapters table, and extracting the text.  
* It outputs both of these to a text file of the entire Bible, and does a line by 
* line comparison using diff.  
* In order to be able to do line by line comparison it outputs each verse as a line.
*/
function VersesValidator(versionPath) {
	this.versionPath = versionPath;
	this.fs = require('fs');
	this.db = null;
	var canon = new Canon();
	this.bookMap = canon.sequenceMap();
	Object.seal(this);
}
VersesValidator.prototype.open = function(callback) {
	var that = this;
	var sqlite3 = require('sqlite3');
	this.db = new sqlite3.Database(this.versionPath, sqlite3.OPEN_READWRITE, function(err) {
		if (err) that.fatalError(err, 'openDatabase');
		//that.db.on('trace', function(sql) { console.log('DO ', sql); });
		//that.db.on('profile', function(sql, ms) { console.log(ms, 'DONE', sql); });
		callback();
	});
};
VersesValidator.prototype.generateChaptersFile = function(callback) {
	var that = this;
	var bible = [];
	var chapter = [];
	var verse = [];
	var verseId = '';
	var priorId = '';
	var statement = 'SELECT reference, html FROM Chapters';
	this.db.all(statement, [], function(err, results) {
		if (err) {
			that.fatalError(err, 'generateChaptersFile');
		} else {
			for (var i=0; i<results.length; i++) {
				var row = results[i];
				parseChapter(row.reference, row.html);
			}
			that.fs.writeFileSync('output/chapters.txt', bible.join(''), "utf8");
		}
	});
	
	function parseChapter(reference, chapter) {
		console.log('PARSE HTML', reference);
		const BEGIN = 'begin';
		const SPAN = 'span';
		const ID_ATTR = 'id_attr';
		const CLASS_ATTR = 'class_attr';
		const VERSE_ELE = 'verse_ele';
		var state = BEGIN;
		var reader = new XMLTokenizer(chapter);
		while (tokenType !== XMLNodeType.END) {
			var tokenType = reader.nextToken();
			
			switch(tokenType) {
				case XMLNodeType.ELE_OPEN:
					if (state === BEGIN && reader.tokenValue() === 'span') {
						state = SPAN;
					}
					break;
				case XMLNodeType.ATTR_NAME:
					if (state === SPAN && reader.tokenValue() === 'id') {
						state = ID_ATTR;
					}
					else if (state === ID_ATTR && reader.tokenValue() === 'class') {
						state = CLASS_ATTR;
					}
					break;
				case XMLNodeType.ATTR_VALUE:
					if (state === ID_ATTR) {
						verseId = reader.tokenValue();
					}
					else if (state === CLASS_ATTR && reader.tokenValue() === 'v') {
						state = VERSE_ELE;
						outputVerse(reference);
					}
					break;
				case XMLNodeType.ELE_END:
					// do nothing
					break;
				case XMLNodeType.TEXT:
					if (state !== VERSE_ELE) {
						var line = reader.tokenValue();
						line = line.replace('\n', ' ');
						line = line.replace('\u261A', '');
						line = line.replace('\u261B', '');
						line = line.replace('\u261C', '');												
						line = line.replace('\u261E', '');
						verse.push(line);
					}
					break;
				default:
					state = BEGIN;
			}
		}
		outputVerse(reference);
		outputChapter();
	}
	function outputVerse(reference) {
		//console.log('OUTPUT VERSE ***', verse.join(''));
		if (verse.length > 0 && priorId.indexOf(':') > 0) {
			chapter.push(priorId, '|', verse.join(''), '\n');
		}
		verse = [];
		priorId = verseId;
		verseId = '';
	}
	function outputChapter() {
		//console.log('OUTPUT CHAPTER ****', chapter.join(''));
		if (chapter.length > 0) {
			bible.push(chapter.join(''));
		}
		chapter = [];
	}	
};
VersesValidator.prototype.fatalError = function(err, source) {
	console.log('FATAL ERROR ', err, ' AT ', source);
	process.exit(1);
};
VersesValidator.prototype.completed = function() {
	console.log('HTML VALIDATOR COMPLETED');
	this.db.close();
	process.exit(0);
};


var DB_PATH = '../../DBL/3prepared/';
	
if (process.argv.length < 3) {
	console.log('Usage: ./HTMLValidator.sh VERSION');
	process.exit(1);
} else {
	var dbFilename = DB_PATH + process.argv[2] + '.db';
	console.log('Process ' + dbFilename);
	var val = new VersesValidator(dbFilename);
	val.open(function() {
		val.generateChaptersFile(function() {
			val.completed();
		});
	});
}
