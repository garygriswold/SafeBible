/**
* This class generates the DOM elements that control presentation and interactivity of the RolesView.html page
*/
"use strict";
function RolesViewModel(viewNavigator) {
	this.viewNavigator = viewNavigator;
	this.httpClient = viewNavigator.httpClient;
	this.state = viewNavigator.currentState;
	this.boss = null;
	this.self = null;
	this.members = null;
	Object.seal(this);
}
RolesViewModel.prototype.display = function() {
	var that = this;
	var root = document.getElementById('rolesBody');
	
	iteratePersons(this.boss, 'boss');
	iteratePersons(this.self, 'self');
	iteratePersons(this.members, 'memb');
	
	function iteratePersons(list, type) {
		console.log('PROCESS', type, list);
		var priorId = null;
		for (var i=0; i<list.length; i++) {
			var row = list[i];
			var line = addNode(root, 'tr');
			if (row.teacherId !== priorId) {
				priorId = row.teacherId;
				
				var check1 = addNode(line, 'td');
				if (type === 'memb') {
					addCheckbox(check1, row.teacherId);
				}
				var name = addNode(line, 'td', row.fullname);
				var pseudo = addNode(line, 'td', row.pseudonym);
			} else {
				check1.setAttribute('rowspan', 2);
				name.setAttribute('rowspan', 2);
				pseudo.setAttribute('rowspan', 2);
			}
			if (type === 'boss') {
				addNode(line, 'td', 'super');
				var blank = addNode(line, 'td');
				blank.setAttribute('colspan', 4);
			} else {
				addNode(line, 'td', row.position);
				addNode(line, 'td', row.versionId);
				addNode(line, 'td', row.created);
				addNode(line, 'td');//count
				var check2 = addNode(line, 'td');
				addCheckbox(check2, row.teacherId, row.versionId, row.position);
			}
		}
	}
	
	function addNode(parent, elementType, content) {
		var element = document.createElement(elementType);
		element.setAttribute('class', 'role');
		if (content) {
			element.textContent = content;
		}
		parent.appendChild(element);
		return(element);
	}
	function addCheckbox(parent, teacherId, versionId, position) {
		//console.log('INSIDE ADD CHECKBOX', teacherId, type);
		var element = document.createElement('input');
		element.setAttribute('type', 'checkbox');
		var id = 'id.' + teacherId;
		if (versionId && position) {
			id += '.' + versionId + '.' + position;
		}
		element.setAttribute('id', id);
		element.setAttribute('class', 'role');
		parent.appendChild(element);
		element.addEventListener('change', function(event) {
			var parts = this.id.split('.');
			var clickedTeacherId = parts[1];
			var clickedVersionId = (parts.length > 2) ? parts[2] : null;
			var clickedPosition = (parts.length > 3) ? parts[3] : null;
			console.log('clicked', clickedTeacherId, clickedVersionId, clickedPosition)
			if (clickedVersionId) {
				// call functions to display position buttons
			} else {
				// call functions to display name buttons
			}
		});
	}
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