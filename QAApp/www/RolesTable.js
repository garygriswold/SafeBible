/**
* This class maintains the display table of persons and roles.  It is filled
* with selected data, and updated by user interaction.
*/
"use strict";
function RolesTable(currentState, numColumns) {
	this.state = currentState;
	this.numColumns = numColumns;
	this.tBody = null;
	this.buttonRow = null;
}
RolesTable.prototype.insertRow = function(index, type, teacherId, fullname, pseudonym, position, versionId, created) {
	var firstRow = null;
	var teacher = this.state.getTeacher(teacherId);
	if (teacher == null) {
		firstRow = this.addTableRow(index);
		var check1 = this.addTableCell(firstRow);
		if (type === 'memb') {
			this.addCheckbox(check1, teacherId);
		}
		var nameCell = this.addTableCell(firstRow, fullname);
		var pseudoCell = this.addTableCell(firstRow, pseudonym);
		var blankCell = this.addTableCell(firstRow);
		blankCell.setAttribute('colspan', 4);
		blankCell.setAttribute('class', 'roleHead');
		this.state.addTeacher(teacherId, nameCell, pseudoCell, firstRow);
	} else {
		firstRow = teacher.row;
	}
	var rowCount = Number(firstRow.cells[0].getAttribute('rowspan')) + 1;
	for (var i=0; i<3; i++) {
		firstRow.cells[i].setAttribute('rowspan', rowCount);
	}
	var newRow = this.addTableRow(index);
	if (type === 'boss') {
		this.addTableCell(newRow, 'director');
		var blank = this.addTableCell(newRow);
		blank.setAttribute('colspan', 3);
	} else {
		var positionCell = this.addTableCell(newRow, position);
		var versionCell = this.addTableCell(newRow, versionId);
		var createdCell = this.addTableCell(newRow, created);
		var check2 = this.addTableCell(newRow);
		this.addCheckbox(check2, teacherId, position, versionId);
		this.state.addRole(teacherId, position, versionId, positionCell, versionCell, createdCell, newRow);
	}
};
RolesTable.prototype.deleteRole = function(teacherId, position, version) {
	var teacher = this.state.getTeacher(teacherId);
	var rowCount = Number(teacher.row.cells[0].getAttribute('rowspan')) - 1;
		for (var i=0; i<3; i++) {
			teacher.row.cells[i].setAttribute('rowspan', rowCount);
		}
	var role = this.state.getRole(teacherId, position, version);
	var rowIndex = role.row.rowIndex;
	this.tBody.deleteRow(rowIndex - 2);
	this.state.removeRole(teacherId, position, version);
};
RolesTable.prototype.addTableRow = function(index) {
	if (this.tBody === null) {
		this.tBody = document.getElementById('rolesBody');
	}
	var row = this.tBody.insertRow(index); // -1 index inserts at end
	row.setAttribute('class', 'role');
	return(row);	
};
RolesTable.prototype.addTableCell = function(row, content) {
	var cell = row.insertCell();
	cell.setAttribute('class', 'role');
	cell.setAttribute('rowspan', 1);
	if (content) {
		cell.textContent = content;
	}
	return(cell);
};
RolesTable.prototype.addCheckbox = function(cell, teacherId, position, versionId) {
	var that = this;
	var input = document.createElement('input');
	var id = (position && versionId) ? teacherId + '.' + position + '.' + versionId : teacherId;
	input.setAttribute('id', id);
	input.setAttribute('type', 'checkbox');
	input.setAttribute('class', 'role');
	cell.appendChild(input);
	input.addEventListener('change', function(event) {
		if (event.target.checked) {
			if (that.buttonRow === null) { // only turn button if none others are on
				var tableRow = this.parentElement.parentElement;
				var parts = this.id.split('.');
				var clickedTeacherId = parts[0];
				var clickedPosition = (parts.length > 1) ? parts[1] : null;
				var clickedVersionId = (parts.length > 2) ? parts[2] : null;
				console.log('clicked', clickedTeacherId, clickedPosition, clickedVersionId);
				if (clickedVersionId) {
					that.displayVersionUpdateButtons(tableRow, clickedTeacherId, clickedPosition, clickedVersionId);
				} else {
					that.displayPersonUpdateButtons(tableRow, clickedTeacherId);
				}
			} else {
				event.target.checked = false;//don't turn on, because another button is on
			}
		} else {
			that.closeButtonRow();
		}
	});
	return(input);
};
RolesTable.prototype.closeButtonRow = function() {
	if (this.buttonRow) {
		this.buttonRow.close();
		this.buttonRow = null;
	}	
};
RolesTable.prototype.allCheckboxesOff = function() {
	for (var i=0; i<this.tBody.rows.length; i++) {
		var row = this.tBody.rows[i];
		turnOffCheckbox(row.cells[0]);
		turnOffCheckbox(row.cells[row.cells.length -1]);
	}
	function turnOffCheckbox(cell) {
		if (cell.children && cell.children.length > 0 && cell.firstChild.nodeName === 'INPUT' && cell.firstChild.checked) {
			cell.firstChild.checked = false;
		}	 
	}
};
RolesTable.prototype.displayPersonUpdateButtons = function(parent, teacherId) {
	var that = this;
	this.buttonRow = new ButtonRow(parent, this);
	this.buttonRow.addButton('Change Name', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.name(teacherId);
		that.closeButtonRow();		
	});
	this.buttonRow.addButton('New Pass Phrase', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.passPhrase(teacherId);
		that.closeButtonRow();		
	});
	this.buttonRow.addButton('Replace Person', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.replace(teacherId);
		that.closeButtonRow();		
	});
	// This is only possible for someone who has a boss.
	this.buttonRow.addButton('Promote Person', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.promote(teacherId);
		that.closeButtonRow();		
	});
	// This is not possible of authorizing person has no principal under them.
	this.buttonRow.addButton('Demote Person', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.demote(teacherId);
		that.closeButtonRow();	
	});
	this.buttonRow.open();
};
RolesTable.prototype.displayVersionUpdateButtons = function(parent, teacherId, position, versionId) {
	var that = this;
	this.buttonRow = new ButtonRow(parent, this);
	this.buttonRow.addButton('Add Role', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.addRole(teacherId);
		that.closeButtonRow();
	});
	this.buttonRow.addButton('Remove Role', function(event) {
		var roleForms = that.buttonRow.createRoleForms();
		roleForms.removeRole(teacherId, position, versionId);
		that.closeButtonRow();
	});
	this.buttonRow.open();
};
