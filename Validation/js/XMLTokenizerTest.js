/**
* This file is the unit test of XMLTokenizer
*/
var fs = require("fs");
var WEB_BIBLE_PATH = "../../DBL/2current/";
var OUT_BIBLE_PATH = "output/";

function XMLSerializer() {
	this.result = [];
	Object.seal(this);
}
XMLSerializer.prototype.write = function(nodeType, nodeValue) {
	switch(nodeType) {
		case XMLNodeType.ELE_OPEN:
			this.result.push('<', nodeValue);
			break;
		case XMLNodeType.ATTR_NAME:
			this.result.push(' ', nodeValue, '=');
			break;
		case XMLNodeType.ATTR_VALUE:
			this.result.push('"', nodeValue, '"');
			break;
		case XMLNodeType.ELE_END:
			this.result.push('>');
			break;
		case XMLNodeType.WHITESP:
			this.result.push(nodeValue);
			break;
		case XMLNodeType.TEXT:
			this.result.push(nodeValue);
			break;
		case XMLNodeType.ELE_EMPTY:
			this.result.push(' />');
			break;
		case XMLNodeType.ELE_CLOSE:
			this.result.push('</', nodeValue, '>');
			break;
		case XMLNodeType.PROG_INST:
			this.result.push('\uFEFF', nodeValue);
			break;
		case XMLNodeType.END:
			break;
		default:
			throw new Error('The XMLNodeType ' + nodeType + ' is unknown in XMLWriter');
	}
};
XMLSerializer.prototype.close = function() {
	return(this.result.join(''));
};

function testOne(fullPath, files, index, callback) {
	if (index >= files.length) {
		callback();
	} else {
		var file = files[index];
		symmetricTest(fullPath, file);
		testOne(fullPath, files, index + 1, callback);
	}
}
function symmetricTest(fullPath, filename) {
	var inFile = fullPath + filename;
	var data = fs.readFileSync(inFile, "utf8");
	var reader = new XMLTokenizer(data);
	var writer = new XMLSerializer();
	var count = 0;
	var type;
	while (type !== XMLNodeType.END && count < 770000) {
		type = reader.nextToken();
		var value = reader.tokenValue();
		//console.log('type=|' + type + '|  value=|' + value + '|');
		writer.write(type, value);
		count++;
	};
	var result = writer.close();
	var outFile = OUT_BIBLE_PATH + filename;
	fs.writeFileSync(outFile, result, "utf8");
	console.log('COMPARE ', filename);
	const proc = require('child_process');
	var output = proc.execSync('diff ' + inFile + ' ' + outFile, { stdio: 'inherit', encoding: 'utf8' });
}
if (process.argv.length < 3) {
	console.log('Usage: XMLTokenizerTest.sh  version');
	process.exit(1);
}
var fullPath = WEB_BIBLE_PATH + process.argv[2] + '/USX_1/';
var files = fs.readdirSync(fullPath);
testOne(fullPath, files, 0, function() {
	console.log('XMLTokenizerTest DONE');
});