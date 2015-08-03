/**
* This class presents the status bar user interface, and responds to all
* user interactions on the status bar.
*/
var HEADER_BUTTON_HEIGHT = 44;
var HEADER_BAR_HEIGHT = 52;
var STATUS_BAR_HEIGHT = 14;

function HeaderView(tableContents) {
	this.statusBarInHeader = (deviceSettings.platform() === 'ios') ? true : false;

	this.hite = HEADER_BUTTON_HEIGHT;
	this.barHite = (this.statusBarInHeader) ? HEADER_BAR_HEIGHT + STATUS_BAR_HEIGHT : HEADER_BAR_HEIGHT;
	this.tableContents = tableContents;
	this.titleWidth = window.innerWidth - this.hite * 3.5;
	this.titleCanvas = null;
	this.titleGraphics = null;
	this.currentReference = null;
	this.searchField = null;
	this.rootNode = document.getElementById('statusRoot');
	this.labelCell = document.getElementById('labelCell');
	Object.seal(this);
}
HeaderView.prototype.showView = function() {
	var that = this;
	setupBackground(this.hite);
	setupTocButton(this.hite, '#F7F7BB');
	setupHeading(this.hite);
	setupQuestionsButton(this.hite, '#F7F7BB');
	setupSearchButton(this.hite, '#F7F7BB');

	function setupBackground(hite) {
    	var canvas = document.createElement('canvas');
    	canvas.setAttribute('height', that.barHite);
    	var maxSize = (window.innerHeight > window.innerWidth) ? window.innerHeight : window.innerWidth;
    	canvas.setAttribute('width', maxSize);
    	canvas.setAttribute('style', 'position: absolute; top: 0; z-index: -1');
      	var graphics = canvas.getContext('2d');
      	graphics.rect(0, 0, canvas.width, canvas.height);

      	// create radial gradient
      	var vMidpoint = hite / 2;
      	var gradient = graphics.createRadialGradient(238, vMidpoint, 10, 238, vMidpoint, window.innerHeight - hite);
      	// light blue
      	gradient.addColorStop(0, '#8ED6FF');
      	// dark blue
      	gradient.addColorStop(1, '#004CB3');

      	graphics.fillStyle = gradient;
      	graphics.fill();
      	that.rootNode.appendChild(canvas);
	}
	function setupTocButton(hite, color) {
		var canvas = drawTOCIcon(hite, color);
		if (that.statusBarInHeader) {
			canvas.setAttribute('style', 'position: fixed; top: 16px; left: 0');
		} else {
			canvas.setAttribute('style', 'position: fixed; top: 4px; left: 0');
		}
		document.getElementById('tocCell').appendChild(canvas);

		canvas.addEventListener('click', function(event) {
			event.stopImmediatePropagation();
			console.log('toc button is clicked');
			document.body.dispatchEvent(new CustomEvent(BIBLE.SHOW_TOC));
		});
	}
	function setupHeading(hite) {
		that.titleCanvas = document.createElement('canvas');
		that.titleCanvas.setAttribute('id', 'titleCanvas');
		that.titleCanvas.setAttribute('height', hite);
		that.titleCanvas.setAttribute('width', that.titleWidth);
		if (that.statusBarInHeader) {
			that.titleCanvas.setAttribute('style', 'position: fixed; top: 16px; left:' + hite * 1.1 + 'px');			
		} else {
			that.titleCanvas.setAttribute('style', 'position: fixed; top: 4px; left:' + hite * 1.1 + 'px');
		}

		that.titleGraphics = that.titleCanvas.getContext('2d');
		that.titleGraphics.fillStyle = '#000000';
		that.titleGraphics.font = '24pt sans-serif';
		that.titleGraphics.textAlign = 'center';
		that.titleGraphics.textBaseline = 'middle';
		that.titleGraphics.borderStyle = 'solid';

		that.labelCell.appendChild(that.titleCanvas);
		that.titleCanvas.addEventListener('click', function(event) {
			if (that.currentReference) {
				console.log('title bar click', that.currentReference.nodeId);
				document.body.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: that.currentReference.nodeId }}));
			}
		});
	}
	function setupSearchButton(hite, color) {
		var canvas = drawSearchIcon(hite, color);
		if (that.statusBarInHeader) {
			canvas.setAttribute('style', 'position: fixed; top: 16px; right: 0; border: none');			
		} else {
			canvas.setAttribute('style', 'position: fixed; top: 4px; right: 0; border: none');
		}
		document.getElementById('searchCell').appendChild(canvas);

		canvas.addEventListener('click', function(event) {
			event.stopImmediatePropagation();
			console.log('search button is clicked');
			document.body.dispatchEvent(new CustomEvent(BIBLE.SHOW_SEARCH));
		});
	}
	function setupQuestionsButton(hite, color) {
		var canvas = drawQuestionsIcon(hite, color);
		if (that.statusBarInHeader) {
			canvas.setAttribute('style', 'position: fixed; top: 16px; border: none; right: ' + hite * 1.14 + 'px');
		} else {
			canvas.setAttribute('style', 'position: fixed; top: 4px; border: none; right: ' + hite * 1.14 + 'px');
		}
		document.getElementById('questionsCell').appendChild(canvas);

		canvas.addEventListener('click', function(event) {
			event.stopImmediatePropagation();
			console.log('questions button is clicked');
			document.body.dispatchEvent(new CustomEvent(BIBLE.SHOW_QUESTIONS));
		});
	}
};
HeaderView.prototype.setTitle = function(reference) {
	this.currentReference = reference;
	var book = this.tableContents.find(reference.book);
	var text = book.name + ' ' + ((reference.chapter > 0) ? reference.chapter : 1);
	this.titleGraphics.clearRect(0, 0, this.titleWidth, this.hite);
	this.titleGraphics.fillText(text, this.titleWidth / 2, this.hite / 2, this.titleWidth);
};
HeaderView.prototype.showSearchField = function(query) {
	if (! this.searchField) {
		this.searchField = document.createElement('input');
		this.searchField.setAttribute('type', 'text');
		this.searchField.setAttribute('class', 'searchField');
		this.searchField.setAttribute('value', query || '');
		var yPos = (this.hite - 40) / 2; // The 40 in this calculation is a hack.
		var xPos = (this.hite * 1.2);
		this.searchField.setAttribute('style', 'position: fixed; top: ' + yPos + 'px; left: ' + xPos + 'px');
		var that = this;
		this.searchField.addEventListener('keyup', function(event) {
			if (event.keyCode === 13) {
				document.body.dispatchEvent(new CustomEvent(BIBLE.SEARCH_START, { detail: { search: that.searchField.value }}));

			}
		});
	}
	this.changeLabelCell(this.searchField);
};
HeaderView.prototype.showTitleField = function() {
	this.changeLabelCell(this.titleCanvas);
};
HeaderView.prototype.changeLabelCell = function(node) {
	for (var i=this.labelCell.children.length -1; i>=0; i--) {
		this.labelCell.removeChild(this.labelCell.children[i]);
	}
	this.labelCell.appendChild(node);
};
