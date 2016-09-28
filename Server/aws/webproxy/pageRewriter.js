/**
* This object is able to rewrite HTML pages for the purpose of using the webproxy server.
* 1. rewrite <a href="(.*)"
* 2. rewrite <link href="(.*)"
* 3. rewrite <img src="(.*)"
* 4. rewrite <script src="(.*)"
* 5. recognize http vs https requests
* 6. recognize path only URLs and regularize to full URLs
*/
"use strict";
const PROXY = 'https://fgko66i9b3.execute-api.us-west-2.amazonaws.com/latest/web?url=';
const regExp = /(<a|<link|<img|<script)( .*?)(href|src)(=")(.*?)(".*?>)/g;

var pageRewriter = function(page) {
	page = page.replace(regExp, replaceMatch);
	return(page);
}
function replaceMatch(match, p1, p2, p3, p4, p5, p6) {
	console.log(match, '  ', p1 + p2 + p3 + p4, p5, p6);
	return(p1 + p2 + p3 + p4 + PROXY + p5 + p6);
}


/**
* Unit Test of pageRewriter
*/
const fs = require('fs');
var pageIn = fs.readFileSync('testPageIn.html', {encoding:'UTF-8'});
var pageOut = pageRewriter(pageIn);
fs.writeFileSync('testPageOut.html', pageOut, {encoding: 'UTF-8'});
