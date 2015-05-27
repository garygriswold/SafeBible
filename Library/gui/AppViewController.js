/**
* BibleApp is a global object that contains pointers to all of the key elements of
* a user's session with the App.
*/
"use strict"

var BIBLE = { SHOW_TOC: 'bible-show-toc', // present toc page, create if needed
		SHOW_SEARCH: 'bible-show-search', // present search page, create if needed
		SHOW_SETTINGS: 'TBD-bible-show-settings', // present settings page, create if needed
		TOC_FIND: 'bible-toc-find', // lookup a passage as result of user selection in toc
		LOOK: 'TBD-bible-look', // TBD
		SEARCH_START: 'bible-search-start', // process user entered search string
		SEARCH_FIND: 'bible-search-find', // lookup a pages as a result of user clicking on a search result
		CHG_HEADING: 'bible-chg-heading', // change title at top of page as result of user scrolling
		BACK: 'bible-back', // TBD
		FORWARD: 'bible-forward', // TBD
		LAST: 'bible-last', // TBD
		SHOW_NOTE: 'bible-show-note', // Show footnote as a result of user action
		HIDE_NOTE: 'bible-hide-note' // Hide footnote as a result of user action
	};

function AppViewController(versionCode) {
	this.versionCode = versionCode;
	this.statusBar = new StatusBar(88);
	this.statusBar.showView();
};
AppViewController.prototype.begin = function() {
	var types = new AssetType('document', this.versionCode);
	types.tableContents = true;
	types.chapterFiles = true;
	types.history = true;
	types.concordance = true;
	types.styleIndex = true;
	this.bibleCache = new BibleCache(types);
	var that = this;
	var assets = new AssetController(types);
	assets.checkBuildLoad(function(typesLoaded) {
		that.tableContents = assets.tableContents();
		console.log('loaded toc', that.tableContents.size());
		that.history = assets.history();
		console.log('loaded history', that.history.size());
		that.concordance = assets.concordance();
		console.log('loaded concordance', that.concordance.size());

		that.tableContentsView = new TableContentsView(that.tableContents);
		that.searchView = new SearchView(that.tableContents, that.concordance, that.bibleCache);
		that.codexView = new CodexView(that.tableContents, that.bibleCache, that.statusBar.hite + 7);
		Object.freeze(that);

		//that.tableContentsView.showView();
		that.searchView.showView("risen have");

		document.body.addEventListener(BIBLE.SHOW_TOC, function(event) {
			that.tableContentsView.showView();
			that.searchView.hideView();
			that.codexView.hideView();
		});
		document.body.addEventListener(BIBLE.SHOW_SEARCH, function(event) {
			that.searchView.showView();
			that.statusBar.showSearchField();
			that.tableContentsView.hideView();
			that.codexView.hideView();
		});
		document.body.addEventListener(BIBLE.TOC_FIND, function(event) {
			console.log(JSON.stringify(event.detail));
			that.codexView.showView(event.detail.id);
			that.tableContentsView.hideView();
			that.searchView.hideView();
			that.history.addEvent(event);
		});
		document.body.addEventListener(BIBLE.SEARCH_FIND, function(event) {
			console.log(JSON.stringify(event.detail));
			that.codexView.showView(event.detail.id);
			that.statusBar.showTitleField();
			that.tableContentsView.hideView();
			that.searchView.hideView();
			that.history.addEvent(event);
		});
		document.body.addEventListener(BIBLE.CHG_HEADING, function(event) {
			var ref = event.detail.reference;
			var book = that.tableContents.find(ref.book);
			that.statusBar.setTitle(book.name + ' ' + ((ref.chapter > 0) ? ref.chapter : 1));
		});
		document.body.addEventListener(BIBLE.SHOW_NOTE, function(event) {
			that.codexView.showFootnote(event.detail.id);
		});
		document.body.addEventListener(BIBLE.HIDE_NOTE, function(event) {
			that.codexView.hideFootnote(event.detail.id);
		});
	});
};
