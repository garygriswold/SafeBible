/**
* This program executes all validations for all versions, or all validations
* for a specific version.
* It runs each test, saves the stdout results to a file, and then compares
* the results of each stdout to a previously save result.  It there is any difference,
* it stops and reports the difference.  Otherwise, it prints the 
*/

const programs = ['XMLTokenizerTest', 'USXParserTest'];
const versions = ['ERV-POR'];

const fs = require('fs')
const child = require('child_process');

executeNext(-1, 0);

function executeNext(programIndex, versionIndex) {
	if (++programIndex < programs.length) {
		executeOne(programIndex, versionIndex);
	} else {
		programIndex = 0;
		if (++versionIndex < versions.length) {
			executeOne(programIndex, versionIndex);
		}
	}
}

function executeOne(programIndex, versionIndex) {
	console.log('execute prog', programIndex, ' version=', versionIndex);
	
	var version = versions[versionIndex];
	var program = programs[programIndex];
	var command = './' + program + '.sh ' + version;
	console.log(command);
	child.exec(command, function(error, stdout, stderr) {
		if (error) {
			errorMessage(command, error);
		}
		const output = 'TEST-STDERR: ' + stderr + '\n' + 'TEST-STDOUT: ' + stdout;
		const outFile = 'output/' + version + '/' + program + '.out';
		fs.writeFile(outFile, output, function(error) {
			if (error) {
				errorMessage(outFile, error);
			}
			const testFile = 'results/' + version + '/' + program + '.out';
			var command = 'diff ' + testFile + ' ' + outFile;
			child.exec(command, function(error, stdout, stderr) {
				if (stdout && stdout.length > 0) {
					errorOutput('TEST-DIFF STDOUT:', stdout);
				}
				if (stderr && stderr.length > 0) {
					errorOutput('TEST-DIFF STDERR:', stderr);
				}
				if (error) {
					errorMessage('TEST-DIFF ERROR', error);
				}
				console.log('OK');
				executeNext(programIndex, versionIndex);
			});
		});		
	});
}
function errorMessage(description, error) {
	console.log('ERROR:', description, JSON.stringify(error));
	process.exit(1);
}
function errorOutput(description, output) {
	console.log(description, output);
	process.exit(1);
}