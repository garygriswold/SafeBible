/**
* This class generates the DOM elements that control presentation and interactivity of the RolesView.html page
*/
"use strict";
function RolesViewModel(viewNavigator) {
	this.viewNavigator = viewNavigator;
	this.httpClient = viewNavigator.httpClient;
	this.state = viewNavigator.currentState;
	this.numColumns = 7;
	this.boss = null;
	this.self = null;
	this.members = null;
	this.table = new RolesTable(this.state, this.numColumns);
	Object.seal(this);
}
RolesViewModel.prototype.display = function() {
	var that = this;
	this.state.clearCache();
	iteratePersons(this.boss, 'boss');
	iteratePersons(this.self, 'self');
	iteratePersons(this.members, 'memb');
	
	function iteratePersons(list, type) {
		var priorId = null;
		var versionRowCount = 0;
		for (var i=0; i<list.length; i++) {
			var row = list[i];
			that.table.insertRow(-1, type, row.teacherId, row.fullname, row.pseudonym, row.position, row.versionId, row.created);
		}
	}
};
RolesViewModel.prototype.allCheckboxesOff = function() {
	this.table.allCheckboxesOff();
};
RolesViewModel.prototype.setProperties = function(status, results) {
	if (status === 200) {
		this.boss = results[0];
		this.self = (results.length > 0) ? results[1] : null;
		this.members = (results.length > 2) ? results[2] : null;
		this.display();
	}
};
RolesViewModel.prototype.presentRoles = function() {
	var that = this;
	this.httpClient.get('/user', function(status, results) {
		if (status !== 200) {
			if (results.message) window.alert(results.message);
			else window.alert('unknown error');
		}
		that.setProperties(status, results);
	});
};

