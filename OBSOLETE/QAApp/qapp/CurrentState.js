/**
* This class contains the internal data model that is used by the Application.
*/
"use strict";
function CurrentState() {
	// About logged in user
	this.teacherId = null;
	this.bossId = null; // sent by get /user
	this.isBoard = false;
	this.isDirector = false;
	this.principal = null;
	this.teacher = null;
	// About members
	this.topMemberPosition = null;
	this.teachers = {};
	// About questions and answers
	this.versionId = null;
	this.discourseId = null;
	this.questionTimestamp = null;
	this.answerTimestamp = null;
	Object.seal(this);
}
CurrentState.prototype.canManageRoles = function() {
	return(this.principal || this.isDirector || this.isBoard);	
};
CurrentState.prototype.canSeeAllVersions = function() {
	return(this.isDirector || this.isBoard);
};
CurrentState.prototype.canSeeVersion = function(versionId) {
	return((this.principal && this.principal[versionId]) || (this.teacher && this.teacher[versionId]));
};
CurrentState.prototype.canAnswer = function(versionId) {
	return(this.teacher && this.teacher[versionId]);
};
CurrentState.prototype.positionsCanManage = function() {
	if (this.isBoard) {
		return(['teacher', 'principal', 'director']);
	} else if (this.isDirector) {
		return(['teacher', 'principal']);
	} else if (this.principal) {
		return(['teacher']);
	} else {
		return([]);
	}
};
CurrentState.prototype.setRoles = function(roles) {
	this.clearRoles();
	if (roles && roles.length) {
		for (var i=0; i<roles.length; i++) {
			var role = roles[i];
			switch(role.position) {
				case 'board':
					this.isBoard = true;
					break;
				case 'director':
					this.isDirector = true;
					break;
				case 'principal':
					if (this.principal === null) {
						this.principal = {};
					}
					this.principal[role.versionId] = true;
					break;
				case 'teacher':
					if (this.teacher === null) {
						this.teacher = {};
					}
					this.teacher[role.versionId] = true;
					break;
				case 'removed':
					break;
				default:
					throw new Error('Unknown position in CurrentState.setRoles');
			}
		}
	}
};
CurrentState.prototype.clearRoles = function() {
	this.isBoard = false;
	this.isDirector = false;
	this.principal = null;
	this.teacher = null;		
};
CurrentState.prototype.getTeacher = function(teacherId) {
	return(this.teachers[teacherId]);	
};
CurrentState.prototype.addTeacher = function(teacherId, nameCell, pseudoCell, row) {
	this.teachers[teacherId] = {teacherId:teacherId, fullname:nameCell, pseudonym:pseudoCell, roles:{}, row:row};
};
CurrentState.prototype.removeTeacher = function(teacherId) {
	delete this.teachers[teacherId];
};
CurrentState.prototype.getRole = function(teacherId, position, version) {
	var teacher = this.getTeacher(teacherId);
	var key = this.roleKey(position, version);
	return(teacher.roles[key]);
};
CurrentState.prototype.addRole = function(teacherId, position, version, positionCell, versionCell, createdCell, row) {
	var teacher = this.getTeacher(teacherId);
	var key = this.roleKey(position, version);
	teacher.roles[key] = {position:positionCell, versionId:versionCell, created:createdCell, row:row};
};
CurrentState.prototype.removeRole = function(teacherId, position, version) {
	var teacher = this.getTeacher(teacherId);
	var key = this.roleKey(position, version);
	delete teacher.roles[key];
};
CurrentState.prototype.roleKey = function(position, version) {
	return(position + '.' + version);
};
CurrentState.prototype.clearTeachers = function() {
	this.teachers = {};
};