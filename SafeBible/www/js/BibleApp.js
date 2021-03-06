"use strict";
/**
* This class initializes the App with the correct Bible versions
* and starts.
* It also contains all of the custom event handler.  This is so they are
* guaranteed to only be created once, even when there are multiple
*/
function AppInitializer() {
	this.controller = null;
	this.langPrefCode = null;
	this.countryCode = null;
	Object.seal(this);
}
AppInitializer.prototype.begin = function() {
	var that = this;
	var settingStorage = new SettingStorage();
	deviceSettings.loadDeviceSettings();
	deviceSettings.locale(function(locale, langCode, scriptCode, countryCode) {
		console.log('user locale ', locale, langCode, countryCode);
		that.langPrefCode = langCode;
		that.countryCode = countryCode;
		var appUpdater = new AppUpdater(settingStorage);
		console.log('START APP UPDATER');
		appUpdater.doUpdate(function() {
			console.log('DONE APP UPDATER');
			var versionsAdapter = new VersionsAdapter();			
		    settingStorage.getCurrentVersion(function(versionFilename) {
			    if (versionFilename) {
				    // Process with User's Version
			    	changeVersionHandler(versionFilename);
			    } else {
					versionsAdapter.defaultVersion(langCode, function(filename) {
						console.log('default version determined ', filename);
						var parts = filename.split('.');
						var versionCode = parts[0]; // This hack requires version code to be part of filename.
						settingStorage.getInstalledVersion(versionCode, function(installedVersion) {
							if (installedVersion) {
								// Process locale's default version installed
								changeVersionHandler(filename);
							} else {
								var downloader = new FileDownloader(versionsAdapter, locale);
								downloader.download(filename, function(error) {
									if (error) {
										console.log(JSON.stringify(error));
										// Process all default version on error
										changeVersionHandler(DEFAULT_VERSION);
									} else {
										// Process locale's default version downloaded
										changeVersionHandler(filename);
									}
								});
							}
						});
					});
				}
			});
		});
	});
    
    document.addEventListener(BIBLE.CHG_VERSION, function(event) {
		changeVersionHandler(event.detail.version);
	});
		
	function changeVersionHandler(versionFilename) {
		console.log('CHANGE VERSION TO', versionFilename);
		var currBible = new BibleVersion(that.langPrefCode, that.countryCode);
		currBible.fill(versionFilename, function() {
			if (that.controller) {
				that.controller.close();
			}
			settingStorage.setCurrentVersion(versionFilename);
			settingStorage.setInstalledVersion(currBible.code, versionFilename, currBible.bibleVersion);
			console.log("Begin AppViewController");
			that.controller = new AppViewController(currBible, settingStorage);
			that.controller.begin();
			console.log('End AppViewController.begin');
			enableHandlersExcept('NONE');
			enableAudioPlayer();		
		});
	}
	function showTocHandler(event) {
		disableHandlers();
		that.controller.clearViews();		
		that.controller.tableContentsView.showView();
		enableHandlersExcept(BIBLE.SHOW_TOC);
	}
	function showSearchHandler(event) {
		disableHandlers();
		that.controller.clearViews();	
		that.controller.searchView.showView();
		enableHandlersExcept(BIBLE.SHOW_SEARCH);
	}		
	function showPassageHandler(event) {
		disableHandlers();
		enableAudioPlayer();
		that.controller.clearViews();
		setTimeout(function() { // delay is needed because with changes from History prior pages can interfere. Consider animation
			that.controller.codexView.showView(event.detail.id);
			enableHandlersExcept('NONE');
			var historyItem = { timestamp: new Date(), reference: event.detail.id, 
				source: 'P', search: event.detail.source };
			that.controller.history.replace(historyItem, function(count) {});
		}, 5); 
	}
	function enableAudioPlayer() {
		callNative('AudioPlayer', 'isPlaying', [], "S", function(playing) {
			console.log("INSIDE IS PLAYING: " + playing);
			if (playing === "F") {
				document.addEventListener(BIBLE.SHOW_AUDIO, startAudioHandler);
			}
		});
	}
	function startAudioHandler(event) {
		document.removeEventListener(BIBLE.SHOW_AUDIO, startAudioHandler);
		document.addEventListener(BIBLE.STOP_AUDIO, stopAudioHandler);
		document.addEventListener(BIBLE.SCROLL_TEXT, animateScrollToHandler);
		var ref = new Reference(event.detail.id);
		callNative('AudioPlayer', 'present', [ref.book, ref.chapter], "N",
			function() {
				console.log("SUCCESSFUL EXIT FROM AudioPlayer");
				document.removeEventListener(BIBLE.STOP_AUDIO, stopAudioHandler);
				document.removeEventListener(BIBLE.SCROLL_TEXT, animateScrollToHandler);
				document.addEventListener(BIBLE.SHOW_AUDIO, startAudioHandler);
			}
		);	
	}
	function stopAudioHandler(event) {
		document.removeEventListener(BIBLE.STOP_AUDIO, stopAudioHandler);
		document.removeEventListener(BIBLE.SCROLL_TEXT, animateScrollToHandler);
		document.addEventListener(BIBLE.SHOW_AUDIO, startAudioHandler);
		callNative('AudioPlayer', 'stop', [], "E", function(error) {
			console.log("SUCCESSFUL STOP OF AudioPlayer");			
		});		
	}
	function animateScrollToHandler(event) {
		var nodeId = event.detail.id;
		console.log('animateScrollTo', nodeId);
		var verse = document.getElementById(nodeId);
		if (verse) {
			var rect = verse.getBoundingClientRect();
			TweenMax.killTweensOf(window);
			var yPosition = rect.top + window.scrollY - that.controller.header.barHite;
			TweenMax.to(window, 0.7, {scrollTo: { y: yPosition, autoKill: false }});
		}
	}
	function showVideoListHandler(event) {
		disableHandlers();
		that.controller.clearViews();
		that.controller.videoListView.showView();
		enableHandlersExcept(BIBLE.SHOW_VIDEO);
	}
	function showSettingsHandler(event) {
		disableHandlers();
		that.controller.clearViews();
		that.controller.settingsView.showView();
		enableHandlersExcept(BIBLE.SHOW_SETTINGS);
	}	
	function disableHandlers() {
		document.removeEventListener(BIBLE.SHOW_TOC, showTocHandler);
		document.removeEventListener(BIBLE.SHOW_SEARCH, showSearchHandler);
		document.removeEventListener(BIBLE.SHOW_PASSAGE, showPassageHandler);
		document.removeEventListener(BIBLE.SHOW_VIDEO, showVideoListHandler);
		document.removeEventListener(BIBLE.SHOW_SETTINGS, showSettingsHandler);
	}
	function enableHandlersExcept(name) {
		if (name !== BIBLE.SHOW_TOC) document.addEventListener(BIBLE.SHOW_TOC, showTocHandler);
		if (name !== BIBLE.SHOW_SEARCH) document.addEventListener(BIBLE.SHOW_SEARCH, showSearchHandler);
		if (name !== BIBLE.SHOW_PASSAGE) document.addEventListener(BIBLE.SHOW_PASSAGE, showPassageHandler);
		if (name !== BIBLE.SHOW_VIDEO) document.addEventListener(BIBLE.SHOW_VIDEO, showVideoListHandler);
		if (name !== BIBLE.SHOW_SETTINGS) document.addEventListener(BIBLE.SHOW_SETTINGS, showSettingsHandler);
	}
};/**
* BibleApp is a global object that contains pointers to all of the key elements of
* a user's session with the App.
*/
var BIBLE = { CHG_VERSION: 'bible-chg-version', 
		SHOW_TOC: 'bible-show-toc', // present toc page, create if needed
		SHOW_SEARCH: 'bible-show-search', // present search page, create if needed
		SHOW_AUDIO: 'bible-show-audio', // present audio overlay above text
		STOP_AUDIO: 'bible-stop-audio', // stop audio that is now playing
		SHOW_HISTORY: 'bible-show-history', // present history tabs
		HIDE_HISTORY: 'bible-hide-history', // hide history tabs
		SHOW_PASSAGE: 'bible-show-passage', // show passage in codex view
		SHOW_SETTINGS: 'bible-show-settings', // show settings view
		CHG_HEADING: 'bible-chg-heading', // change title at top of page as result of user scrolling
		SHOW_NOTE: 'bible-show-note', // Show footnote as a result of user action
		HIDE_NOTE: 'bible-hide-note', // Hide footnote as a result of user action
		SHOW_VIDEO: 'bible-show-video', // Show Video List view as a result of user action
		SCROLL_TEXT: 'bible-scroll-text' // Scroll Text as when listening to audio
	};
var DEFAULT_VERSION = 'ERV-ENG.db'; // This version must be preinstalled in the App.

function bibleShowNoteClick(nodeId) {
	console.log('show note clicked', nodeId);
	event.stopImmediatePropagation();
	var node = document.getElementById(nodeId);
	if (node) {
		document.dispatchEvent(new CustomEvent(BIBLE.SHOW_NOTE, { detail: { id: node }}));
		node.setAttribute('onclick', "bibleHideNoteClick('" + nodeId + "');");
	}
}
function bibleHideNoteClick(nodeId) {
	console.log('hide note clicked', nodeId);
	event.stopImmediatePropagation();
	var node = document.getElementById(nodeId);
	if (node) {
		document.dispatchEvent(new CustomEvent(BIBLE.HIDE_NOTE, { detail: { id: node }}));
		node.setAttribute('onclick', "bibleShowNoteClick('" + nodeId + "');");
	}
}

function AppViewController(version, settingStorage) {
	this.version = version;
	var dynamicCSS = new DynamicCSS();
	dynamicCSS.setDirection(this.version.direction);
	
	this.settingStorage = settingStorage;
	
	this.database = new DatabaseHelper(version.filename, true);
	this.chapters = new ChaptersAdapter(this.database);
    this.verses = new VersesAdapter(this.database);
	this.tableAdapter = new TableContentsAdapter(this.database);
	this.concordance = new ConcordanceAdapter(this.database);
	this.history = new HistoryAdapter(this.settingStorage.database);
	
	this.videoAdapter = new VideoTableAdapter();
}
AppViewController.prototype.begin = function(develop) {
	this.tableContents = new TOC(this.tableAdapter);
	this.concordance = new Concordance(this.concordance);
	var that = this;
	this.tableContents.fill(function() { // must complete before codexView.showView()
		console.log('loaded toc', that.tableContents.size());
		that.copyrightView = new CopyrightView(that.version);
		that.localizeNumber = new LocalizeNumber(that.version.silCode);
		that.header = new HeaderView(that.tableContents, that.version, that.localizeNumber, that.videoAdapter);
		that.tableContentsView = new TableContentsView(that.tableContents, that.copyrightView, that.localizeNumber);
		that.tableContentsView.rootNode.style.top = that.header.barHite + 'px';  // Start view at bottom of header.
		that.searchView = new SearchView(that.tableContents, that.concordance, that.verses, that.history, that.version, that.localizeNumber);
		that.searchView.rootNode.style.top = that.header.barHite + 'px';  // Start view at bottom of header.
		that.codexView = new CodexView(that.chapters, that.tableContents, that.header.barHite, that.copyrightView);
		that.historyView = new HistoryView(that.history, that.tableContents, that.localizeNumber);
		that.historyView.rootNode.style.top = that.header.barHite + 'px';
		that.settingsView = new SettingsView(that.settingStorage, that.verses, that.version);
		that.settingsView.rootNode.style.top = that.header.barHite + 'px';  // Start view at bottom of header.
		that.videoListView = new VideoListView(that.version, that.videoAdapter);
		that.videoListView.rootNode.style.top = that.header.barHite + 'px';
		that.touch = new Hammer(document.getElementById('codexRoot'));
		setInitialFontSize();
		Object.seal(that);
		that.header.showView();

		switch(develop) {
		case 'TableContentsView':
			that.tableContentsView.showView();
			break;
		case 'SearchView':
			that.searchView.showView('risen');
			break;
		case 'HistoryView':
			that.historyView.showView();
			break;
		case 'SettingsView':
			that.settingsView.showView();
			break;
		case 'VersionsView':
			that.versionsView.showView();
			break;
		default:
			that.history.lastItem(function(lastItem) {
				if (lastItem instanceof IOError || lastItem === null || lastItem === undefined) {
					that.codexView.showView('JHN:3');
				} else {
					var book = lastItem.split(':')[0];
					if (that.tableContents.find(book)) {
						console.log('LastItem' + JSON.stringify(lastItem));
						that.codexView.showView(lastItem);
					} else {
						that.codexView.showView('JHN:3');
					}
				}
			});
		}
		/* Turn off user selection, and selection popup */
		document.documentElement.style.webkitTouchCallout = 'none';
        document.documentElement.style.webkitUserSelect = 'none';

		document.addEventListener(BIBLE.SHOW_NOTE, function(event) {
			that.codexView.showFootnote(event.detail.id);
		});
		document.addEventListener(BIBLE.HIDE_NOTE, function(event) {
			that.codexView.hideFootnote(event.detail.id);
		});
		that.touch.on("panright", function(event) {
			if (that.version.hasHistory && event.deltaX > 4 * Math.abs(event.deltaY)) {
				that.historyView.showView();
			}
		});
		that.touch.on("panleft", function(event) {
			if (-event.deltaX > 4 * Math.abs(event.deltaY)) {
				that.historyView.hideView();
			}
		});
	});
	function setInitialFontSize() {
		that.settingStorage.getFontSize(function(fontSize) {
			if (fontSize == null) {
				fontSize = '16';
			}
			document.documentElement.style.fontSize = fontSize + 'pt';			
		});
	}
};
AppViewController.prototype.clearViews = function() {
	this.tableContentsView.hideView();
	this.searchView.hideView();
	this.codexView.hideView();
	this.videoListView.hideView();
	this.settingsView.hideView();
	this.historyView.hideView();
};
AppViewController.prototype.close = function() {
	console.log('CLOSE ', (this.version) ? this.version.code : 'none');
	this.touch = null;
	// remove dom
	for (var i=document.body.children.length -1; i>=0; i--) {
		document.body.removeChild(document.body.children[i]);
	}
	// close database
	if (this.database) {
		this.database.close();
		this.database = null;
	}
	// views
	this.header = null;
	this.tableContentsView = null;
	this.searchView = null;
	this.codexView = null;
	this.historyView = null;
	this.settingsView = null;
	this.videoListView = null;
	this.copyrightView = null;
	// model
	this.tableContents = null;
	this.concordance = null;
};
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

/**
* NOTE: This is a global method, not a class method, because it
* is called by the event handler created in createCopyrightNotice.
*/
var COPYRIGHT_VIEW = null;

function addCopyrightViewNotice(event) {
	event.stopImmediatePropagation();
	var target = event.target.parentNode;
	target.appendChild(COPYRIGHT_VIEW);
	
	var rect = target.getBoundingClientRect();
	if (window.innerHeight < rect.top + rect.height) {
		// Scrolls notice up when text is not in view.
		// limits scroll to rect.top so that top remains in view.
		window.scrollBy(0, Math.min(rect.top, rect.top + rect.height - window.innerHeight));	
	}
}
/**
* This class is used to create the copyright notice that is put 
* at the bottom of each chapter, and the learn more page that appears
* when that is clicked.
*/
function CopyrightView(version) {
	this.version = version;
	this.copyrightNotice = this.createCopyrightNotice();
	COPYRIGHT_VIEW = this.createAttributionView();
	Object.seal(this);
}
CopyrightView.prototype.createCopyrightNotice = function() {
	var html = [];
	html.push('<p><span class="copyright">');
	html.push(this.version.copyright, '</span>');
	html.push('<span class="copylink" onclick="addCopyrightViewNotice(event)"> \u261E </span>', '</p>');
	return(html.join(''));
};
CopyrightView.prototype.createCopyrightNoticeDOM = function() {
	var root = document.createElement('p');
	var dom = new DOMBuilder();
	dom.addNode(root, 'span', 'copyright', this.version.copyright);
	var link = dom.addNode(root, 'span', 'copylink', ' \u261E ');
	link.addEventListener('click',  addCopyrightViewNotice);	
	return(root);
};
CopyrightView.prototype.createTOCTitleDOM = function() {
	if (this.version.ownerCode === 'WBT') {
		var title = this.version.localLanguageName;
		var abbrev = ' (' + this.version.silCode + ')';
	} else {
		title = this.version.localVersionName;
		//abbrev = this.version.versionAbbr;
	}
	var root = document.createElement('p');
	var dom = new DOMBuilder();
	dom.addNode(root, 'span', 'copyTitle', title);
	//dom.addNode(root, 'span', 'copyAbbr', abbrev);
	return(root);
};
/**
* Language (lang code), Translation Name (trans code),
* Copyright C year, Organization,
* Organization URL, link image
*/
CopyrightView.prototype.createAttributionView = function() {
	var dom = new DOMBuilder();
	var root = document.createElement('div');
	root.setAttribute('id', 'attribution');
	
	var closeIcon = drawCloseIcon(24, '#777777');
	closeIcon.setAttribute('id', 'closeIcon');
	root.appendChild(closeIcon);
	closeIcon.addEventListener('click', function(event) {
		if (root && root.parentNode) {
			root.parentNode.removeChild(root);
		}
	});
	
	if (this.version.introduction) {
		var intro = dom.addNode(root, 'div', 'attribCopy');
		intro.innerHTML = this.version.introduction;
	} else {
		var copyNode = dom.addNode(root, 'div', 'attribCopy');
		dom.addNode(copyNode, 'span', null, this.version.copyright);
	}
	
	/*
	* Temporarily remove until, I can provide secure way to use link
	var webAddress = 'http://' + this.version.ownerURL + '/';
	var link = dom.addNode(root, 'p', 'attribLink', webAddress);
	link.addEventListener('click', function(event) {
		cordova.InAppBrowser.open(webAddress, '_blank', 'location=yes');
	});
	*/
	return(root);
};

/**
* This class provides the user interface to display history as tabs,
* and to respond to user interaction with those tabs.
*/
var TAB_STATE = { HIDDEN:0, SHOW:1, VISIBLE:2, HIDE:3 };

function HistoryView(historyAdapter, tableContents, localizeNumber) {
	this.historyAdapter = historyAdapter;
	this.tableContents = tableContents;
	this.localizeNumber = localizeNumber;
	this.tabState = TAB_STATE.HIDDEN;
	this.viewRoot = null;
	this.rootNode = document.createElement('div');
	this.rootNode.id = 'historyRoot';
	document.body.appendChild(this.rootNode);
	this.historyTabStart = '';
	Object.seal(this);
}
HistoryView.prototype.showView = function(callback) {
	if (this.tabState === TAB_STATE.HIDE) {
		TweenMax.killTweensOf(this.rootNode);
	}
	if (this.tabState === TAB_STATE.HIDDEN || this.tabState === TAB_STATE.HIDE) {
		this.tabState = TAB_STATE.SHOW;
		var that = this;
		if (this.viewRoot) {
		 	if (this.historyAdapter.lastSelectCurrent) {
		 		animateShow();
		 	} else {
				this.rootNode.removeChild(this.viewRoot);
				this.buildHistoryView(function(result) {
					installView(result);
				});
			}
		} else {
			this.buildHistoryView(function(result) {
				installView(result);
			});
		}
	}

	function installView(root) {
		that.viewRoot = root;
		that.rootNode.appendChild(that.viewRoot);
		that.historyTabStart = '-' + String(Math.ceil(root.getBoundingClientRect().width)) + 'px';
		animateShow();
	}
	function animateShow() {
		TweenMax.set(that.rootNode, { left: that.historyTabStart });
		TweenMax.to(that.rootNode, 0.7, { left: "0px", onComplete: animateComplete });		
	}
	function animateComplete() {
		that.tabState = TAB_STATE.VISIBLE;
	}
};
HistoryView.prototype.hideView = function() {
	if (this.tabState === TAB_STATE.SHOW) {
		TweenMax.killTweensOf(this.rootNode);
	}
	if (this.tabState === TAB_STATE.VISIBLE || this.tabState === TAB_STATE.SHOW) {
		this.tabState = TAB_STATE.HIDE;
		var that = this;
		TweenMax.to(this.rootNode, 0.7, { left: this.historyTabStart, onComplete: animateComplete });
	}
	
	function animateComplete() {
		TweenMax.set(that.rootNode, { left: '-1000px' });
		that.tabState = TAB_STATE.HIDDEN;
	}
};
HistoryView.prototype.buildHistoryView = function(callback) {
	var that = this;
	var root = document.createElement('ul');
	root.setAttribute('id', 'historyTabBar');
	this.historyAdapter.selectPassages(function(results) {
		if (results instanceof IOError) {
			callback(root);
		} else {
			for (var i=0; i<results.length; i++) {
				var historyNodeId = results[i];
				var content = generateReference(historyNodeId);
				if (content) {
					var tab = document.createElement('li');
					tab.setAttribute('class', 'historyTab');
					root.appendChild(tab);
	
					var btn = document.createElement('button');
					btn.setAttribute('id', 'his' + historyNodeId);
					btn.setAttribute('class', 'historyTabBtn');
					btn.textContent = content;
					tab.appendChild(btn);
					btn.addEventListener('click', function(event) {
						console.log('btn clicked', this.id);
						var nodeId = this.id.substr(3);
						document.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: nodeId }}));
						that.hideView();
					});
				}
			}
			callback(root);
		}
	});

	function generateReference(nodeId) {
		var ref = new Reference(nodeId);
		var book = that.tableContents.find(ref.book);
		return((book) ? book.abbrev + ' ' + that.localizeNumber.toHistLocal(ref.chapterVerse()) : null);
	}
};

/**
* This class provides the User Interface part of the concordance and search capabilities of the app.
* It does a lazy create of all of the objects needed.
* Each presentation of a searchView presents its last state and last found results.
*/
function SearchView(toc, concordance, versesAdapter, historyAdapter, version, localizeNumber) {
	this.toc = toc;
	this.concordance = concordance;
	this.versesAdapter = versesAdapter;
	this.historyAdapter = historyAdapter;
	this.version = version;
	this.localizeNumber = localizeNumber;
	this.query = null;
	this.lookup = new Lookup(toc);
	this.words = [];
	this.bookList = {};
	this.viewRoot = null;
	this.rootNode = document.createElement('div');
	this.rootNode.id = 'searchRoot';
	document.body.appendChild(this.rootNode);
	this.stopIcon = new StopIcon('#FF0000');
	this.scrollPosition = 0;
	this.searchField = null;
	Object.seal(this);
}
SearchView.prototype.showView = function() {
	document.body.style.backgroundColor = '#FFF';
	if (this.searchField === null) {
		this.searchField = this.showSearchField();
	}
	this.rootNode.appendChild(this.searchField);
	 
	if (this.viewRoot) {
		this.rootNode.appendChild(this.viewRoot);
		window.scrollTo(10, this.scrollPosition);
	} else {
		var that = this;
		this.historyAdapter.lastConcordanceSearch(function(lastSearch) {
			if (lastSearch instanceof IOError || lastSearch === null) {
				console.log('Nothing to search for, display blank page');
			} else {
				that.searchField.children[0].value = lastSearch;
				that.startSearch(lastSearch);
			}
		});
	}
};
SearchView.prototype.hideView = function() {
	if (this.rootNode.children.length > 0) {
		this.scrollPosition = window.scrollY;
		for (var i=this.rootNode.children.length -1; i>=0; i--) {
			this.rootNode.removeChild(this.rootNode.children[i]);
		}
	}
	this.stopIcon.hideIcon();
};
SearchView.prototype.startSearch = function(query) {
	this.query = query;
	console.log('Create new search page', query);
	if (! this.lookup.find(query)) {
		this.showSearch(query);
		for (var i=this.rootNode.children.length -1; i>=1; i--) { // remove viewRoot if present
			this.rootNode.removeChild(this.rootNode.children[i]);
		}
		this.rootNode.appendChild(this.viewRoot);
		window.scrollTo(10, 0);
	}
};
SearchView.prototype.showSearchField = function() {
	var searchField = document.createElement('div');
	searchField.setAttribute('class', 'searchBorder');
	var wid = window.innerWidth * 0.75;
	searchField.setAttribute('style', 'width:' + wid + 'px');
	searchField.setAttribute('style', 'padding:3px 5px');
	
	var inputField = document.createElement('input');
	inputField.setAttribute('type', 'text');
	inputField.setAttribute('class', 'searchField');
	inputField.setAttribute('style', 'width:' + (wid - 10) + 'px');
	
	searchField.appendChild(inputField);
	var that = this;
	inputField.addEventListener('keyup', function(event) {
		if (event.keyCode === 13) {
			callNative('Utility', 'hideKeyboard', [], "S", function(hidden) {
				console.log("Keyboard did hide " + hidden);
			});
			that.startSearch(this.value.trim());
		}
	});
	return(searchField);
};
SearchView.prototype.showSearch = function(query) {
	var that = this;
	this.viewRoot = document.createElement('div');
	//if (this.version.silCode === 'cnm') {
	if (this.version.langCode === 'zh' || this.version.langCode === 'th') {
		this.words = query.split('');
	} else {
		this.words = query.split(' ');
	}
	this.concordance.search2(this.words, function(refList) {
		if (refList instanceof IOError) {
			console.log('SEARCH RETURNED ERROR', JSON.stringify(refList));
			that.stopIcon.showIcon();
		} else if (refList.length === 0) {
			that.stopIcon.showIcon();
		} else {
			that.stopIcon.hideIcon();
			that.bookList = refListsByBook(refList);
			var selectList = selectListWithLimit(that.bookList);
			var selectMap = that.prepareSelect(selectList);
			that.versesAdapter.getVerses(Object.keys(selectMap), function(results) {
				if (results instanceof IOError) {
					that.stopIcon.showIcon();
				} else {
					var priorBook = null;
					var bookNode = null;
					for (var i=2; i<results.length; i++) {
						var row = results[i].split("|");
						var nodeId = row[0];
						var verseText = row[1];
						var reference = new Reference(nodeId);
						var bookCode = reference.book;
						if (bookCode !== priorBook) {
							if (priorBook) {
								var priorList = that.bookList[priorBook];
								if (priorList && priorList.length > 3) {
									that.appendSeeMore(bookNode, priorBook);
								}
							}
							bookNode = that.appendBook(bookCode);
							priorBook = bookCode;
						}
						that.appendReference(bookNode, reference, verseText, selectMap[nodeId]);
					}
				}
			});
		}
	});
	function refListsByBook(refList) {
		var bookList = {};
		for (var i=0; i<refList.length; i++) {
			var bookCode = refList[i][0].substr(0, 3);
			if (bookList[bookCode] === undefined) {
				bookList[bookCode] = [ refList[i] ];
			} else {
				bookList[bookCode].push(refList[i]);
			}
		}
		Object.freeze(bookList);
		return(bookList);
	}
	function selectListWithLimit(bookList) {
		var selectList = [];
		var books = Object.keys(bookList);
		for (var i=0; i<books.length; i++) {
			var refList = bookList[books[i]];
			for (var j=0; j<refList.length && j<3; j++) {
				selectList.push(refList[j]);
			}
		}
		Object.freeze(selectList);
		return(selectList);
	}
};
SearchView.prototype.appendBook = function(bookCode) {
	var book = this.toc.find(bookCode);
	var bookNode = document.createElement('p');
	bookNode.setAttribute('id', 'con' + bookCode);
	this.viewRoot.appendChild(bookNode);
	var titleNode = document.createElement('span');
	titleNode.setAttribute('class', 'conBook');
	var tocBook = this.toc.find(bookCode);
	titleNode.textContent = tocBook.name;
	bookNode.appendChild(titleNode);
	bookNode.appendChild(document.createElement('hr'));
	return(bookNode);
};
SearchView.prototype.appendReference = function(bookNode, reference, verseText, refList) {
	var that = this;
	var entryNode = document.createElement('p');
	entryNode.setAttribute('id', 'con' + reference.nodeId);
	bookNode.appendChild(entryNode);
	var refNode = document.createElement('span');
	refNode.setAttribute('class', 'conRef');
	refNode.textContent = this.localizeNumber.toLocal(reference.chapterVerse());
	entryNode.appendChild(refNode);
	entryNode.appendChild(document.createElement('br'));

	var verseNode = document.createElement('span');
	verseNode.setAttribute('class', 'conVerse');
	verseNode.innerHTML = styleSearchWords(verseText, refList);
	entryNode.appendChild(verseNode);
	entryNode.addEventListener('click', function(event) {
		var nodeId = this.id.substr(3);
		console.log('open chapter', nodeId);
		document.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: nodeId, source: that.query }}));
	});

	function styleSearchWords(verseText, refList) {
		var parts = refList[0].split(';');
		var wordPosition = null;
		var verseWords = null;
		if (that.version.silCode === 'cnm') {
			wordPosition = parseInt(parts[1] - 2);
			verseWords = verseText.split('');
		} else {
			wordPosition = parseInt(parts[1]) * 2 - 3;
			verseWords = verseText.split(/\b/); // Non-destructive, preserves all characters
		}
		if (wordPosition < 0) wordPosition = 0;
		
		var searchWords = verseWords.map(function(wrd) {
			return(wrd.toLocaleLowerCase());
		});
		
		for (var i=0; i<that.words.length; i++) {
			var word = that.words[i];
			var wordNum = searchWords.indexOf(word.toLocaleLowerCase(), wordPosition);
			if (wordNum >= 0) {
				verseWords[wordNum] = '<span class="conWord">' + verseWords[wordNum] + '</span>';
				wordPosition = wordNum;
			}
		}
		return(verseWords.join(''));
	}
};
SearchView.prototype.appendSeeMore = function(bookNode, bookCode) {
	var that = this;
	var entryNode = document.createElement('p');
	entryNode.setAttribute('id', 'mor' + bookCode);
	entryNode.setAttribute('class', 'conMore');
	entryNode.textContent = String.fromCharCode(183) + String.fromCharCode(183) + String.fromCharCode(183);
	bookNode.appendChild(entryNode);
	entryNode.addEventListener('click', function(event) {
		var moreNode = document.getElementById(this.id);
		var parentNode = moreNode.parentNode;
		parentNode.removeChild(moreNode);

		var bookCode = this.id.substr(3);
		var bookNode = document.getElementById('con' + bookCode);
		var refList = that.bookList[bookCode];
		var selectMap = that.prepareSelect(refList);

		that.versesAdapter.getVerses(Object.keys(selectMap), function(results) {
			if (results instanceof IOError) {
				// display some error graphic?
			} else {
				for (var i=5; i<results.length; i++) { // skip 2 meta data rows and first 3 results
					var row = results[i].split("|");
					var nodeId = row[0];
					var verseText = row[1];
					var reference = new Reference(nodeId);
					that.appendReference(bookNode, reference, verseText, selectMap[nodeId]);
				}
			}
		});
	});
};
/**
* This is a private method which takes a list of search results and returns a
* list of verses to be selected.  This method is declare public only because it is
* used by two other methods.
*/
SearchView.prototype.prepareSelect = function(refList) {
	var searchMap = {};
	for (var i=0; i<refList.length; i++) {
		var first = refList[i][0];
		var parts = first.split(';');
		searchMap[parts[0]] = refList[i]; // When a search find multiple words in the same verse, this discards all but the last.
	}
	return(searchMap);
};
/**
* This class presents the status bar user interface, and responds to all
* user interactions on the status bar.
*/
var HEADER_BUTTON_HEIGHT = 32;
var HEADER_BAR_HEIGHT = 40;
var STATUS_BAR_HEIGHT = 18;//14;
var PHONEX_STATUS_BAR_HEIGHT = 36;//26;
var CELL_SPACING = 5;

function HeaderView(tableContents, version, localizeNumber, videoAdapter) {
	this.hite = HEADER_BUTTON_HEIGHT;
	
	if (deviceSettings.platform() == 'ios') {
		if (deviceSettings.model() == 'iPhone X') {
			this.barHite = HEADER_BAR_HEIGHT + PHONEX_STATUS_BAR_HEIGHT;
			this.cellTopPadding = 'padding-top:' + PHONEX_STATUS_BAR_HEIGHT + 'px';
		} else {
			this.barHite = HEADER_BAR_HEIGHT + STATUS_BAR_HEIGHT;
			this.cellTopPadding = 'padding-top:' + STATUS_BAR_HEIGHT + 'px';			
		}
	} else {
		this.barHite = HEADER_BAR_HEIGHT + 5;
		this.cellTopPadding = 'padding-top:5px';			
	}
	this.tableContents = tableContents;
	this.version = version;
	this.localizeNumber = localizeNumber;
	this.videoAdapter = videoAdapter;
	this.titleCanvas = null;
	this.titleGraphics = null;
	this.titleStartX = null;
	this.titleWidth = null;
	this.currentReference = null;
	this.rootNode = document.createElement('table');
	this.rootNode.id = 'statusRoot';
	this.rootNode.setAttribute('style', 'height:' + this.barHite + 'px');
	document.body.appendChild(this.rootNode);
	this.rootRow = document.createElement('tr');
	this.rootNode.appendChild(this.rootRow);
	this.labelCell = document.createElement('td');
	this.labelCell.id = 'labelCell';
	this.audioNode = null;
	this.audioForBook = false;
	document.addEventListener(BIBLE.CHG_HEADING, drawTitleHandler);
	Object.seal(this);
	var that = this;
	
	function drawTitleHandler(event) {
		if (that.titleGraphics == null) return;
		document.removeEventListener(BIBLE.CHG_HEADING, drawTitleHandler);
		console.log('caught set title event', JSON.stringify(event.detail.reference.nodeId));
		that.currentReference = event.detail.reference;
		
		if (that.currentReference) {
			var book = that.tableContents.find(that.currentReference.book);
			if (book) {
				var text = book.heading + ' ' + that.localizeNumber.toHistLocal(that.currentReference.chapter);
				that.titleGraphics.clearRect(0, 0, that.titleCanvas.width, that.hite);
				that.titleGraphics.fillText(text, that.titleCanvas.width / 2, that.hite / 2, that.titleCanvas.width);
				that.titleWidth = that.titleGraphics.measureText(text).width + 10;
				that.titleStartX = (that.titleCanvas.width - that.titleWidth) / 2;
				roundedRect(that.titleGraphics, that.titleStartX, 0, that.titleWidth, that.hite, 7);
			}
			if (that.audioNode !== null) {
				if (that.version.hasAudioBook(that.currentReference.book)) {
					if (! that.audioForBook) {
						that.audioForBook = true;
						TweenLite.fromTo(that.audioNode , 1.0, {opacity:0}, {opacity:1.0, display:'table-cell'});
					}
				} else {
					if (that.audioForBook) {
						that.audioForBook = false;
						TweenLite.fromTo(that.audioNode , 1.0, {opacity:1.0}, {opacity:0, display:'none'});
					}
				}
			}
		}
		document.addEventListener(BIBLE.CHG_HEADING, drawTitleHandler);
	}
	function roundedRect(ctx, x, y, width, height, radius) {
	  ctx.beginPath();
	  ctx.moveTo(x,y+radius);
	  ctx.lineTo(x,y+height-radius);
	  ctx.arcTo(x,y+height,x+radius,y+height,radius);
	  ctx.lineTo(x+width-radius,y+height);
	  ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);
	  ctx.lineTo(x+width,y+radius);
	  ctx.arcTo(x+width,y,x+width-radius,y,radius);
	  ctx.lineTo(x+radius,y);
	  ctx.arcTo(x,y,x,y+radius,radius);
	  ctx.stroke();
	}
}
HeaderView.prototype.showView = function() {
	var that = this;

	var menuWidth = setupIconImgButton('tocCell', 'img/MenuIcon128.png', that.hite, BIBLE.SHOW_TOC);
	var serhWidth = setupIconImgButton('searchCell', 'img/SearchIcon128.png', that.hite, BIBLE.SHOW_SEARCH);
	that.rootRow.appendChild(that.labelCell);
	
	var audioWidth = setupIconImgButton('audioCell', 'img/SoundIcon128.png', that.hite, BIBLE.SHOW_AUDIO);
	that.audioNode = document.getElementById('audioCell');
	var videoWidth = setupIconImgButton('videoCell', 'img/ScreenIcon128.png', that.hite, BIBLE.SHOW_VIDEO);
	var settWidth = setupIconImgButton('settingsCell', 'img/SettingsIcon128.png', that.hite, BIBLE.SHOW_SETTINGS);
	var avalWidth = (window.innerWidth * 0.88) - (menuWidth + serhWidth + audioWidth + videoWidth + settWidth);
	
	callNative('AudioPlayer', 'findAudioVersion', [that.version.code, that.version.silCode], "S", function(bookIdList) {
		console.log("VERSION: " + that.version.code + "  SIL: " + that.version.silCode + "  BOOKLIST: " + bookIdList);
		that.version.audioBookIdList = bookIdList;
	});
	
	that.titleCanvas = document.createElement('canvas');
	drawTitleField(that.titleCanvas, that.hite, avalWidth);
	that.labelCell.appendChild(that.titleCanvas);

	function drawTitleField(canvas, hite, avalWidth) {
		canvas.setAttribute('id', 'titleCanvas');
		canvas.setAttribute('height', hite);
		canvas.setAttribute('width', avalWidth);
		canvas.setAttribute('style', that.cellTopPadding);
		that.titleGraphics = canvas.getContext('2d');
		
		that.titleGraphics.fillStyle = '#1b2f76';
		that.titleGraphics.font = '18pt sans-serif';
		that.titleGraphics.textAlign = 'center';
		that.titleGraphics.textBaseline = 'middle';
		that.titleGraphics.strokeStyle = '#1b2f76';
		that.titleGraphics.lineWidth = 0.5;

		that.titleCanvas.addEventListener('click', function(event) {
			event.stopImmediatePropagation();
			if (that.currentReference && event.offsetX > that.titleStartX && event.offsetX < (that.titleStartX + that.titleWidth)) {
				document.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: that.currentReference.nodeId }}));
			}
		});
	}
	function setupIconImgButton(parentCell, iconFilename, hite, eventType) {
		var canvas = document.createElement('img');
		canvas.setAttribute('src', iconFilename);
		canvas.setAttribute('style', that.cellTopPadding);
		canvas.setAttribute('height', hite);
		canvas.setAttribute('width', hite);
		var parent = document.createElement('td');
		parent.id = parentCell;
		that.rootRow.appendChild(parent);
		parent.appendChild(canvas);
		parent.addEventListener('click', function(event) {
			event.stopImmediatePropagation();
			console.log('clicked', parentCell);
			document.dispatchEvent(new CustomEvent(eventType, { detail: { id: that.currentReference.nodeId }}));
		});
		return(canvas.width);
	}
};
/**
* This class presents the table of contents, and responds to user actions.
*/
function TableContentsView(toc, copyrightView, localizeNumber) {
	this.toc = toc;
	this.copyrightView = copyrightView;
	this.localizeNumber = localizeNumber;
	this.root = null;
	this.dom = new DOMBuilder();
	this.rootNode = this.dom.addNode(document.body, 'div', null, null, 'tocRoot');
	this.scrollPosition = 0;
	this.numberNode = document.createElement('span');
	this.numberNode.textContent = '0123456789';
	this.numberNode.setAttribute('style', "position: absolute; float: left; white-space: nowrap; visibility: hidden; font-family: sans-serif; font-size: 1.0rem");
	document.body.appendChild(this.numberNode);
	Object.seal(this);
}
TableContentsView.prototype.showView = function() {
	document.body.style.backgroundColor = '#FFF';
	if (! this.root) {
		this.root = this.buildTocBookList();
	}
	if (this.rootNode.children.length < 1) {
		this.rootNode.appendChild(this.root);
		window.scrollTo(0, this.scrollPosition);
	}
};
TableContentsView.prototype.hideView = function() {
	if (this.rootNode.children.length > 0) {
		this.scrollPosition = window.scrollY; // save scroll position till next use.
		for (var i=this.rootNode.children.length -1; i>=0; i--) {
			this.rootNode.removeChild(this.rootNode.children[i]);
		}
	}
};
TableContentsView.prototype.buildTocBookList = function() {
	var that = this;
	var div = document.createElement('div');
	div.setAttribute('id', 'toc');
	div.setAttribute('class', 'tocPage');
	div.appendChild(this.copyrightView.createTOCTitleDOM());
	for (var i=0; i<this.toc.bookList.length; i++) {
		var book = this.toc.bookList[i];
		var bookNode = that.dom.addNode(div, 'p', 'tocBook', book.name, 'toc' + book.code);
		
		var that = this;
		bookNode.addEventListener('click', function(event) {
			var bookCode = this.id.substring(3);
			that.showTocChapterList(bookCode);
		});
	}
	div.appendChild(this.copyrightView.createCopyrightNoticeDOM());
	return(div);
};
TableContentsView.prototype.showTocChapterList = function(bookCode) {
	var that = this;
	var book = this.toc.find(bookCode);
	if (book) {
		if (book.lastChapter && book.lastChapter > 0) {
			var root = document.createDocumentFragment();
			var table = that.dom.addNode(root, 'table', 'tocChap');
			var numCellPerRow = cellsPerRow();
			var numRows = Math.ceil((book.lastChapter + 1) / numCellPerRow);
			var chaptNum = 0;
			for (var r=0; r<numRows; r++) {
				var row = document.createElement('tr');
				table.appendChild(row);
				for (var c=0; c<numCellPerRow && chaptNum <= book.lastChapter; c++) {
					var cell = that.dom.addNode(row, 'td', 'tocChap', that.localizeNumber.toTOCLocal(chaptNum), 'toc' + bookCode + ':' + chaptNum);
					chaptNum++;
					cell.addEventListener('click', function(event) {
						var nodeId = this.id.substring(3);
						console.log('open chapter', nodeId);
						document.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: nodeId }}));
					});
				}
			}
			var bookNode = document.getElementById('toc' + book.code);
			if (bookNode) {
				var saveYPosition = bookNode.getBoundingClientRect().top;
				removeAllChapters();
				bookNode.appendChild(root);
				scrollTOC(bookNode, saveYPosition);
			}
		} else {
			var nodeId = book.code + ':0';
			console.log('open chapter', nodeId);
			document.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: nodeId }}));
		}
	}
	
	function cellsPerRow() {
		var width = that.numberNode.getBoundingClientRect().width;
		var cellWidth = Math.max(50, width * 0.3); // width of 3 chars or at least 50px
		var numCells = window.innerWidth * 0.8 / cellWidth;
		return(Math.floor(numCells));		
	}
	function removeAllChapters() {
		var div = document.getElementById('toc');
		if (div) {
			for (var i=div.children.length -1; i>=0; i--) {
				var bookNode = div.children[i];
				if (bookNode.className === 'tocBook') {
					for (var j=bookNode.children.length -1; j>=0; j--) {
						var chaptTable = bookNode.children[j];
						bookNode.removeChild(chaptTable);
					}
				}
			}
		}
	}
	function scrollTOC(bookNode, saveYPosition) {
		window.scrollBy(0, bookNode.getBoundingClientRect().top - saveYPosition); // Keeps bookNode in same position when node above is collapsed.
		
		var bookRect = bookNode.getBoundingClientRect();
		if (window.innerHeight < bookRect.top + bookRect.height) {
			// Scrolls booknode up when chapters are not in view.
			// limits scroll to bookRect.top -80 so that book name remains in view.
			window.scrollBy(0, Math.min(bookRect.top - 80, bookRect.top + bookRect.height - window.innerHeight));	
		}
	}
};

/**
* This class is the UI for the controls in the settings page.
* It also uses the VersionsView to display versions on the settings page.
*/
function SettingsView(settingStorage, versesAdapter, version) {
	this.root = null;
	this.settingStorage = settingStorage;
	this.versesAdapter = versesAdapter;
	this.rootNode = document.createElement('div');
	this.rootNode.id = 'settingRoot';
	document.body.appendChild(this.rootNode);
	this.dom = new DOMBuilder();
	this.versionsView = new VersionsView(this.settingStorage);
	this.rateMeView = new RateMeView(version);
	Object.seal(this);
}
SettingsView.prototype.showView = function() {
	document.body.style.backgroundColor = '#FFF';
	if (! this.root) {
		this.root = this.buildSettingsView();
	}
	if (this.rootNode.children.length < 1) {
		this.rootNode.appendChild(this.root);
	}
	this.startControls();
	this.rateMeView.showView();
	this.versionsView.showView();
};
SettingsView.prototype.hideView = function() {
	if (this.rootNode.children.length > 0) {
		// should I save scroll position here
		for (var i=this.rootNode.children.length -1; i>=0; i--) {
			this.rootNode.removeChild(this.rootNode.children[i]);
		}
	}	
};
SettingsView.prototype.buildSettingsView = function() {
	var that = this;
	var table = document.createElement('table');
	table.id = 'settingsTable';
	
	addRowSpace(table);
	var sizeRow = this.dom.addNode(table, 'tr');
	var sizeCell = this.dom.addNode(sizeRow, 'td', null, null, 'fontSizeControl');
	var sizeSlider = this.dom.addNode(sizeCell, 'div', null, null, 'fontSizeSlider');
	var sizeThumb = this.dom.addNode(sizeCell, 'div', null, null, 'fontSizeThumb');
	
	var textRow = this.dom.addNode(table, 'tr');
	var textCell = this.dom.addNode(textRow, 'td', null, null, 'sampleText');
	
	/**
	* This is not used because it had a negative impact on codex performance, but keep as an
	* example toggle switch.*/
	/* This is kept in as a hack, because the thumb on fontSizeControl does not start in the correct
	* position, unless this code is here. */
	
	//addRowSpace(table);
	var colorRow = this.dom.addNode(table, 'tr');
	var blackCell = this.dom.addNode(colorRow, 'td', 'tableLeftCol', null, 'blackBackground');
	var colorCtrlCell = this.dom.addNode(colorRow, 'td', 'tableCtrlCol');
	var colorSlider = this.dom.addNode(colorCtrlCell, 'div', null, null, 'fontColorSlider');
	var colorThumb = this.dom.addNode(colorSlider, 'div', null, null, 'fontColorThumb');
	var whiteCell = this.dom.addNode(colorRow, 'td', 'tableRightCol', null, 'whiteBackground');
	
	//addRowSpace(table);
	addJohn316(textCell);
	return(table);
	
	function addRowSpace(table) {
		var row = table.insertRow();
		var cell = row.insertCell();
		cell.setAttribute('class', 'rowSpace');
	}
	function addJohn316(verseNode) {
		that.versesAdapter.getVerses(['JHN:3:16'], function(results) {
			if (results instanceof IOError) {
				console.log('Error while getting JHN:3:16');
			} else {
				if (results.length > 2) {
					var row = results[2].split("|");
					verseNode.textContent = row[1];
				}	
			}
		});

	}
};
SettingsView.prototype.startControls = function() {
	var that = this;
	var docFontSize = document.documentElement.style.fontSize;
	findMaxFontSize(function(maxFontSize) {
		startFontSizeControl(docFontSize, 10, maxFontSize);
	});
	
	function startFontSizeControl(fontSizePt, ptMin, ptMax) {
		var fontSize = parseFloat(fontSizePt);
		if (fontSize < ptMin) fontSize = ptMin;
		if (fontSize > ptMax) fontSize = ptMax;
	    var sampleNode = document.getElementById('sampleText');
    	var draggable = Draggable.create('#fontSizeThumb', {bounds:'#fontSizeSlider', minimumMovement:0,
	    	lockAxis:true, 
	    	onDrag:function() { resizeText(this.x); },
	    	onDragEnd:function() { finishResize(this.x); }
	    });
    	var drag0 = draggable[0];
    	var ratio = (ptMax - ptMin) / (drag0.maxX - drag0.minX);
    	var startX = (fontSize - ptMin) / ratio + drag0.minX;
    	TweenMax.set('#fontSizeThumb', {x:startX});
    	resizeText(startX);

		function resizeText(x) {
	    	var size = (x - drag0.minX) * ratio + ptMin;
			sampleNode.style.fontSize = size + 'pt';
    	}
    	function finishResize(x) {
	    	var size = (x - drag0.minX) * ratio + ptMin;
	    	document.documentElement.style.fontSize = size + 'pt';
			that.settingStorage.setFontSize(size);
    	}
    }
    function findMaxFontSize(callback) {
	    that.settingStorage.getMaxFontSize(function(maxFontSize) {
		    if (maxFontSize == null) {
				var node = document.createElement('span');
				node.textContent = 'Thessalonians';
				node.setAttribute('style', "position: absolute; float: left; white-space: nowrap; visibility: hidden; font-family: sans-serif;");
				document.body.appendChild(node);
				var fontSize = 18 * 1.66; // Title is style mt1, which is 1.66rem
				do {
					fontSize++;
					node.style.fontSize = fontSize + 'pt';
					var width = node.getBoundingClientRect().right;
				} while(width < window.innerWidth);
				document.body.removeChild(node);
				maxFontSize = (fontSize - 1.0) / 1.66;
				console.log('computed maxFontSize', maxFontSize);
				that.settingStorage.setMaxFontSize(maxFontSize);
			}
			callback(maxFontSize);
		});
    }
    /* This is not used, changing colors had a negative impact on codexView performance. Keep as a toggle switch example.
	function startFontColorControl(state) {
	    var onOffState = state;
	    var sliderNode = document.getElementById('fontColorSlider');
	    var sampleNode = document.getElementById('sampleText');
    	var draggable = Draggable.create('#fontColorThumb', {type:'x', bounds:sliderNode, throwProps:true, snap:function(v) {
	    		var snap = (v - this.minX < (this.maxX - this.minX) / 2) ? this.minX : this.maxX;
	    		var newState = (snap > this.minX);
	    		if (newState != onOffState) {
		    		onOffState = newState;
		    		setColors(onOffState);
	    		}
	    		return(snap);
    		}
    	});
    	var startX = (onOffState) ? draggable[0].maxX : draggable[0].minX;
    	TweenMax.set('#fontColorThumb', {x:startX});
    	setColors(onOffState);
    	
    	function setColors(onOffState) {
	    	var color = (onOffState) ? '#00FF00' : '#FFFFFF';
			TweenMax.to(sliderNode, 0.4, {backgroundColor: color});
			sampleNode.style.backgroundColor = (onOffState) ? '#000000' : '#FFFFFF';
			sampleNode.style.color = (onOffState) ? '#FFFFFF' : '#000000';
    	}
    }*/
};



/**
* This class presents the list of available versions to download
*/
var FLAG_PATH = 'licensed/icondrawer/flags/64/';
var CURRENT_VERS = 'licensed/sebastiano/check.png';
var INSTALLED_VERS = 'licensed/sebastiano/contacts.png';
var DOWNLOAD_VERS = 'licensed/sebastiano/cloud-download.png';
var DOWNLOAD_STRT = 'licensed/melissa/cloud-lightning.png';

function VersionsView(settingStorage) {
	this.settingStorage = settingStorage;
	this.database = new VersionsAdapter();
	var that = this;
	this.locale = null;
	this.translation = null;
	deviceSettings.prefLanguage(function(locale) {
		that.locale = locale;
		that.database.buildTranslateMap(locale, function(results) {
			that.translation = results;
		});		
	});
	this.root = null;
	this.rootNode = document.getElementById('settingRoot');
	this.defaultCountryNode = null;
	this.dom = new DOMBuilder();
	this.scrollPosition = 0;
	this.downloadErrors = [];
	Object.seal(this);
}
VersionsView.prototype.showView = function() {
	if (! this.root) {
		this.buildCountriesList();
	} 
	else if (this.rootNode.children.length < 4) {
		this.rootNode.appendChild(this.root);
		window.scrollTo(10, this.scrollPosition);// move to settings view?
	}
};
VersionsView.prototype.buildCountriesList = function() {
	var that = this;
	var root = document.createElement('div');
	this.database.selectCountries(function(results) {
		if (! (results instanceof IOError)) {
			for (var i=0; i<results.length; i++) {
				var row = results[i];
				var groupNode = that.dom.addNode(root, 'div');

				var countryNode = that.dom.addNode(groupNode, 'table', 'ctry', null, 'cty' + row.countryCode);
				countryNode.addEventListener('click', countryClickHandler);
				if (row.countryCode === 'WORLD') {
					that.defaultCountryNode = countryNode;
				}
				
				var rowNode = that.dom.addNode(countryNode, 'tr');
				var flagCell = that.dom.addNode(rowNode, 'td', 'ctryFlag');
				
				var flagNode = that.dom.addNode(flagCell, 'img');
				flagNode.setAttribute('src', FLAG_PATH + row.countryCode.toLowerCase() + '.png');
				
				var prefCtryName = that.translation[row.countryCode];
				if (prefCtryName == null) {
					prefCtryName = that.translation['en'];
				}
				that.dom.addNode(rowNode, 'td', 'localCtryName', prefCtryName);
			}
		}
		callNative('Utility', 'appVersion', [], "S", function(appVersion) {
			that.dom.addNode(root, 'p', 'shortsands', 'SafeBible by Short Sands, LLC. support@shortsands.com, version: ' + appVersion);
			that.rootNode.appendChild(root);
			that.buildVersionList(that.defaultCountryNode);
			that.root = root;			
		});
	});
	
	function countryClickHandler(event) {
		if (this.parentElement.children.length === 1) {
			that.buildVersionList(this);		
		} else {
			var parent = this.parentElement;
			for (var i=parent.children.length -1; i>0; i--) {
				parent.removeChild(parent.children[i]);
			}
		}
	}
};
VersionsView.prototype.buildVersionList = function(countryNode) {
	var that = this;
	var parent = countryNode.parentElement;
	var countryCode = countryNode.id.substr(3);
	this.settingStorage.getInstalledVersions(function(installedMap) {
		that.settingStorage.getCurrentVersion(function(currentVersion) {
			that.database.selectVersions(countryCode, function(results) {
				if (! (results instanceof IOError)) {
					for (var i=0; i<results.length; i++) {
						var row = results[i];
						var versionNode = that.dom.addNode(parent, 'table', 'vers');
						var rowNode = that.dom.addNode(versionNode, 'tr');
						var leftNode = that.dom.addNode(rowNode, 'td', 'versLeft');
						
						var preferredName = that.translation[row.langCode];
						var languageName = (preferredName == null || preferredName === row.localLanguageName) 
							? row.localLanguageName 
							: row.localLanguageName + ' (' + preferredName + ')';
						that.dom.addNode(leftNode, 'p', 'langName', languageName);
						var versionName = (row.localVersionName) ? row.localVersionName : row.scope;
						var versionAbbr = (row.versionAbbr && row.versionAbbr.length > 0) ? row.versionAbbr : '';
						
						var versNode = that.dom.addNode(leftNode, 'p', 'versDesc');
						versNode.setAttribute('dir', row.direction);
						that.dom.addNode(versNode, 'span', 'versName', '\u2000' + versionName + '\u2000');
						that.dom.addNode(versNode, 'bdi', 'versAbbr', '\u2000' + versionAbbr + '\u2000');
						that.dom.addNode(versNode, 'bdi', 'versOwner', '\u2000' + row.localOwnerName + '\u2000');
						
						var rightNode = that.dom.addNode(rowNode, 'td', 'versRight');
						var btnNode = that.dom.addNode(rightNode, 'button', 'versIcon');
						
						var iconNode = that.dom.addNode(btnNode, 'img');
						iconNode.setAttribute('id', 'ver' + row.versionCode);
						iconNode.setAttribute('data-id', 'fil' + row.filename);
						if (row.filename === currentVersion) {
							iconNode.setAttribute('src', CURRENT_VERS);
							iconNode.addEventListener('click', selectVersionHandler);
						} else if (installedMap[row.versionCode]) {
							iconNode.setAttribute('src', INSTALLED_VERS);
							iconNode.addEventListener('click',  selectVersionHandler);
						} else {
							iconNode.setAttribute('src', DOWNLOAD_VERS);
							iconNode.addEventListener('click', downloadVersionHandler);
						}
					}
				}
				//debugLogVersions(installedMap);
			});
		});
	});
	
	function selectVersionHandler(event) {
		var filename = this.getAttribute('data-id').substr(3);
		document.dispatchEvent(new CustomEvent(BIBLE.CHG_VERSION, { detail: { version: filename }}));
	}
	function downloadVersionHandler(event) {
		this.removeEventListener('click', downloadVersionHandler);
		var iconNode = this;
		iconNode.setAttribute('src', DOWNLOAD_STRT);
		var versionCode = iconNode.id.substr(3);
		var versionFile = iconNode.getAttribute('data-id').substr(3);
		that.settingStorage.getCurrentVersion(function(currVersion) {
			var downloader = new FileDownloader(that.database, that.locale);
			downloader.download(versionFile, function(error) {
				if (error) {
					console.log(error);
					iconNode.setAttribute('src', DOWNLOAD_VERS);
					iconNode.addEventListener('click', downloadVersionHandler);
					that.downloadErrors.push(iconNode);
				} else {
					iconNode.setAttribute('src', INSTALLED_VERS);
					iconNode.addEventListener('click',  selectVersionHandler);
					document.dispatchEvent(new CustomEvent(BIBLE.CHG_VERSION, { detail: { version: versionFile }}));
				}
			});
		});
	}
	function debugLogVersions(loadedVersions) {
		var versionNames = Object.keys(loadedVersions);
		for (var i=0; i<versionNames.length; i++) {
			var version = versionNames[i];
			var filename = loadedVersions[version].filename;
			console.log('INSTALLED VERSION', version, filename);
		}
		that.settingStorage.selectSettings(function(results) {
			console.log('SETTINGS', JSON.stringify(results));
		});
	}
};

/**
* This class presents a Rate Me button and responds to clicks to that button.
*
*/
function RateMeView(version) {
	this.version = version;
	this.appName = 'SafeBible';
	this.appIdIos = "1073396349";
	this.appIdAndroid = "com.shortsands.yourbible";
	this.dom = new DOMBuilder();
	Object.seal(this);
}
RateMeView.prototype.showView = function() {
	var rateBtn = document.getElementById('ratebtn');
	if (rateBtn == null) {
		this._buildView();
	}
};
RateMeView.prototype._buildView = function() {
	var that = this;
	var table = document.getElementById('settingsTable');
	var row = this.dom.addNode(table, 'tr');
	var cell = this.dom.addNode(row, 'td');
	cell.setAttribute('style', 'text-align: center');
	var buttonText = this._getButtonText(this.version.langCode);
	var button = this.dom.addNode(cell, 'button', null, buttonText, 'ratebtn');
	button.addEventListener('click', function(event) {
		callNative('Utility', 'rateApp', [], 'N', function() {
			console.log("RATE ME COMPLETE");
		});
	});
};
RateMeView.prototype._getButtonText = function(langCode) {
	var buttonText = {
		'ar': "قيِّم %@",
		'bn': "রেট %@",
		'ca': "Ressenya %@",
		'cs': "Ohodnotit %@",
		'da': "Vurdér %@",
		'de': "Bewerte %@",
		'de-AT': "Bewerte %@",
		'el': "Αξιολόγησε %@",
		'en': "Rate %@",
		'es': "Reseña %@",
		'fa': "نرخ %@",
		'fi': "Arvostele %@",
		'fr': "Notez %@",
		'he': "דרג את %@",
		'hi': "दर %@",
		'id': "Beri Nilai %@",
		'it': "Valuta %@",
		'ja': "%@の評価",
		'ko': "%@ 평가하기",
		'nl': "Beoordeel %@",
		'no': "Vurder %@",
		'pa': "ਦਰ %@",
		'pl': "Oceń %@",
		'pt': "Avaliar %@",
		'ru': "Оцените %@",
		'sk': "Ohodnotiť %@",
		'sl': "Oceni %@",
		'sv': "Betygsätt %@",
		'th': "อัตรา %@",
		'tr': "Oy %@",
		'uk': "Оцінити %@",
		'ur': "شرح %@",
		'ur-IN': "کو ریٹ کیجیے %@",
		'ur-PK': "کو ریٹ کیجیے %@",
		'vi': "Đánh giá %@",
		'zh': "为“%@”评分",
		'zh-TW': "評分 %@",
		'zh-Hans': "为“%@”评分",
		'zh-Hant': "評分 %@" };
	var message = buttonText[langCode];
	if (message == null) message = buttonText['en'];
	message = message.replace('%@', this.appName);
	return(message);
};/**
* This function draws the 'X' that is used as a close
* button on any popup window.
*/
function drawCloseIcon(hite, color) {
	var lineThick = hite / 7.0;
	var spacer = lineThick / 2;

	var canvas = document.createElement('canvas');
	canvas.setAttribute('height', hite);
	canvas.setAttribute('width', hite);
	var graphics = canvas.getContext('2d');

	graphics.beginPath();
	graphics.moveTo(spacer, spacer);
	graphics.lineTo(hite - spacer, hite - spacer);
	graphics.moveTo(hite - spacer, spacer);
	graphics.lineTo(spacer, hite - spacer);
	graphics.closePath();

	graphics.lineWidth = hite / 5.0;
	graphics.strokeStyle = color;
	graphics.stroke();
	return(canvas);
}/**
* This class draws the stop icon that is displayed
* when there are no search results.
*/
function StopIcon(color) {
	this.hite = window.innerHeight / 7;
	
	this.centerIcon = (window.innerHeight - this.hite) / 2;
	this.color = color;
	this.iconDiv = document.createElement('div');
	this.iconDiv.setAttribute('style', 'text-align: center;');
	this.iconCanvas = null;
	Object.seal(this);
}
StopIcon.prototype.showIcon = function() {
	if (this.iconCanvas === null) {
		this.iconCanvas = this.drawIcon();
	}
	document.body.appendChild(this.iconDiv);
	this.iconDiv.appendChild(this.iconCanvas);

	TweenMax.set(this.iconCanvas, { y: - this.hite });
	TweenMax.to(this.iconCanvas, 0.5, { y: this.centerIcon });
};
StopIcon.prototype.hideIcon = function() {
	if (this.iconDiv && this.iconCanvas && this.iconDiv.hasChildNodes()) {
		this.iconDiv.removeChild(this.iconCanvas);
	}
	if (this.iconDiv && this.iconDiv.parentNode === document.body) {
		document.body.removeChild(this.iconDiv);
	}
};
StopIcon.prototype.drawIcon = function() {
	var lineThick = this.hite / 7.0;
	var radius = (this.hite / 2) - lineThick;
	var coordX = radius + lineThick;
	var coordY = radius + lineThick;
	var edgeX = coordX - radius / 1.5;
	var edgeY = coordY - radius / 1.5;

	var canvas = document.createElement('canvas');
	canvas.setAttribute('height', this.hite);
	canvas.setAttribute('width', this.hite);
	var graphics = canvas.getContext('2d');

	graphics.beginPath();
	graphics.arc(coordX, coordY, radius, 0, Math.PI*2, true);
	graphics.moveTo(edgeX, edgeY);
	graphics.lineTo(edgeX + radius * 1.5, edgeY + radius * 1.5);
	graphics.closePath();

	graphics.lineWidth = lineThick;
	graphics.strokeStyle = this.color;
	graphics.stroke();
	return(canvas);
};

// stop = new StopIcon(200, '#FF0000');
//stop.showIcon();
/**
* This function draws and icon that is used as a send arrow button
* on the QuestionsView input block.
*/
function drawSendIcon(hite, color) {
	var widthDiff = 1.25;

	var canvas = document.createElement('canvas');
	canvas.setAttribute('height', hite);
	canvas.setAttribute('width', hite * widthDiff);
	var graphics = canvas.getContext('2d');

	var lineWidth = hite / 7.0;
	drawArrow(graphics, lineWidth);
	return(canvas);

	function drawArrow(graphics, lineWidth) {
		var middle = canvas.height * 0.5;
		var widt = canvas.width;
		var doubleLineWidth = lineWidth * 2.0;
		var tripleLineWidth = lineWidth * 3.5;
		var controlX = widt - lineWidth * 2.5;

		graphics.beginPath();
		graphics.moveTo(lineWidth, middle);
		graphics.lineTo(widt - 2 * lineWidth, middle);
		graphics.strokeStyle = color;
		graphics.lineWidth = lineWidth;
		graphics.stroke();

		graphics.beginPath();
		graphics.moveTo(widt - lineWidth, middle);
		graphics.lineTo(widt - tripleLineWidth, middle - doubleLineWidth);

		graphics.moveTo(widt - lineWidth, middle);
		graphics.lineTo(widt - tripleLineWidth, middle + doubleLineWidth);

		graphics.bezierCurveTo(controlX, middle, controlX, middle, widt - tripleLineWidth, middle - doubleLineWidth);

		graphics.fillStyle = color;
		graphics.fill();
	}
}/**
* This class is a wrapper for SQL Error so that we can always distinguish an error
* from valid results.  Any method that calls an IO routine, which can expect valid results
* or an error should test "if (results instanceof IOError)".
*/
function IOError(err) {
	if (err.code && err.message) {
		this.code = err.code;
		this.message = err.message;
	} else {
		this.code = 0;
		this.message = JSON.stringify(err);
	}
}
/**
* This class replaces window.localStorage, because I had reliability problems with LocalStorage
* on ios Simulator.  I am guessing the problems were caused by the WKWebView plugin, but I don't really know.
*/
function SettingStorage() {
    this.className = 'SettingStorage';
    this.database = new DatabaseHelper('Settings.db', false);
	Object.seal(this);
}
SettingStorage.prototype.create = function(callback) {
	var that = this;
	this.database.executeDDL('CREATE TABLE IF NOT EXISTS Settings(name TEXT PRIMARY KEY NOT NULL, value TEXT NULL)', function(err) {
		if (err instanceof IOError) {
			console.log('Error creating Settings', err);
		} else {
			var statement = 'CREATE TABLE IF NOT EXISTS Installed(' +
					' version TEXT PRIMARY KEY NOT NULL,' +
					' filename TEXT NOT NULL,' +
					' timestamp TEXT NOT NULL,' +
					' bibleVersion TEXT NOT NULL)';
			that.database.executeDDL(statement, function(err) {
				if (err instanceof IOError) {
					console.log('Error creating Installed', err);
				} else {
					var history = new HistoryAdapter(that.database);
					history.create(function(){});
					callback();
				}
			});
		}
	});
};
/**
* Settings
*/
SettingStorage.prototype.getFontSize = function(callback) {
	this.getItem('fontSize', function(fontSize) {
		if (fontSize < 10 || fontSize > 36) fontSize = null; // Null will force calc of fontSize.
		callback(fontSize);
	});
};
SettingStorage.prototype.setFontSize = function(fontSize) {
	this.setItem('fontSize', fontSize);
};
SettingStorage.prototype.getMaxFontSize = function(callback) {
	this.getItem('maxFontSize', function(maxFontSize) {
		callback(maxFontSize);
	});
};
SettingStorage.prototype.setMaxFontSize = function(maxFontSize) {
	this.setItem('maxFontSize', maxFontSize);	
};
SettingStorage.prototype.getCurrentVersion = function(callback) {
	this.getItem('version', function(filename) {
		callback(filename);
	});
};
SettingStorage.prototype.setCurrentVersion = function(filename) {
	this.setItem('version', filename);
};
SettingStorage.prototype.getAppVersion = function(callback) {
	this.getItem('appVersion', function(version) {
		callback(version);
	});
};
SettingStorage.prototype.setAppVersion = function(appVersion) {
	this.setItem('appVersion', appVersion);
};
SettingStorage.prototype.getItem = function(name, callback) {
	this.database.select('SELECT value FROM Settings WHERE name=?', [name], function(results) {
		if (results instanceof IOError) {
			console.log('GetItem', name, JSON.stringify(results));
			callback();
		} else {
			var value = (results.rows.length > 0) ? results.rows.item(0).value : null;
        	console.log('GetItem', name, value);
			callback(value);
		}
	});
};
SettingStorage.prototype.setItem = function(name, value) {
    this.database.executeDML('REPLACE INTO Settings(name, value) VALUES (?,?)', [name, value], function(results) {
	   if (results instanceof IOError) {
		   console.log('SetItem', name, value, JSON.stringify(results));
	   } else {
		   console.log('SetItem', name, value);
	   }
    });
};
SettingStorage.prototype.selectSettings = function(callback) {
	this.database.select('SELECT name, value FROM Settings', [], function(results) {
		if (results instanceof IOError) {
			console.log('Select Settings', JSON.stringify(results));
		} else {
			var map = {};
			for (var i=0; i<results.rows.length; i++) {
	        	var row = results.rows.item(i);
	   			map[row.name] = row.value;     	
        	}
        	callback(map);
		}
	});	
};
SettingStorage.prototype.getInstalledVersions = function(callback) {
	var loadedVersions = {};
	console.log('GetVersions');
	this.database.select('SELECT version, filename, bibleVersion FROM Installed', [], function(results) {
		if (results instanceof IOError) {
			console.log('GetInstalledVersions error', JSON.stringify(results));
		} else {
			console.log('GetVersions, rowCount=', results.rows.length);
        	for (var i=0; i<results.rows.length; i++) {
	        	var row = results.rows.item(i);
	        	loadedVersions[row.version] = {versionCode: row.version, filename: row.filename, bibleVersion: row.bibleVersion };
        	}
		}
		callback(loadedVersions);
	});
};
SettingStorage.prototype.getInstalledVersion = function(versionCode, callback) {
	console.log('GetVersion', versionCode);
	this.database.select('SELECT version, filename, bibleVersion FROM Installed WHERE version=?', [versionCode], function(results) {
		if (results instanceof IOError) {
			console.log('GetInstalledVersion error', JSON.stringify(results));
			callback();
		} else if (results.rows.length === 0) {
			callback();
		} else {
			var row = results.rows.item(0);
			callback({versionCode: row.version, filename: row.filename, bibleVersion: row.bibleVersion});
		}
	});
};
SettingStorage.prototype.setInstalledVersion = function(version, filename, bibleVersion) {
	console.log('SetInstalledVersion', version, filename);
	var now = new Date();
	this.database.executeDML('REPLACE INTO Installed(version, filename, timestamp, bibleVersion) VALUES (?,?,?,?)', 
							[version, filename, now.toISOString(), bibleVersion], function(results) {
		if (results instanceof IOError) {
			console.log('SetVersion error', JSON.stringify(results));
		} else {
			console.log('SetVersion success, rows=', results);
		}
	});
};
SettingStorage.prototype.removeInstalledVersion = function(version, callback) {
	console.log('REMOVE INSTALLED VERSION', version);
	this.database.executeDML('DELETE FROM Installed WHERE version=?', [version], function(results) {
		if (results instanceof IOError) {
			console.log('RemoveInstalledVersion Error', JSON.stringify(results));
		}
		callback();
	});
};
SettingStorage.prototype.bulkReplaceInstalledVersions = function(versions, callback) {
	var that = this;
	this.database.bulkExecuteDML('REPLACE INTO Installed(version, filename, timestamp, bibleVersion) VALUES (?,?,?,?)', versions, function(results) {
		if (results instanceof IOError) {
			console.log('ERROR: Replace All Installed', JSON.stringify(results));
		} else {
			console.log('Replace All Installed', results);
		}
		callback();
	});
};

/**
* This class encapsulates the WebSQL function calls, and exposes a rather generic SQL
* interface so that WebSQL could be easily replaced if necessary.
*/
function DatabaseHelper(dbname, isCopyDatabase) {
	this.dbname = dbname;
	callNative('Sqlite', 'openDB', [dbname, isCopyDatabase], "E", function(error) {
		// The error has already been reported in JS glue layer
		// All subsequent access to database will fail, because it is not open.
	});
	Object.seal(this);
}
DatabaseHelper.prototype.select = function(statement, values, callback) {
	callNative('Sqlite', 'queryJS', [this.dbname, statement, values], "ES", function(error, results) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(new ResultSet(results));
		}
	});
};
DatabaseHelper.prototype.selectHTML = function(statement, values, callback) {
	callNative('Sqlite', 'queryHTML', [this.dbname, statement, values], "S", function(results) {
		callback(results);
	});
};
DatabaseHelper.prototype.selectSSIF = function(statement, values, callback) {
	callNative('Sqlite', 'querySSIF', [this.dbname, statement, values], "ES", function(error, results) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(results.split("~"));
		}
	});
};
DatabaseHelper.prototype.executeDML = function(statement, values, callback) {
	callNative('Sqlite', 'executeJS', [this.dbname, statement, values], "ES", function(error, rowCount) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(rowCount);
		}
	});
};
DatabaseHelper.prototype.bulkExecuteDML = function(statement, array, callback) {
	callNative('Sqlite', 'bulkExecuteJS', [this.dbname, statement, array], "ES", function(error, rowCount) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(rowCount);
		}
	});
};
DatabaseHelper.prototype.executeDDL = function(statement, callback) {
	callNative('Sqlite', 'executeJS', [this.dbname, statement, []], "ES", function(error, rowCount) {
		if (error) {
			callback(new IOError(error));
		} else {
			callback(rowCount);
		}
	});
};
DatabaseHelper.prototype.close = function() {
	callNative('Sqlite', 'closeDB', [this.dbname], "E", function(error) {
		// The error has already been logged in the JS glue layer
	});
};
/** A smoke test is needed before a database is opened. */
/** A second more though test is needed after a database is opened.*/
DatabaseHelper.prototype.smokeTest = function(callback) {
    var statement = 'select count(*) from tableContents';
    this.select(statement, [], function(results) {
        if (results instanceof IOError) {
            console.log('found Error', JSON.stringify(results));
            callback(false);
        } else if (results.rows.length === 0) {
            callback(false);
        } else {
            var row = results.rows.item(0);
            console.log('found', JSON.stringify(row));
            var count = row['count(*)'];
            console.log('count=', count);
            callback(count > 0);
        }
    });
};

function ResultSet(results) {
	this.rows = new RowItems(results);
}
function RowItems(results) {
	this.rows = results;
	this.length = this.rows.length;
}
RowItems.prototype.item = function(index) {
	return(this.rows[index]);
};

/**
* This class is the database adapter for the codex table
*/
//var IOError = require('./IOError'); What needs this, Publisher does not

function ChaptersAdapter(database) {
	this.database = database;
	this.className = 'ChaptersAdapter';
	Object.freeze(this);
}
ChaptersAdapter.prototype.drop = function(callback) {
	this.database.executeDDL('drop table if exists chapters', function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('drop chapters success');
			callback();
		}
	});
};
ChaptersAdapter.prototype.create = function(callback) {
	var statement = 'create table if not exists chapters(' +
		'reference text not null primary key, ' +
		'xml text not null, ' +
		'html text not null)';
	this.database.executeDDL(statement, function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('create chapters success');
			callback();
		}
	});
};
ChaptersAdapter.prototype.load = function(array, callback) {
	var statement = 'insert into chapters(reference, xml, html) values (?,?,?)';
	this.database.bulkExecuteDML(statement, array, function(count) {
		if (count instanceof IOError) {
			callback(count);
		} else {
			console.log('load chapters success, rowcount', count);
			callback();
		}
	});
};
ChaptersAdapter.prototype.getChapters = function(values, callback) {
	var statement = 'select html, reference from chapters where';
	if (values.length === 1) {
		statement += ' rowid = ?';
	} else {
		statement += ' rowid >= ? and rowid <= ? order by rowid';
	}
	this.database.selectHTML(statement, values, function(results) {
		callback(results);
	});
};
/**
* This class is the database adapter for the verses table
*/
function VersesAdapter(database) {
	this.database = database;
	this.className = 'VersesAdapter';
	Object.freeze(this);
}
VersesAdapter.prototype.drop = function(callback) {
	this.database.executeDDL('drop table if exists verses', function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('drop verses success');
			callback();
		}
	});
};
VersesAdapter.prototype.create = function(callback) {
	var statement = 'create table if not exists verses(' +
		'reference text not null primary key, ' +
		'xml text not null, ' +
		'html text not null)';
	this.database.executeDDL(statement, function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('create verses success');
			callback();
		}
	});
};
VersesAdapter.prototype.load = function(array, callback) {
	var statement = 'insert into verses(reference, xml, html) values (?,?,?)';
	this.database.bulkExecuteDML(statement, array, function(count) {
		if (count instanceof IOError) {
			callback(count);
		} else {
			console.log('load verses success, rowcount', count);
			callback();
		}
	});
};
VersesAdapter.prototype.getVerses = function(values, callback) {
	var that = this;
	var numValues = values.length || 0;
	var array = [numValues];
	for (var i=0; i<numValues; i++) {
		array[i] = '?';
	}
	var statement = 'select reference, html from verses where reference in (' + array.join(',') + ') order by rowid';
	this.database.selectSSIF(statement, values, function(results) {
		if (results instanceof IOError) {
			console.log('VersesAdapter select found Error', results);
			callback(results);
		} else {
			if (results.length < 3) {
				callback(new IOError({code: 0, message: 'No Rows Found'}));// Is this really an error?
			} else {
				callback(results);
        	}
        }
	});
};/**
* This class is the database adapter for the concordance table
*/
function ConcordanceAdapter(database) {
	this.database = database;
	this.className = 'ConcordanceAdapter';
	Object.freeze(this);
}
ConcordanceAdapter.prototype.drop = function(callback) {
	this.database.executeDDL('drop table if exists concordance', function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('drop concordance success');
			callback();
		}
	});
};
ConcordanceAdapter.prototype.create = function(callback) {
	var statement = 'create table if not exists concordance(' +
		'word text primary key not null, ' +
    	'refCount integer not null, ' +
    	'refList text not null, ' + // comma delimited list of references where word occurs
    	'refPosition text null, ' + // comma delimited list of references with position in verse.
    	'refList2 text null)';
   	this.database.executeDDL(statement, function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('create concordance success');
			callback();
		}
	});
};
ConcordanceAdapter.prototype.load = function(array, callback) {
	var statement = 'insert into concordance(word, refCount, refList, refPosition, refList2) values (?,?,?,?,?)';
	this.database.bulkExecuteDML(statement, array, function(count) {
		if (count instanceof IOError) {
			callback(count);
		} else {
			console.log('load concordance success', count);
			callback();
		}
	});
};
ConcordanceAdapter.prototype.select = function(words, callback) {
	var values = [ words.length ];
	var questMarks = [ words.length ];
	for (var i=0; i<words.length; i++) {
		values[i] = words[i].toLocaleLowerCase();
		questMarks[i] = '?';
	}
	var statement = 'select refList from concordance where word in(' + questMarks.join(',') + ')';
	this.database.select(statement, values, function(results) {
		if (results instanceof IOError) {
			console.log('found Error', results);
			callback(results);
		} else {
			var refLists = [];
			for (i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				if (row && row.refList) { // ignore words that have no ref list
					var array = row.refList.split(',');
					refLists.push(array);
				}
			}
            callback(refLists);
        }
	});
};
/**
* This is similar to select, except that it returns the refList2 field, 
* and resequences the results into the order the words were entered.
*/
ConcordanceAdapter.prototype.select2 = function(words, callback) {
	var values = [ words.length ];
	var questMarks = [ words.length ];
	for (var i=0; i<words.length; i++) {
		values[i] = words[i].toLocaleLowerCase();
		questMarks[i] = '?';
	}
	var statement = 'select word, refList2 from concordance where word in(' + questMarks.join(',') + ')';
	this.database.select(statement, values, function(results) {
		if (results instanceof IOError) {
			console.log('found Error', results);
			callback(results);
		} else {
			var resultMap = {};
			for (i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				if (row && row.refList2) { // ignore words that have no ref list
					resultMap[row.word] = row.refList2;
				}
			}
			var refLists = []; // sequence refList by order search words were entered
			for (i=0; i<values.length; i++) {
				var ref = resultMap[values[i]];
				if (ref) {
					refLists.push(ref.split(','));
				}
			}
            callback(refLists);
        }
	});
};/**
* This class is the database adapter for the tableContents table
*/
function TableContentsAdapter(database) {
	this.database = database;
	this.className = 'TableContentsAdapter';
	Object.freeze(this);
}
TableContentsAdapter.prototype.drop = function(callback) {
	this.database.executeDDL('drop table if exists tableContents', function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('drop tableContents success');
			callback();
		}
	});
};
TableContentsAdapter.prototype.create = function(callback) {
	var statement = 'create table if not exists tableContents(' +
		'code text primary key not null, ' +
    	'heading text not null, ' +
    	'title text not null, ' +
    	'name text not null, ' +
    	'abbrev text not null, ' +
		'lastChapter integer not null, ' +
		'priorBook text null, ' +
		'nextBook text null, ' +
		'chapterRowId integer not null)';
	this.database.executeDDL(statement, function(err) {
		if (err instanceof IOError) {
			callback(err);
		} else {
			console.log('create tableContents success');
			callback();
		}
	});
};
TableContentsAdapter.prototype.load = function(array, callback) {
	var statement = 'insert into tableContents(code, heading, title, name, abbrev, lastChapter, priorBook, nextBook, chapterRowId) ' +
		'values (?,?,?,?,?,?,?,?,?)';
	//this.database.manyExecuteDML(statement, array, function(count) {
	this.database.bulkExecuteDML(statement, array, function(count) {
		if (count instanceof IOError) {
			callback(count);
		} else {
			console.log('load tableContents success, rowcount', count);
			callback();
		}
	});
};
TableContentsAdapter.prototype.selectAll = function(callback) {
	var statement = 'select code, heading, title, name, abbrev, lastChapter, priorBook, nextBook, chapterRowId ' +
		'from tableContents order by rowid';
	this.database.select(statement, [], function(results) {
		if (results instanceof IOError) {
			callback(results);
		} else {
			var array = [];
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				var tocBook = new TOCBook(row.code, row.heading, row.title, row.name, row.abbrev, 
					row.lastChapter, row.priorBook, row.nextBook, row.chapterRowId);
				array.push(tocBook);
			}
			callback(array);
		}
	});
};/**
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
};/**
* This database adapter is different from the others in this package.  It accesses
* not the Bible, but a different database, which contains a catalog of versions of the Bible.
*
* The App selects from, but never modifies this data.
*/
function VersionsAdapter() {
    this.className = 'VersionsAdapter';
	this.database = new DatabaseHelper('Versions.db', true);
	this.translation = null;
	Object.seal(this);
}
VersionsAdapter.prototype.buildTranslateMap = function(locale, callback) {
	if (this.translation == null) {
		this.translation = {};
		var that = this;
		var locales = findLocales(locale);
		selectLocale(locales.pop());
	}
	
	function selectLocale(oneLocale) {
		// terminate once there are translation items, or there no more locales to process.
		if (that.translation.length > 10 || oneLocale == null) {
			callback(that.translation);
		} else {
			var statement = 'SELECT source, translated FROM Translation WHERE target = ?';
			that.database.select(statement, [oneLocale], function(results) {
				if (results instanceof IOError) {
					console.log('VersionsAdapter.BuildTranslationMap', results);
					callback(results);
				} else {
					for (var i=0; i<results.rows.length; i++) {
						var row = results.rows.item(i);
						that.translation[row.source] = row.translated;
					}
					selectLocale(locales.pop());
				}
			});
		}
	}
	
	function findLocales(locale) {
		var locales = [];
		var parts = locale.split('-');
		locales.push(parts[0]);
		locales.push('en');
		return(locales);
	}
};
VersionsAdapter.prototype.selectCountries = function(callback) {
	var statement = 'SELECT countryCode, primLanguage, localCountryName FROM Country ORDER BY localCountryName';
	this.database.select(statement, [], function(results) {
		if (results instanceof IOError) {
			callback(results);
		} else {
			var array = [];
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				if (row.countryCode === 'WORLD') {
					array.unshift(row);
				} else {
					array.push(row);
				}
			}
			callback(array);
		}
	});
};
VersionsAdapter.prototype.selectVersions = function(countryCode, callback) {
	var statement =	'SELECT v.versionCode, l.englishName, l.localLanguageName, l.langCode, l.direction, v.localVersionName, v.versionAbbr,' +
		' v.copyright, v.filename, o.localOwnerName, o.ownerURL, i.bibleVersion' +
		' FROM Version v' + 
		' JOIN Owner o ON v.ownerCode = o.ownerCode' +
		' JOIN Language l ON v.silCode = l.silCode' +
		' JOIN CountryVersion cv ON v.versionCode = cv.versionCode' +
		' JOIN Identity i ON v.versionCode = i.versionCode' +
		' WHERE cv.countryCode = ?' +
		' ORDER BY cv.rowid';
	this.database.select(statement, [countryCode], function(results) {
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
VersionsAdapter.prototype.selectVersionByFilename = function(versionFile, callback) {
	// temp modification to debug
	var statement = 'SELECT v.versionCode, v.silCode, v.hasHistory, v.isQaActive, v.copyright,' +
	//var statement = 'SELECT v.versionCode, v.silCode, v.hasHistory, v.isQaActive, v.copyright, v.introduction,' +
		' l.localLanguageName, l.langCode, l.direction, v.localVersionName, v.versionAbbr, o.ownerCode, o.localOwnerName, o.ownerURL, i.bibleVersion' +
		' FROM Version v' +
		' JOIN Owner o ON v.ownerCode = o.ownerCode' +
		' JOIN Language l ON v.silCode = l.silCode' +
		' JOIN Identity i ON v.versionCode = i.versionCode' +
		' WHERE v.filename = ?';
	this.database.select(statement, [versionFile], function(results) {
		if (results instanceof IOError) {
			callback(results);
		} if (results.rows.length === 0) {
			callback(new IOError('No version found'));
		} else {
			callback(results.rows.item(0));
		}
	});
};
VersionsAdapter.prototype.selectIntroduction = function(versionCode, callback) {
	var statement = 'SELECT introduction FROM Version WHERE versionCode = ?';
	this.database.selectHTML(statement, [versionCode], function(results) {
		callback(results);
	});
};
VersionsAdapter.prototype.defaultVersion = function(lang, callback) {
	var statement = 'SELECT filename FROM DefaultVersion WHERE langCode = ?';
	this.database.select(statement, [lang], function(results) {
		if (results instanceof IOError) {
			callback(results);
		} else if (results.rows.length === 0) {
			callback(DEFAULT_VERSION);
		} else {
			callback(results.rows.item(0).filename);
		}
	});
};
VersionsAdapter.prototype.selectAWSRegion = function(countryCode, callback) {
	var that = this;
	var statement = 'SELECT awsRegion FROM Region WHERE countryCode=?';
	this.database.select(statement, [countryCode], function(results) {
		if (results instanceof IOError || results.rows.length === 0) {
			callback('us-east-1');
		} else {
			var row = results.rows.item(0);
			callback(row.awsRegion);
		}
	});
};
VersionsAdapter.prototype.selectBucketName = function(regionCode, callback) {
	var that = this;
	var statement = 'SELECT r.awsRegion, a.s3TextBucket FROM Region r, AWSRegion a WHERE r.awsRegion = a.awsRegion AND countryCode=?';
	this.database.select(statement, [regionCode], function(results) {
		if (results instanceof IOError || results.rows.length === 0) {
			callback('us-east-1', 'shortsands-na-va');
		} else {
			var row = results.rows.item(0);
			callback(row.awsRegion, row.s3TextBucket);
		}
	});
};
VersionsAdapter.prototype.selectInstalledBibleVersions = function(callback) {
	var versList = [];
	var now = new Date().toISOString();
	var statement = 'SELECT versionCode, filename, bibleVersion FROM Identity WHERE versionCode IN (SELECT versionCode FROM InstalledVersion)';
	this.database.select(statement, [], function(results) {
		if (results instanceof IOError) {
			//
		} else {
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				versList.push([row.versionCode, row.filename, now, row.bibleVersion]);
			}
		}
		callback(versList);
	});
};
VersionsAdapter.prototype.selectAllBibleVersions = function(callback) {
	var versMap = {};
	var statement = 'SELECT i.versionCode, i.filename, i.bibleVersion, v.startDate AS installed FROM Identity i' +
		' LEFT OUTER JOIN InstalledVersion v ON v.versionCode = i.versionCode';
	this.database.select(statement, [], function(results) {
		if (results instanceof IOError) {
			//
		} else {
			for (var i=0; i<results.rows.length; i++) {
				var row = results.rows.item(i);
				versMap[row.versionCode] = {versionCode: row.versionCode, filename: row.filename, bibleVersion: row.bibleVersion, installed: row.installed};
			}
		}
		callback(versMap);
	});
};
VersionsAdapter.prototype.close = function() {
	this.database.close();		
};

/**
* This class first checks to see if the App is a first install or update.
* It finds if it is a new install by looking for tables in the Settings DB.
* It finds if it is an update by checking the App version number against a copy of the
* App version number stored in the Settings database.  If the versions are
* the same, it is not an update and nothing further needs to be done by this class.
*
* If it is a new install, it finds the Bibles stored in www, and stores their
* identity and bibleVersion in the Installed table of the Settings database.
*
* When it is an update, it first removes the Versions.db from the storageDirectory
* so that opening it will cause the new version from www to be used.
*
* When it is an update, it compares the version number of each installed Bible
* with the current version number for that Bible per the Versions.Identity table.
* When there is a new version, it deletes the current one so that it will be downloaded again.
*
* By deleting the files from the databases directory, it ensures that when one
* of those deleted databases is opened, the DatabaseHelper class will first copy
* the database from the www directory to the databases directory.
*
* NOTE: There is a simpler way of doing this that should be used if this one
* runs into problems.  This solution is as follows:
* Select fils from www and storage to find databases to create two maps
* Buildmap: {versionCode: {versionCode, filename, bibleVersion, location}..}
* Open each database in www and storage to get the version from the Identity table
* Compare the identity in version with the actual identity
* Remove all obsolete files from storage
* Perform a bulk update of Installed with the results
*/
function AppUpdater(settingStorage) {
	this.settingStorage = settingStorage;
	Object.seal(this);
}
AppUpdater.prototype.doUpdate = function(callback) {
	var that = this;
	callNative('Utility', 'appVersion', [], "S", function(appVersionCode) {
		checkIfInstall(function(isInstall) {
			console.log('Check if Install', isInstall);
			if (isInstall) {
				that.settingStorage.create(function() {
					var database = new VersionsAdapter();
					database.selectInstalledBibleVersions(function(bibleVersionList) {
						that.settingStorage.bulkReplaceInstalledVersions(bibleVersionList, function() {
							updateVersion(appVersionCode);
							//dumpSettingsDB(function() {
								callback();
							//});
						});
					});
				});
			} else {
				checkIfUpdate(appVersionCode, function(isUpdate) {
					console.log('Check if Update', isUpdate);
					if (isUpdate) {
						getStorageFiles(function(files) {
							console.log("DATABASE FILES: " + files);
							removeFile('Versions.db', function() {
								var database = new VersionsAdapter();
								database.selectAllBibleVersions(function(bibleVersionMap) {
									identifyObsolete(bibleVersionMap, function(wwwObsolete, downloadedObsolete) {
										removeWwwObsoleteFiles(wwwObsolete, function() {
											database.selectInstalledBibleVersions(function(bibleVersionList) {
												that.settingStorage.bulkReplaceInstalledVersions(bibleVersionList, function() {
													updateInstalled(downloadedObsolete, function() {
														updateVersion(appVersionCode);
														//dumpSettingsDB(function() {
															callback();
														//});							
													});
												});
											});
										});
									});
								});
							});
						});
					} else {
						callback();
					}	
				});
			}
		});
	});
	
	function checkIfInstall(callback) {
		var doFullInstall = false;
		var statement = 'SELECT count(*) AS count FROM sqlite_master WHERE type="table" AND name IN ("Settings", "Installed", "History")';
		that.settingStorage.database.select(statement, [], function(results) {
			if (results instanceof IOError) {
				console.log('SELECT sqlite_master ERROR', JSON.stringify(results));
				callback(true);
			} else {
				var num = results.rows.item(0).count;
				console.log('found tables', num);
				callback(num < 3);
			}
		});
	}
	
	function checkIfUpdate(currAppVersion, callback) {
		that.settingStorage.getAppVersion(function(appVersion) {
			callback(currAppVersion !== appVersion);
		});
	}
	
	function getStorageFiles(callback) {
		callNative('Sqlite', 'listDB', [], "S", function(files) { 
			callback(files);
		});
	}
	/**
	* There are two kinds of obsolete that this function finds: downloadedObsolete, and wwwObsolete.
	*/
	function identifyObsolete(bibleVersionMap, callback) {
		var wwwObsolete = [];
		var downloadedObsolete = [];
		that.settingStorage.getInstalledVersions(function(installedVersions) {
			var installedList = Object.keys(installedVersions);
			for (var i=0; i<installedList.length; i++) {
				var versionCode = installedList[i];
				var installedBible = installedVersions[versionCode];
				var currBible = bibleVersionMap[versionCode];
				if (installedBible.bibleVersion !== currBible.bibleVersion) {
					if (currBible.installed === null) {
						downloadedObsolete.push(currBible);
					} else {
						wwwObsolete.push(currBible);
					}
				}
			}
			//console.log('WWW OBSOLETE', wwwObsolete.slice());
			//console.log('DOWNLOAD OBSOLETE', downloadedObsolete.slice());
			callback(wwwObsolete, downloadedObsolete);
		});
	}
	
	function removeWwwObsoleteFiles(obsoleteList, callback) {
		var obsolete = obsoleteList.shift();
		if (obsolete) {
			removeFile(obsolete.filename, function() {
				removeWwwObsoleteFiles(obsoleteList, callback);
			});
		} else {
			callback();
		}
	}
	
	function updateInstalled(obsoleteVersions, callback) {
		var obsolete = obsoleteVersions.shift();
		if (obsolete) {
			that.settingStorage.removeInstalledVersion(obsolete.versionCode, function(results) {
				updateInstalled(obsoleteVersions, callback);
			});
		} else {
			callback();
		}
	}
	
	function removeFile(file, callback) {
		console.log("REMOVE DB ", file);
		callNative('Sqlite', 'deleteDB', [file], "E", function(error) {
			callback();
		});
	}
	
	function dumpSettingsDB(callback) {
		that.settingStorage.selectSettings(function(settingsMap) {
			console.log('SHOW SETTINGS', JSON.stringify(settingsMap));
			that.settingStorage.getInstalledVersions(function(installedMap) {
				var keys = Object.keys(installedMap);
				for (var i=0; i<keys.length; i++) {
					var installed = installedMap[keys[i]];
					console.log('INSTALLED', installed.filename, installed.bibleVersion);
				}
				getStorageFiles(function(files) {
					console.log('LIST STORAGE FILES', files);
					callback();
				});
			});
		});
	}
	
	function updateVersion(appVersionCode) {
		that.settingStorage.setAppVersion(appVersionCode);
	}
};
/**
* This revised FileDownloader uses the AWS plugin.
* Gary Griswold, April 2018
*/
function FileDownloader(database, locale) {
	this.database = database;
	var parts = locale.split('-');
	this.countryCode = parts.pop();
	console.log('Country Code', this.countryCode);
	if (deviceSettings.platform() === 'ios') {
		this.finalPath = '/Library/LocalDatabase/';
	} else {
		this.finalPath = '';
	}
	Object.seal(this);
}
FileDownloader.prototype.download = function(bibleVersion, callback) {
	var s3Bucket = "shortsands-oldregion";
	var s3Key = bibleVersion + ".zip";
	var filePath = this.finalPath + bibleVersion;
	callNative('AWS', 'downloadZipFile', ["SS", s3Bucket, s3Key, filePath], "E", function(error) {
		if (error == null) console.log("Download Success");
		else console.log("Download Failed", error);
		callback(error);
	});
};

/**
* This class is used to contain the fields about a version of the Bible
* as needed.
*/
function BibleVersion(langPrefCode, countryCode) {
	this.langPrefCode = langPrefCode;
	this.countryCode = countryCode;
	this.code = null;
	this.filename = null;
	this.silCode = null;
	this.langCode = null;
	this.direction = null;
	this.hasHistory = null;
	this.isQaActive = null;
	this.versionAbbr = null;
	this.localLanguageName = null;
	this.localVersionName = null;
	this.ownerCode = null;
	this.ownerName = null;
	this.ownerURL = null;
	this.copyright = null;
	this.bibleVersion = null;
	this.introduction = null;
	this.audioBookIdList = null;
	Object.seal(this);
}
BibleVersion.prototype.fill = function(filename, callback) {
	var that = this;
	var versionsAdapter = new VersionsAdapter();
	versionsAdapter.selectVersionByFilename(filename, function(row) {
		if (row instanceof IOError) {
			console.log('IOError selectVersionByFilename', JSON.stringify(row));
			that.code = 'WEB';
			that.filename = 'WEB.db';
			that.silCode = 'eng';
			that.langCode = 'en';
			that.direction = 'ltr';
			that.hasHistory = true;
			that.isQaActive = 'F';
			that.versionAbbr = 'WEB';
			that.localLanguageName = 'English';
			that.localVersionName = 'World English Bible';
			that.ownerCode = 'EBIBLE';
			that.ownerName = 'eBible.org';
			that.ownerURL = 'www.eBible.org';
			that.copyright = 'World English Bible (WEB), Public Domain, eBible.';
			that.bibleVersion = null;
		} else {
			that.code = row.versionCode;
			that.filename = filename;
			that.silCode = row.silCode;
			that.langCode = row.langCode;
			that.direction = row.direction;
			that.hasHistory = (row.hasHistory === 'T');
			that.isQaActive = row.isQaActive;
			that.versionAbbr = row.versionAbbr;
			that.localLanguageName = row.localLanguageName;
			that.localVersionName = row.localVersionName;
			that.ownerCode = row.ownerCode;
			that.ownerName = row.localOwnerName;
			that.ownerURL = row.ownerURL;
			that.copyright = row.copyright;
			that.bibleVersion = row.bibleVersion;
		}
		versionsAdapter.selectIntroduction(that.code, function(result) {
			if (result instanceof IOError) {
				that.introduction = null;
			} else {
				that.introduction = result;
			}
			callback();
		});
	});
};
BibleVersion.prototype.hasAudioBook = function(bookId) {
	if (this.audioBookIdList !== null && this.audioBookIdList.length > 2) {
		var index = this.audioBookIdList.indexOf(bookId);
		return(index >= 0);
	} else {
		return false;
	}
};

/**
* This class holds the concordance of the entire Bible, or whatever part of the Bible was available.
*/
function Concordance(adapter, wordsLookAhead) {
	this.adapter = adapter;
	this.wordsLookAhead = (wordsLookAhead) ? wordsLookAhead : 0;
	Object.freeze(this);
}
Concordance.prototype.search = function(words, callback) {
	var that = this;
	this.adapter.select(words, function(refLists) {
		if (refLists instanceof IOError) {
			callback(refLists);
		} else {
			var result = intersection(refLists);
			callback(result);
		}
	});
	function intersection(refLists) {
		if (refLists.length === 0) {
			return([]);
		}
		if (refLists.length === 1) {
			return(refLists[0]);
		}
		var mapList = [];
		for (var i=1; i<refLists.length; i++) {
			var map = arrayToMap(refLists[i]);
			mapList.push(map);
		}
		var result = [];
		var firstList = refLists[0];
		for (var j=0; j<firstList.length; j++) {
			var reference = firstList[j];
			if (presentInAllMaps(mapList, reference)) {
				result.push(reference);
			}
		}
		return(result);
	}
	function arrayToMap(array) {
		var map = {};
		for (var i=0; i<array.length; i++) {
			map[array[i]] = true;
		}
		return(map);
	}
	function presentInAllMaps(mapList, reference) {
		for (var i=0; i<mapList.length; i++) {
			if (mapList[i][reference] === undefined) {
				return(false);
			}
		}
		return(true);
	}
};
Concordance.prototype.search2 = function(words, callback) {
	var that = this;
	this.adapter.select2(words, function(refLists) {
		if (refLists instanceof IOError) {
			callback(refLists);
		} else if (refLists.length !== words.length) {
			callback([]);
		} else {
			var resultList = intersection(refLists);
			callback(resultList);
		}
	});
	function intersection(refLists) {
		if (refLists.length === 0) {
			return([]);
		}
		var resultList = [];
		if (refLists.length === 1) {
			for (var ii=0; ii<refLists[0].length; ii++) {
				resultList.push([refLists[0][ii]]);
			}
			return(resultList);
		}
		var mapList = [];
		for (var i=1; i<refLists.length; i++) {
			var map = arrayToMap(refLists[i]);
			mapList.push(map);
		}
		var firstList = refLists[0];
		for (var j=0; j<firstList.length; j++) {
			var reference = firstList[j];
			var resultItem = matchEachWord(mapList, reference);
			if (resultItem) {
				resultList.push(resultItem);
			}
		}
		return(resultList);
	}
	function arrayToMap(array) {
		var map = {};
		for (var i=0; i<array.length; i++) {
			map[array[i]] = true;
		}
		return(map);
	}
	function matchEachWord(mapList, reference) {
		var resultItem = [ reference ];
		for (var i=0; i<mapList.length; i++) {
			reference = matchWordWithLookahead(mapList[i], reference);
			if (reference == null) {
				return(null);
			}
			resultItem.push(reference);
		}
		return(resultItem);
	}
	function matchWordWithLookahead(mapRef, reference) {
		for (var look=1; look<=that.wordsLookAhead + 1; look++) {
			var next = nextPosition(reference, look);
			if (mapRef[next]) {
				return(next);
			}
		}
		return(null);
	}
	function nextPosition(reference, position) {
		var parts = reference.split(';');
		var next = parseInt(parts[1]) + position;
		return(parts[0] + ';' + next.toString());
	}
};
/**
* This class process search strings to determine if they are book chapter,
* or book chapter:verse lookups.  If so, then it processes them by dispatching
* the correct event.  If not, then it returns them to be processed as
* concordance searches.
*/
function Lookup(tableContents) {
	this.index = {};
	for (var i=0; i<tableContents.bookList.length; i++) {
		var tocBook = tableContents.bookList[i];
		this.index[tocBook.name.toLocaleLowerCase()] = tocBook;
		this.index[tocBook.abbrev.toLocaleLowerCase()] = tocBook;
	}
	Object.freeze(this);
}

Lookup.prototype.find = function(search) {
	var matches = search.match(/^(\d*)\s*(\w+)\s+(\d+):?(\d*)$/i);
	if (matches === null) {
		return(false);
	} else {
		if (matches[1].length < 1) {
			var book = matches[2].toLocaleLowerCase();
		} else {
			book = matches[1] + ' ' + matches[2].toLocaleLowerCase();
		}
		var chap = matches[3];
		var verse = (matches.length > 4) ? matches[4] : null;
		console.log('book=', book, '  chap=', chap, '  verse=', verse);
		var tocBook = this.index[book];
		if (tocBook) {
			var nodeId = tocBook.code + ':' + chap;
			if (verse) {
				nodeId += ':' + verse;
			}
			document.body.dispatchEvent(new CustomEvent(BIBLE.SHOW_PASSAGE, { detail: { id: nodeId }}));
			return(true);
		} else {
			return(false);
		}
	}
};
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
/**
* This class holds data for the table of contents of the entire Bible, or whatever part of the Bible was loaded.
*/
function TOC(adapter) {
	this.adapter = adapter;
	this.bookList = [];
	this.bookMap = {};
	this.maxRowId = 0;
	this.isFilled = false;
	Object.seal(this);
}
TOC.prototype.fill = function(callback) {
	var that = this;
	this.adapter.selectAll(function(results) {
		if (results instanceof IOError) {
			callback();
		} else {
			that.bookList = results;
			that.bookMap = {};
			for (var i=0; i<results.length; i++) {
				var tocBook = results[i];
				that.bookMap[tocBook.code] = tocBook;
				that.maxRowId = tocBook.chapterRowId + tocBook.lastChapter;
			}
			that.isFilled = true;
		}
		Object.freeze(that);
		callback();
	});
};
TOC.prototype.addBook = function(book) {
	this.bookList.push(book);
	this.bookMap[book.code] = book;
};
TOC.prototype.find = function(code) {
	return(this.bookMap[code]);
};
TOC.prototype.priorRowId = function(reference) {
	var rid = this.rowId(reference);
	return((rid && rid > 1) ? rid - 1: null);
};
TOC.prototype.nextRowId = function(reference) {
	var rid = this.rowId(reference);
	return((rid && rid < this.maxRowId) ? rid + 1: null);	
};
TOC.prototype.rowId = function(reference) {
	var current = this.bookMap[reference.book];
	var rowid = current.chapterRowId + reference.chapter;
	return(rowid);	
};
TOC.prototype.size = function() {
	return(this.bookList.length);
};
TOC.prototype.toString = function(reference) {
	return(this.find(reference.book).name + ' ' + reference.chapter + ':' + reference.verse);
};
TOC.prototype.toJSON = function() {
	return(JSON.stringify(this.bookList, null, ' '));
};/**
* This class holds the table of contents data each book of the Bible, or whatever books were loaded.
*/
function TOCBook(code, heading, title, name, abbrev, lastChapter, priorBook, nextBook, chapterRowId) {
	this.code = code || null;
	this.heading = heading || null;
	this.title = title || null;
	this.name = name || null;
	this.abbrev = abbrev || null;
	this.lastChapter = lastChapter || null;
	this.priorBook = priorBook || null;
	this.nextBook = nextBook || null; // do not want undefined in database
	this.chapterRowId = chapterRowId || null;
	if (lastChapter) {
		Object.freeze(this);
	} else {
		Object.seal(this);
	}
}/**
* This class performs localized date and time formatting.
* It is written as a distinct class, because the way this is done
* using Cordova is different than how it is done using WebKit/Node.js
*/
function DateTimeFormatter() {
	// get the students country and language information
	this.language = 'en';
	this.country = 'US';
	this.locale = this.language + '-' + this.country;
	Object.freeze(this);
}
DateTimeFormatter.prototype.localDate = function(date) {
	if (date) {
		var options = { year: 'numeric', month: 'long', day: 'numeric' };
		return(date.toLocaleString('en-US', options));
	} else {
		return('');
	}
};
DateTimeFormatter.prototype.localTime = function(date) {
	if (date) {
		var options = { hour: 'numeric', minute: 'numeric', second: 'numeric' };
		return(date.toLocaleString('en-US', options));
	} else {
		return('');
	}
};
DateTimeFormatter.prototype.localDatetime = function(date) {
	if (date) {
		var options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
		return(date.toLocaleString('en-US', options));
	} else {
		return('');
	}
};
/**
* This class will convert a number to a localized representation of the same number.
* This is used primarily for converting chapter and verse numbers, since USFM and USX
* always represent those numbers in ASCII.
*/
function LocalizeNumber(silCode) {
	this.silCode = silCode;
	switch(silCode) {
		case 'arb': // Arabic
			this.numberOffset = 0x0660 - 0x0030;
			break;
		case 'nep': // Nepali
			this.numberOffset = 0x0966 - 0x0030;
			break;
		case 'pes': // Persian
		case 'urd': // Urdu
			this.numberOffset = 0x06F0 - 0x0030;
			break;

		default:
			this.numberOffset = 0;
			break;
	}
	Object.freeze(this);
}
LocalizeNumber.prototype.toLocal = function(number) {
	if ((typeof number) === 'number') {
		return(this.convert(String(number), this.numberOffset));
	} else {
		return(this.convert(number, this.numberOffset));		
	}
};
LocalizeNumber.prototype.toTOCLocal = function(number) {
	if (number == 0) {
		return('\u2744');
	} else {
		return(this.toLocal(number));
	}
};
LocalizeNumber.prototype.toHistLocal = function(number) {
	if (number == 0) {
		return('');
	} else {
		return(this.toLocal(number));
	}
};
LocalizeNumber.prototype.toAscii = function(number) {
	return(this.convert(number, - this.numberOffset));
};
LocalizeNumber.prototype.convert = function(number, offset) {
	if (offset === 0) return(number);
	var result = [];
	for (var i=0; i<number.length; i++) {
		var char = number.charCodeAt(i);
		if (char > 47 && char < 58) { // if between 0 and 9
			result.push(String.fromCharCode(char + offset));
		} else {
			result.push(number.charAt(i));
		}
	}
	return(result.join(''));
};/**
 * This class accesses the device locale and language information using the globalization plugin
 * and the versions, platform and model of the device plugin, and the network status.
 */
var deviceSettingsPlatform = null;
var deviceSettingsModel = null;

var deviceSettings = {
	/* Deprecated, used only VersionsView */
    prefLanguage: function(callback) {
	    //Utility.locale(function(results) {
		//	callback(results[0]);
	    //});
	    callNative('Utility', 'locale', [], "S", function(results) {
		    callback(results[0]);
	    });
    },
    locale: function(callback) {
	    //Utility.locale(function(results) {
		callNative('Utility', 'locale', [], "S", function(results) {
			var locale = (results[0].length > 0) ? results[0] : 'en-US';
			var language = (results.length > 0 && results[1].length > 0) ? results[1] : 'en';
			var script = (results.length > 1) ? results[2] : '';
			var country = (results.length > 2 && results[3].length > 0) ? results[3] : 'US';
			callback(locale, language, script, country); 
	    });    
    },
    loadDeviceSettings: function() {
		//Utility.platform(function(platform) {
		callNative('Utility', 'platform', [], "S", function(platform) {
			deviceSettingsPlatform = platform.toLowerCase();
		});
		//Utility.modelName(function(model) {
		callNative('Utility', 'modelName', [], "S", function(model) {
			deviceSettingsModel = model;
		});
    },
    platform: function() {
        return(deviceSettingsPlatform);
    },
    model: function() {
        return(deviceSettingsModel);
    }
    // removed 1/10/2018
    //uuid: function() {
    //    return(device.uuid);
    //},
    //osVersion: function() {
    //    return(device.version);
    //},
    //cordovaVersion: function() {
    //    return(device.cordova);
    //},
    // removed 4/29/2018
    //connectionType: function() {
    //    return(navigator.connection.type);
    //},
    //hasConnection: function() {
    //    var type = navigator.connection.type;
    //    return(type !== 'none' && type !== 'unknown'); // not sure of correct value for UNKNOWN
    //}
};/**
* This is a helper class to remove the repetitive operations needed
* to dynamically create DOM objects.
*/
function DOMBuilder() {
	//this.rootNode = root;
}
DOMBuilder.prototype.addNode = function(parent, type, clas, content, id) {
	var node = document.createElement(type);
	if (id) node.setAttribute('id', id);
	if (clas) node.setAttribute('class', clas);
	if (content) node.textContent = content;
	parent.appendChild(node);
	return(node);
};
/**
* At this time, CSS has margin-left and margin-right capabilities, but it does not 
* have margin-right and margin-left capabilities.  That is, it does not have the 
* ability to vary the margin per direction of the text.
* https://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript
*/
function DynamicCSS() {
}
DynamicCSS.prototype.setDirection = function(direction) {
	document.body.setAttribute('style', 'direction: ' + direction);
	var sheet = document.styleSheets[0];
	if (direction === 'ltr') {
		console.log('*************** setting ltr margins');
		sheet.addRule("#codexRoot", 	"margin-left: 8%; 		margin-right: 6%;");
		sheet.addRule("p.io, p.io1", 	"margin-left: 1.0rem; 	margin-right: 0;");
		sheet.addRule("p.io2", 			"margin-left: 2.0rem; 	margin-right: 0;");
		sheet.addRule("p.li, p.li1", 	"margin-left: 2.0rem;	margin-right: 0;");
		sheet.addRule("p.q, p.q1",  	"margin-left: 3.0rem; 	margin-right: 0;");
		sheet.addRule("p.q2", 			"margin-left: 3.0rem; 	margin-right: 0;");
	} else {
		console.log('**************** setting rtl margins');
		sheet.addRule("#codexRoot", 	"margin-right: 8%; 		margin-left: 6%;");
		sheet.addRule("p.io, p.io1",	"margin-right: 1.0rem;	margin-left: 0;");
		sheet.addRule("p.io2",			"margin-right: 2.0rem;	margin-left: 0;");
		sheet.addRule("p.li, p.li1",	"margin-right: 2.0rem;	margin-left: 0;");
		sheet.addRule("p.q, p.q1",  	"margin-right: 3.0rem;	margin-left: 0;");
		sheet.addRule("p.q2", 			"margin-right: 3.0rem; 	margin-left: 0;");
	}	
};

/**
* This class presents a list of available video with thumbnails,
* and when a info btn is clicked it display more detail.
* and when the play button is clicked, it starts the video.
*/

function VideoListView(version, videoAdapter) {
	this.videoIdList = [ 'KOG_OT', 'KOG_NT', '1_jf-0-0', '1_wl-0-0', '1_cl-0-0' ];
	this.version = version;
	this.videoAdapter = videoAdapter;
	console.log('IN VIDEO VIEW ', 'ctry', this.countryCode, 'sil', this.silCode);
	this.rootNode = document.createElement('div');
	this.rootNode.id = 'videoRoot';
	document.body.appendChild(this.rootNode);
	this.viewNode = null;
	Object.seal(this);
}
VideoListView.prototype.showView = function() {
	console.log('INSIDE SHOW VIDEO LIST VIEW');
	var that = this;
	if (this.viewNode != null && this.viewNode.children.length > 0) {
		this.reActivateView();
	} else {
		this.viewNode = this.addNode(this.rootNode, 'table', 'videoList');
		var portWidth = (window.innerWidth < window.innerHeight) ? window.innerWidth : window.innerHeight;
		this.viewNode.setAttribute('width', portWidth);
		getVideoTable(this.version);
	}
	
	function getVideoTable(vers) {
		that.videoAdapter.selectJesusFilmLanguage(vers.countryCode, vers.silCode, function(lang) {
		
			that.videoAdapter.selectVideos(lang.languageId, vers.silCode, vers.langCode, vers.langPrefCode, function(videoMap) {
				for (var i=0; i<that.videoIdList.length; i++) {
					var id = that.videoIdList[i];
					var metaData = videoMap[id];
					if (metaData) {
						that.showVideoItem(metaData);
					}
				}
			});
		});
	}
};
VideoListView.prototype.reActivateView = function() {
	this.rootNode.appendChild(this.viewNode);
	var nodeList = document.getElementsByClassName('videoListDesc');
	for (var i=0; i<nodeList.length; i++) {
		nodeList[i].setAttribute('hidden', 'hidden');
	}
};
VideoListView.prototype.showVideoItem = function(videoItem) {	
	console.log('INSIDE BUILD ITEM', videoItem.mediaId);
	var that = this;
	var row = this.addNode(this.viewNode, 'tr', 'videoList');
	var cell = this.addNode(row, 'td', 'videoList');
	
	var image = this.addNode(cell, 'img', 'videoList');
	image.src = 'img/' + videoItem.mediaId + '.jpg';
	image.alt = videoItem.title;
	
	var div = this.addNode(cell, 'div', 'videList');
	this.addNode(div, 'p', 'videoListTitle', videoItem.title);
	
	var play = this.addNode(div, 'img', 'videoListPlay');
	play.setAttribute('src', 'img/play.svg');
	play.setAttribute('mediaSource', videoItem.mediaSource);
	play.setAttribute('mediaId', videoItem.mediaId);
	play.setAttribute('languageId', videoItem.languageId);
	play.setAttribute('silCode', videoItem.silCode);
	play.setAttribute('mediaURL', videoItem.mediaURL);
	play.addEventListener('click', playVideo);
	
	var info = this.addNode(div, 'img', 'videoListInfo');
	info.setAttribute('src', 'img/info.svg');

	this.addNode(div, 'p', 'videoListDur', videoItem.duration());
	
	if (videoItem.hasDescription == 1) {
		info.addEventListener('click', buildVideoDescription);
	} else {
		info.setAttribute('style', 'opacity: 0');
	}
	
	function buildVideoDescription(event) {
		if (videoItem.longDescription == null) {
			that.videoAdapter.selectDescription(videoItem.languageId, videoItem.silCode, videoItem.mediaId, function(results) {
				videoItem.longDescription = results;
				var desc = that.addNode(div, 'p', 'videoListDesc', videoItem.longDescription);
				desc.setAttribute('hidden', 'hidden');
				displayVideoDescription(desc);
			});
		} else {
			displayVideoDescription(this.nextSibling.nextSibling);
		}
	}
	
	function displayVideoDescription(descNode) {
		if (descNode.hasAttribute('hidden')) {
			descNode.removeAttribute('hidden');
		} else {
			descNode.setAttribute('hidden', 'hidden');
		}
	}
	
	function playVideo(event) {
		var mediaSource = this.getAttribute('mediaSource');
		var videoId = this.getAttribute('mediaId');
		var languageId = this.getAttribute('languageId');
		var silCode = this.getAttribute('silCode');
		var videoUrl = this.getAttribute('mediaURL');
		
        console.log("\n\BEFORE VideoPlayer " + videoId + " : " + videoUrl);
        document.dispatchEvent(new CustomEvent(BIBLE.STOP_AUDIO));
		var parameters = [mediaSource, videoId, languageId, silCode, videoUrl];
		callNative('VideoPlayer', 'showVideo', parameters, "E", function(error) {
			if (error) {
				console.log("ERROR FROM VideoPlayer " + error);
			} else {
				console.log("SUCCESS FROM VideoPlayer " + videoUrl);
			}
		});
	}
};
VideoListView.prototype.hideView = function() {
	if (this.rootNode.children.length > 0) {
		//this.scrollPosition = window.scrollY;
		for (var i=this.rootNode.children.length -1; i>=0; i--) {
			this.rootNode.removeChild(this.rootNode.children[i]);
		}
	}
};
VideoListView.prototype.addNode = function(parent, type, clas, content, id) {
	var node = document.createElement(type);
	if (id) node.setAttribute('id', id);
	if (clas) node.setAttribute('class', clas);
	if (content) node.innerHTML = content;
	parent.appendChild(node);
	return(node);
};


function VideoMetaData() {
	this.mediaSource = null;
	this.languageId = null;
	this.silCode = null;
	this.langCode = null;
	this.mediaId = null;
	this.title = null;
	//this.shortDescription = null;
	this.hasDescription = null;
	this.longDescription = null;
	this.lengthInMilliseconds = null;
	this.imageHighRes = null;
	this.imageMedRes = null;
	this.mediaURL = null;
	Object.seal(this);
}
VideoMetaData.prototype.duration = function() {
	var totalSeconds = this.lengthInMilliseconds / 1000;
	var hours = totalSeconds / 3600;
	var minutes = (hours - Math.floor(hours)) * 60;
	var seconds = (minutes - Math.floor(minutes)) * 60;
	return(Math.floor(hours) + ':' + Math.floor(minutes) + ':' + Math.floor(seconds)); 
};
VideoMetaData.prototype.toJSON = function() {
	return('videoMetaData: { languageId: ' + this.languageId +
			', silCode: ' + this.silCode +
			', langCode: ' + this.langCode +
			', mediaId: ' + this.mediaId + 
			', title: ' + this.title +
			', hasDescription: ' + this.hasDescription +
			', longDescription: ' + this.longDescription +
			', lengthInMilliseconds: ' + this.lengthInMilliseconds +
			', imageHighRes: ' + this.imageHighRes +
			', imageMedRes: ' + this.imageMedRes +
			', mediaURL: ' + this.mediaURL + ' }');
};/**
* This class opens the 
* This is a test and demonstration program that reads in locale information
* and uses it to access Jesus Film Meta Data, and parses out data that is 
* needed for processing.
*/

function VideoTableAdapter() {
	this.database = new DatabaseHelper('Versions.db', true);
	this.className = 'VideoTableAdapter';
}
/**
* Method is not used, because we always show en if nothing else is available.
*/
VideoTableAdapter.prototype.hasVideos = function(langCode, langPrefCode, callback) {
	var that = this;
	var statement = 'SELECT count(*) AS count FROM Video WHERE langCode IN (?,?)';
	this.database.select(statement, [langCode, langPrefCode], function(results) {
		if (results instanceof IOError) {
			console.log('SQL Error in VideoTableAdapter.hasVideos', results);
			callback(0);
		} else {
			callback(results.rows.item(0).count);
		}
	});
};

VideoTableAdapter.prototype.selectJesusFilmLanguage = function(countryCode, silCode, callback) {
	var that = this;
	var statement = 'SELECT languageId FROM JesusFilm WHERE countryCode=? AND silCode=? ORDER BY population DESC';
	this.database.select(statement, [ countryCode, silCode ], function(results) {
		if (results instanceof IOError) {
			console.log('SQL Error in selectJesusFilmLanguage, query 1', results);
			callback({});
		} else if (results.rows.length > 0) {
			callback(results.rows.item(0));
		} else {
			statement = 'SELECT languageId FROM JesusFilm WHERE silCode=? ORDER BY population DESC';
			that.database.select(statement, [ silCode ], function(results) {
				if (results instanceof IOError) {
					console.log('SQL Error in selectJesusFilmLanguage, query 2', results);
					callback({});	
				} else if (results.rows.length > 0) {
					callback(results.rows.item(0));
				} else {
					callback({});
				}
			});
		}
	});
};
/**
* 
*/
VideoTableAdapter.prototype.selectVideos = function(languageId, silCode, langCode, langPrefCode, callback) {
	var that = this;
	var selectList = 'SELECT languageId, mediaId, silCode, langCode, title, lengthMS, HLS_URL,' +
		' (longDescription is not NULL) AS hasDescription FROM Video';
	var statement = selectList + ' WHERE languageId IN (?,?)';
	this.database.select(statement, [ languageId, silCode ], function(results) {
		if (results instanceof IOError) {
			console.log('found Error', results);
			callback({});
		} else {
			if (results.rows.length > 0) {
				returnVideoMap(languageId, silCode, results, callback);
			} else {
				statement = selectList + ' WHERE langCode IN (?,?)';
				that.database.select(statement, [langCode, langPrefCode], function(results) {
					if (results instanceof IOError) {
						callback({});
					} else {
						if (results.rows.length > 0) {
							returnVideoMap(languageId, silCode, results, callback);
						} else {
							statement = selectList + ' WHERE langCode = "en"';
							that.database.select(statement, [], function(results) {
								if (results instanceof IOError) {
									callback({});
								} else {
									returnVideoMap(languageId, silCode, results, callback);
								}
							});
						}
					}
				});
			}
        }
	});
	
	function returnVideoMap(languageId, silCode, results, callback) {
		var videoMap = {};
		for (var i=0; i<results.rows.length; i++) {
			var row = results.rows.item(i);
			var meta = new VideoMetaData();
			meta.mediaSource = (row.mediaId.indexOf("KOG") > -1) ? "Rock" : "JFP";
			meta.languageId = languageId;
			meta.silCode = silCode;
			meta.langCode = row.langCode;
			meta.mediaId = row.mediaId;
			meta.title = row.title;
			meta.lengthInMilliseconds = row.lengthMS;
			meta.hasDescription = row.hasDescription;
			meta.mediaURL = row.HLS_URL;
			videoMap[row.mediaId] = meta;
		}
        callback(videoMap);		
	}
};
VideoTableAdapter.prototype.selectDescription = function(languageId, silCode, mediaId, callback) {
	var that = this;
	var statement = "SELECT longDescription FROM Video WHERE (languageId = ? OR silCode = ?) AND mediaID = ?";
	this.database.selectHTML(statement, [languageId, silCode, mediaId], function(results) {
		if (results instanceof IOError) {
			callback("");
		} else {
			callback(results);
		}
	});
};

