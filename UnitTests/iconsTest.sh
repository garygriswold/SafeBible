#!/bin/sh

echo \"use strict\"\; > temp.js
cat ../Library/gui/icons/drawTOCIcon.js >> temp.js
cat ../Library/gui/icons/drawSearchIcon.js >> temp.js
cat ../Library/gui/icons/drawQuestionsIcon.js >> temp.js
cat ../Library/gui/icons/drawSettingsIcon.js >> temp.js
cat ../Library/gui/icons/drawSendIcon.js >> temp.js
cat iconsTest.js >> temp.js
npm start
#node temp.js