/**
* This class contains user interface features for the display of the Bible text
*/
var CODEX_VIEW = {BEFORE: 1, AFTER: 1, MAX: 100000, SCROLL_TIMEOUT: 250};

function CodexView(chaptersAdapter, tableContents, headerHeight, copyrightView) {
	this.chaptersAdapter = chaptersAdapter;
	this.tableContents = tableContents;
	this.headerHeight = headerHeight;
	this.copyrightView = copyrightView;
	this.rootNode = document.createElement('div');
	this.rootNode.id = 'codexRoot';
	document.body.appendChild(this.rootNode);
	this.viewport = this.rootNode;
	this.viewport.style.top = headerHeight + 'px'; // Start view at bottom of header.
	this.currentNodeId = null;
	this.checkScrollID = null;
	Object.seal(this);
	var that = this;
}
CodexView.prototype.hideView = function() {
	window.clearTimeout(this.checkScrollID);
	while (this.viewport.firstChild) {
		this.viewport.removeChild(this.viewport.firstChild);
	}
};
CodexView.prototype.showView = function(nodeId) {
	window.clearTimeout(this.checkScrollID);
	document.body.style.backgroundColor = '#FFF';
	var firstChapter = new Reference(nodeId);
	var rowId = this.tableContents.rowId(firstChapter);
	var that = this;
	//this.showChapters([rowId - CODEX_VIEW.BEFORE, rowId + CODEX_VIEW.AFTER], true, function(err) {
	this.showChapters([rowId], true, function(err) {
		that.scrollTo(firstChapter.nodeId);
		that.currentNodeId = "top" + firstChapter.nodeId;
		document.dispatchEvent(new CustomEvent(BIBLE.CHG_HEADING, { detail: { reference: firstChapter }}));
		that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);	// should be last thing to do
	});
	function onScrollHandler(event) {
		var currNode = identifyCurrentChapter();//expensive solution
		if (currNode) {
			//console.log("currNode top: " + currNode.top + "  mid: " + currNode.middle + "  bot: " + currNode.bottom);
			if (currNode.middle !== that.currentNodeId) {
				that.currentNodeId = currNode.middle;
				var currRef = new Reference(currNode.middle.substr(3));
				document.dispatchEvent(new CustomEvent(BIBLE.CHG_HEADING, { detail: { reference: currRef }}));
			}
			var lastChildId = that.viewport.lastChild.id;
			var firstChild = that.viewport.firstChild;
			var firstRect = firstChild.getBoundingClientRect();
			if (firstRect.top > 0 && lastChildId.substr(7,1) !== "0") {
				var firstChapter = new Reference(that.viewport.firstChild.id.substr(3));
				var priorRowId = that.tableContents.priorRowId(firstChapter);
				if (priorRowId) {
					that.showChapters([priorRowId], false, function() {
						onScrollLastStep();
					});
				} else onScrollLastStep();
			} else if (currNode.bottom === lastChildId || lastChildId.substr(7,1) === "0") {
				var lastChapter = new Reference(lastChildId.substr(3));
				var nextRowId = that.tableContents.nextRowId(lastChapter);
				if (nextRowId) {
					that.showChapters([nextRowId], true, function() {
						onScrollLastStep();
					});					
				} else onScrollLastStep();
			} else onScrollLastStep();
		} else onScrollLastStep();
	}
	function onScrollLastStep() {
		that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT); // should be last thing to do
	}
	function identifyCurrentChapter() {
		var result = {middle: null, bottom: null};
		var windowBot = window.innerHeight;
		var windowMid = windowBot / 2;
		var index = that.viewport.children.length -1;
		while(index >= 0) {
			var node = that.viewport.children[index];
			var rect = node.getBoundingClientRect();
			if (result.bottom === null && rect.top < windowBot) {
				result.bottom = node.id;
			}
			if (result.middle === null && rect.top < windowMid) {
				result.middle = node.id;
			}
			if (result.bottom && result.middle) {
				return(result);
			}
			index--;
		}
		return(result);
	}
};
CodexView.prototype.showChapters = function(chapters, append, callback) {
	var that = this;
	this.chaptersAdapter.getChapters(chapters, function(html) {
		if (html && html.length > 10) {
			//for (var i=0; i<results.rows.length; i++) {
			var startId = html.indexOf("id=") + 4;
			var endId = html.indexOf("\"", startId + 1);
			var nodeId = html.substring(startId, endId);
			var reference = new Reference(nodeId);
			var page = (reference.chapter > 0) ? html + that.copyrightView.copyrightNotice : html;
			if (append) {
				reference.append(that.viewport, page);
			} else {
				var scrollHeight1 = that.viewport.scrollHeight;
				var scrollY1 = window.scrollY;
				reference.prepend(that.viewport, page);
				//window.scrollTo(0, scrollY1 + that.viewport.scrollHeight - scrollHeight1);
				TweenMax.set(window, {scrollTo: { y: scrollY1 + that.viewport.scrollHeight - scrollHeight1}});
			}
			console.log('added chapter', reference.nodeId);
		}
		callback();
	});
};
CodexView.prototype.scrollTo = function(nodeId) {
	console.log('scrollTo', nodeId);
	var verse = document.getElementById(nodeId);
	if (verse) {
		var rect = verse.getBoundingClientRect();
		//window.scrollTo(0, rect.top + window.scrollY - this.headerHeight);
		TweenMax.set(window, {scrollTo: { y: rect.top + window.scrollY - this.headerHeight}});
	}
};
/**
* This method displays the footnote by taking text contained in the 'note' attribute
* and adding it as a text node.
*/
CodexView.prototype.showFootnote = function(node) {
	var handChar = node.innerText.trim();
	if (handChar === '\u261C' || handChar === '\u261E') {
		node.setAttribute('style', 'color: #555555; background-color: #FFFFB4;');
	} else {
		node.setAttribute('style', 'color: #555555; background-color: #CEE7FF;');
	}
	for (var i=0; i<node.children.length; i++) {
		node.children[i].setAttribute('style', 'display:inline');
	}
};
/**
* This method removes the footnote by removing all of the text nodes under a note
* except the one that displays the link.
*/
CodexView.prototype.hideFootnote = function(node) {
	node.setAttribute('style', 'color: ##FFB4B5; background-color: #FFFFFF;');
	for (var i=0; i<node.children.length; i++) {
		node.children[i].setAttribute('style', 'display:none');
	}
};

