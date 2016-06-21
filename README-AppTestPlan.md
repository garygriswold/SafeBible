Bible App Test Plan
===================

This documents manual procedures for testing the user interface of the BibleApp.
Gary Griswold, January 1, 2016

App Icon
--------

	1. Appearance should be consistent, or at least acceptable on all devices.
	2. Name should be fully visible on all devices. (I think 13 chars max).
	3. The name should display locally for each language.
	
Splash Screen
-------------

	1. Should display properly on all devices.
	2. Startup should display a minimum of white screen and no black.

HeaderView
----------

	1. Must give room to status bar on all devices.
	2. Each button when pushed must present the corresponding page.
	3. Chapter label must update at correct times during scrolling.
	
TableContentsView
-----------------

	1. Present properly when button is pushed.
	2. First display should be at top with Genesis.
	3. Subsequent displays should display last position with chapters open.
	4. Chapter names, such as 1 Thessalonians, should not wrap.
	5. When clicking on a book, it displays the chapters and all should be visible.
	6. The chapter boxes should be well centered in the page.
	7. When clicking on the chapter, it should display properly positioned.
	
App Startup
-----------

	1. Do a fresh install of the App.  It should load the default version for the language
	2. Restart the App, it should now remember the version from the Settings DB.
	3. Change the preferred language in the App, it should still start with the same language.
	4. With preferred language changed, do a fresh install, it should start with default version for selected language.
	5. Restart the app, it should start with same version as last start.
	6. Verify that all of the versions that are listed as defaults in settingStorage.defaultVersion are in www.
	7. Somehow test condition that Version is listed, but not actually available.  App should not fail, but just fail to load version.
	
App Update
----------

	1. Do a fresh install of the App. Log should show all www/ databases checked for remove from databases/
	2. Verify that databases will open
	3. Stop the App, and restart.  Log should show version check, but no databases checked for remove from databases/
	4. Verify that databases will open
	5. Temporarily update the version number.  Log should show each previously opened database being deleted
	6. Verify databases will open
	7. Repeat the above tests on Android
	8. Temp change the directories and filenames and verify crash resistence.

CodexView
---------

	1. Display requested chapter at top.
		a. Try with large font size.
		b. Try with small font size.
		c. Try Genesis 1.
		d. Try Revelation 22.
	2. Scroll back should show chapter.
	3. Scroll forward should work continuously with little or no stopping.
	4. Scroll backward will sometimes stop at the beginning of a chapter, and then continue.
	
SearchView
----------

	1. Enter and invalid word presents a blank page.
	2. Enter a valid word presents up to 3 uses per book and an ellipsis if there are more.
	3. The verses contain the search words in bold.
	4. Selecting a word, presents that passage, scrolled to that word.
	5. Clicking back on the spyglass takes one back to the search box, and place where one left off.
	6. Clicking on the ellipsis, presents all of the verses in that chapter.
	7. Doing a search on the word 'a' does not crash the App.
	8. Typing in a reference takes one directly there.
	9. Typing in multiple words does a logical and in the search.
	10. Including a term that is not in the Bible, does not affect search (is this OK)

HistoryView
-----------

*LastItem*
	1. Startup with an empty history table, the App should start at John 1.
	2. Startup with one item in the history table, the App should start with it.
	3. Startup with more than one item in the history table, the App should start with the most recent.

*lastSearchItem*
	1. Startup with an empty history table, click search, the search field should be empty.
	2. Startup with a non-empty history table, but no search items, click search, same result.
	3. Also on item above the search parameter should be null, not undefined.
	4. Add one search item, and test that it is used on next startup.

*history buttons*
	1. Startup with empty history table, history should present empty.
	2. Add one item to history, is should display on next pan-right for history.
	3. Add another from table of contents, it should display above.
	4. Add two from search, they should each display in the correct sequence.
	5. Make multiple requests without adding to history, it should not do select.
	6. Restart program, history should be identical.

*update history*
	1. Click on history tab, and see that it becomes the top tag.
	2. Click on top tab, it should re-present the chapter.

*cleanup*
	1. Temporarily change MAX_HISTORY to 5.  Exceed 5 and verify that delete is occurring.
	2. Change MAX_HISTORY back to original value.


QuestionsView
-------------

	1. On first start, Acts 8 should be presented question and answer.
	2. On first present, Reference and Question box should present.
	3. Entry of Question should transmit to server, and be presented as Question.
	4. Entry of Question should be stored in database on server.
	5. Questions should appear on the Q&A App.
	6. Answers should appear in App once answered.
	7. Only most recent answer appears.
	8. Other answers appear when the question is clicked.
	
SettingsView
------------

	1. Font Size control should have a start position of ?
	2. Font Size control should move with easily.
	3. John 3:16 text should resize as the thumb is moved.
	4. Other text on the page should resize when the thumb is released.
	5. The last font size used should be saved for the next time the app is started cold.
	6. The default font size and the range of font sizes should be reasonable on all devices.

VersionsView
------------

	1. On first view, the versions should be a list of country names and flags.
	2. Each country name should be in the language that is dominant for that country.
	3. Clicking on a country name or flag should present a list of languages.
	4. The language bars should contain language name, scope, and copyright owner.
	5. Each language bar should contain an icon for status, cloud for to be downloaded, book for has been downloaded, and checkmark for download finished.
	6. Clicking on an already download book should make it active.
	7. Clicking on a to be downloaded icon should download it and make it active.


