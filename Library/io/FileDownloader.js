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
		this.finalPath = '/databases/';
	}
	Object.seal(this);
}
FileDownloader.prototype.download = function(bibleVersion, callback) {
	var s3Bucket = "shortsands-oldregion";
	var s3Key = bibleVersion + ".zip";
	var filePath = this.finalPath + bibleVersion;
	AWS.downloadZipFile(s3Bucket, s3Key, filePath, function(error) {
		if (error == null) console.log("Download Success");
		else console.log("Download Failed");
		callback(error);
	});
};

