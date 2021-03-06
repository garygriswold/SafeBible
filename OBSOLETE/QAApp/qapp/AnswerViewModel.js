/**
* This class is the model supportting AnswerView.html
*/
"use strict";
function AnswerViewModel(viewNavigator) {
	this.viewNavigator = viewNavigator;
	this.httpClient = viewNavigator.httpClient;
	this.state = viewNavigator.currentState;
	this.displayReference = null;
	this.submittedDt = null;
	this.expires = null;
	this.question = null;
	this.answer = null;
	Object.seal(this);
}
AnswerViewModel.prototype.display = function() {
	setNodeValue('displayReference', 'value', this.displayReference);
	setNodeValue('submittedDt', 'value', this.submittedDt);
	setNodeValue('expiresDesc', 'value', this.expired);
	setNodeValue('question', 'value', this.question);
	setNodeValue('answer', 'value', this.answer);
	
	function setNodeValue(nodeId, type, property) {
		var node = document.getElementById(nodeId);
		if (node) {
			node[type] = property;
		}
	}
};
AnswerViewModel.prototype.setProperties = function(status, results) {
	var that = this;
	if (status === 200) {
		if (results.length) {
			firstRow(results[0]);
			if (results.length > 1) secondRow(results[1]);
		} else {
			firstRow(results);
		}
		this.display();
	}
	
	function firstRow(row) {
		that.state.discourseId = row.discourseId;
		that.state.versionId = row.versionId;
		that.state.questionTimestamp = row.timestamp;
		that.state.answerTimestamp = null;
		that.displayReference = row.reference;
		var timestamp = new Date(row.timestamp);
		that.submittedDt = timestamp.toLocaleString();
		that.question = row.message;		
	}
	function secondRow(row) {
		that.state.answerTimestamp = row.timestamp;
		that.answer = row.message;
	}
};
AnswerViewModel.prototype.assignQuestion = function() {
	var that = this;
	var postData = {versionId:this.state.versionId};
	this.httpClient.post('/assign', postData, function(status, results) {
		if (status !== 200) {
			window.alert('Unexpected Error: ' + results.message);
		} else {
			that.setProperties(status, results);
		}
	});	
};
AnswerViewModel.prototype.anotherQuestion = function() {
	var that = this;
	var postData = {versionId:this.state.versionId, discourseId:this.state.discourseId};
	this.httpClient.post('/another', postData, function(status, results) {
		if (status === 200) {
			that.setProperties(status, results);
		} else if (status === 404) { // There are no more questions
			that.viewNavigator.transition('answerView', 'queueView', 'openQuestionCount', TRANSITION.SLIDE_RIGHT);
		} else {
			that.display();
			window.alert('Unexpected Error: ' + results.message);
		}
	});
};
AnswerViewModel.prototype.saveDraft = function() {
	var that = this;
	this.answer = getNodeValue('answer', 'value');
	var postData = {discourseId:this.state.discourseId, timestamp:this.state.answerTimestamp, reference:null, message:this.answer};
	console.log('saving draft', postData);
	this.httpClient.post('/draft', postData, function(status, results) {
		if (status === 200) {
			console.log('save draft results', results);
			that.state.answerTimestamp = results.timestamp;
			window.alert('Your work has been saved.');
		} else {
			window.alert('Unexpected Error: ' + results.message);
		}
	});
	
	function getNodeValue(nodeId, type) {
		var node = document.getElementById(nodeId);
		return((node) ? node[type] : null);
	}
};

