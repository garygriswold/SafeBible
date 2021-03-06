/**
* This class contains a reference to a chapter or verse.  It is used to
* simplify the transition from the "GEN:1:1" format to the format
* of distinct parts { book: GEN, chapter: 1, verse: 1 }
* This class leaves unset members as undefined.
*
* It is important that chapter is stored as a number, because it is incremented to find next and prior chapters.
* It is also important that verse is stored as a string, because 3:25-26 is a valid verse.
*/
function Reference(book, chapter, verse) {
	if (arguments.length > 1) {
		this.book = book;
		this.chapter = +chapter;
		this.verse = String(verse);
		if (verse) {
			this.nodeId = book + ':' + chapter + ':' + verse;
		} else {
			this.nodeId = book + ':' + chapter;
		}
	} else {
		var parts = book.split(':');
		this.book = parts[0];
		this.chapter = (parts.length > 0) ? +parts[1] : NaN;
		this.verse = (parts.length > 1) ? parts[2] : undefined;
		this.nodeId = book;
	}
	this.chapterId = this.book + ':' + this.chapter;
	Object.freeze(this);
}
Reference.prototype.path = function() {
	return(this.book + '/' + this.chapter + '.usx');
};
Reference.prototype.chapterVerse = function() {
	return((this.verse) ? String(this.chapter) + ':' + this.verse : String(this.chapter));
};
Reference.prototype.append = function(parent, html) {
	var rootNode = document.createElement('div');
	rootNode.setAttribute('id', 'top' + this.nodeId);
	rootNode.innerHTML = html;
	parent.appendChild(rootNode);
};
Reference.prototype.prepend = function(parent, html) {
	var rootNode = document.createElement('div');
	rootNode.setAttribute('id', 'top' + this.nodeId);
	rootNode.innerHTML = html;
	parent.insertBefore(rootNode, parent.firstChild);
};
