/**
* This class presents the list of available versions to download
*/
function VersionsView() {
	this.database = new VersionsAdapter()
	this.root = null;
	this.rootNode = document.getElementById('settingRoot');
	this.dom = new DOMBuilder();
	this.scrollPosition = 0;
	Object.seal(this);
}
VersionsView.prototype.showView = function() {
	if (! this.root) {
		this.buildCountriesList();
	} 
	else if (this.rootNode.children.length < 1) {
		this.rootNode.appendChild(this.root);
		window.scrollTo(10, this.scrollPosition);
	}
};
VersionsView.prototype.hideView = function() {
	if (this.rootNode.children.length > 0) {
		this.scrollPosition = window.scrollY; // save scroll position till next use.
		this.rootNode.removeChild(this.root);
	}
};
VersionsView.prototype.buildCountriesList = function() {
	var that = this;
	var root = document.createElement('ul');
	this.database.selectCountries(function(results) {
		if (! (results instanceof IOError)) {
			for (var i=0; i<results.length; i++) {
				var row = results[i];
				var countryNode = that.dom.addNode(root, 'li', 'ctry', row.localName, 'cty' + row.countryCode);
				countryNode.addEventListener('click', countryClickHandler);
			}
		}
		that.rootNode.appendChild(root);
		that.root = root;
	});
	
	function countryClickHandler(event) {
		this.removeEventListener('click', countryClickHandler);
		console.log('user clicked in', this.id);
		that.buildVersionList(this);
	}
};
VersionsView.prototype.buildVersionList = function(parent) {
	var that = this;
	var countryCode = parent.id.substr(3);
	var versionNodeList = document.createElement('div');
	this.database.selectVersions(countryCode, function(results) {
		if (! (results instanceof IOError)) {
			for (var i=0; i<results.length; i++) {
				var row = results[i];
				var versionNode = that.dom.addNode(versionNodeList, 'div');
				that.dom.addNode(versionNode, 'p', 'langName', row.localLanguageName);
				that.dom.addNode(versionNode, 'p', 'versName', versionName(row));
				that.dom.addNode(versionNode, 'p', 'copy', copyright(row));
				
				versionNode.addEventListener('click', versionClickHandler);
			}
			parent.appendChild(versionNodeList);
		}
	});
	
	function versionClickHandler(event) {
		this.removeEventListener('click', versionClickHandler);
		console.log('click on version');
	}
	
	function versionName(row) {
		if (row.localVersionName && row.localVersionName.length > 0) {
			return(row.localVersionName);
		}
		switch(row.scope) {
			case 'BIBLE':
				return('Bible');
			case 'NT':
				return('New Testament');
			case 'PNT':
				return('Partial New Testament');
			default:
				return(row.scope);
		}
	}
	function copyright(row) {
		if (row.copyrightYear === 'PUBLIC') {
			return(row.ownerName + ' Public Domain');
		} else {
			return('c' + '  Copyright ' + row.ownerName + ', ' + row.copyrightYear);
		}
	}
};