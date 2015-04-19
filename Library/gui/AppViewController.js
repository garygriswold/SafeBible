/**
* BibleApp is a global object that contains pointers to all of the key elements of
* a user's session with the App.
*/
"use strict"

var EVENT = { TOC2PASSAGE: 'toc2passage' };

function AppViewController(versionCode) {
	this.versionCode = versionCode;
	this.tableContents = new TableContentsView(versionCode);
	this.codex = new CodexView(versionCode);

	this.bodyNode = this.tableContents.bodyNode;
	this.bodyNode.addEventListener(EVENT.TOC2PASSAGE, toc2PassageHandler);
	var that = this;
	Object.freeze(this);

	function toc2PassageHandler(event) {
		var detail = event.detail;
		console.log(JSON.stringify(detail));
		that.codex.showPassage(detail.filename, detail.id);	
	}
};
AppViewController.prototype.begin = function() {
	this.tableContents.showTocBookList();
};


