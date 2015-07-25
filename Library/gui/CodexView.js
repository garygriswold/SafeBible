/**
* This class contains user interface features for the display of the Bible text
*/
var CODEX_VIEW = { MAX: 10, SCROLL_TIMEOUT: 100 };

function CodexView(chaptersAdapter, tableContents, statusBarHeight) {
	this.chaptersAdapter = chaptersAdapter;
	this.tableContents = tableContents;
	this.statusBarHeight = statusBarHeight;
	this.rootNode = document.getElementById('codexRoot');
	this.currentNodeId = null;
	this.checkScrollID = null;
	//this.visible = false; // HACK because I have not been able to remove onscroll listener.
	Object.seal(this);
}
CodexView.prototype.hideView = function() {
	//this.visible = false;
	window.clearTimeout(this.checkScrollID);
	for (var i=this.rootNode.children.length -1; i>=0; i--) {
		this.rootNode.removeChild(this.rootNode.children[i]);
	}
};
CodexView.prototype.showView = function(nodeId) {
	var chapterQueue = [];
	var firstChapter = new Reference(nodeId);
	firstChapter = this.tableContents.ensureChapter(firstChapter);
	document.body.dispatchEvent(new CustomEvent(BIBLE.CHG_HEADING, { detail: { reference: firstChapter }}));
	var chapter = firstChapter;
	for (var i=0; i<3 && chapter; i++) {
		chapter = this.tableContents.priorChapter(chapter);
		if (chapter) {
			chapterQueue.unshift(chapter);
		}
	}
	chapterQueue.push(firstChapter);
	chapter = firstChapter;
	for (i=0; i<3 && chapter; i++) {
		chapter = this.tableContents.nextChapter(chapter);
		if (chapter) {
			chapterQueue.push(chapter);
		}
	}
	var that = this;
	this.showChapters(chapterQueue, true, function(results) {
		//document.removeEventListener('scroll', onScrollHandler);
		that.scrollTo(firstChapter);
		that.currentNodeId = firstChapter.nodeId;
		that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);
		//document.addEventListener('scroll', onScrollHandler);
		//that.visible = true;
	});

	function onScrollHandler(event) {
		//window.clearInterval(that.checkScrollID);
		//if (that.visible) {
		var ref = identifyCurrentChapter();//expensive solution
		if (ref && ref.nodeId !== that.currentNodeId) {
			that.currentNodeId = ref.nodeId;
			document.body.dispatchEvent(new CustomEvent(BIBLE.CHG_HEADING, { detail: { reference: ref }}));
		}
		if (document.body.scrollHeight - (window.scrollY + window.innerHeight) <= window.innerHeight) {
			var lastNode = that.rootNode.lastChild;
			var lastChapter = new Reference(lastNode.id.substr(3));
			var nextChapter = that.tableContents.nextChapter(lastChapter);
			if (nextChapter) {
				that.showChapters([nextChapter], true, function() {
					that.checkChapterQueueSize('top');
					//document.addEventListener('scroll', onScrollHandler);
					that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);
				});
			} else {
				//document.addEventListener('scroll', onScrollHandler);
				that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);
			}
		}
		else if (window.scrollY <= window.innerHeight) {
			var saveY = window.scrollY;
			var firstNode = that.rootNode.firstChild;
			var firstChapter = new Reference(firstNode.id.substr(3));
			var beforeChapter = that.tableContents.priorChapter(firstChapter);
			if (beforeChapter) {
				that.showChapters([beforeChapter], false, function() {
					window.scrollTo(10, saveY + beforeChapter.rootNode.scrollHeight);
					that.checkChapterQueueSize('bottom');
					//document.addEventListener('scroll', onScrollHandler);
					that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);
				});
			} else {
				//document.addEventListener('scroll', onScrollHandler);
				that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);
			}
		} else {
			//document.addEventListener('scroll', onScrollHandler);
			that.checkScrollID = window.setTimeout(onScrollHandler, CODEX_VIEW.SCROLL_TIMEOUT);
		}
		//}
	}
	function identifyCurrentChapter() {
		var half = window.innerHeight / 2;
		for (var i=that.rootNode.children.length -1; i>=0; i--) {
			var node = that.rootNode.children[i];
			var top = node.getBoundingClientRect().top;
			if (top < half) {
				return(new Reference(node.id.substr(3)));
			}
		}
		return(null);
	}
};
CodexView.prototype.showChapters = function(chapters, append, callback) {
	var that = this;
	var selectList = [];
	for (var i=0; i<chapters.length; i++) {
		selectList.push(chapters[i].nodeId);
	}
	this.chaptersAdapter.getChapters(selectList, function(results) {
		if (results instanceof IOError) {
			console.log((JSON.stringify(results)));
			callback(results);
		} else {
			for (i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				var reference = new Reference(row.reference);
				reference.rootNode.innerHTML = row.html;
				if (append) {
					that.rootNode.appendChild(reference.rootNode);
				} else {
					that.rootNode.insertBefore(reference.rootNode, that.rootNode.firstChild);
				}
				console.log('added chapter', reference.nodeId);
			}
			callback();
		}
	});
};
CodexView.prototype.checkChapterQueueSize = function(whichEnd) {
	if (this.rootNode.children.length > CODEX_VIEW.MAX) {
		var discard = null;
		switch(whichEnd) {
			case 'top':
				discard = this.rootNode.firstChild;
				break;
			case 'bottom':
				discard = this.rootNode.lastChild;
				break;
			default:
				console.log('unknown end ' + whichEnd + ' in CodexView.checkChapterQueueSize.');
		}
		if (discard) {
			this.rootNode.removeChild(discard);
			console.log('discarded chapter ', discard.id.substr(3), 'at', whichEnd);
		}
	}
};
CodexView.prototype.scrollTo = function(reference) {
	console.log('scrollTo', reference.nodeId);
	var verse = document.getElementById(reference.nodeId);
	if (verse === null) {
		// when null it is probably because verse num was out of range.
		var nextChap = this.tableContents.nextChapter(reference);
		verse = document.getElementById(nextChap.nodeId);
	}
	if (verse) {
		var rect = verse.getBoundingClientRect();
		window.scrollTo(rect.left + window.scrollX, rect.top + window.scrollY - this.statusBarHeight);
	}
};
CodexView.prototype.showFootnote = function(noteId) {
	var note = document.getElementById(noteId);
	for (var i=0; i<note.children.length; i++) {
		var child = note.children[i];
		if (child.nodeName === 'SPAN') {
			child.innerHTML = child.getAttribute('note') + ' ';
		}
	} 
};
CodexView.prototype.hideFootnote = function(noteId) {
	var note = document.getElementById(noteId);
	for (var i=0; i<note.children.length; i++) {
		var child = note.children[i];
		if (child.nodeName === 'SPAN') {
			child.innerHTML = '';
		}
	}
};
