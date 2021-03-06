#!/bin/sh -ve

sqlite3 Versions.db < Versions.sql
sqlite Versions.db < VideoCreate.sql
sqlite Versions.db < VideoUpdate.sql

# Creates JesusFilm table and populates it from the Jesus Film API
node js/JesusFilmImporter.js

# Adds Bible and Video descriptions from files into Versions.db.  And signed URLs
node js/VersionAdapter.js

# Copy Bible Files into project based upon content of InstalledVersion table
node js/InstallVersions.js

# Build Identity Table in Versions.db
node js/VersionIdentity.js

# Erase video descriptions in English for non-English languages
sqlite Versions.db <<END_SQL
update video set longDescription=null where silCode != 'eng' and mediaId='1_jf-0-0' and longDescription = (select longDescription from video where silCode='eng' and mediaId='1_jf-0-0');
update video set longDescription=null where silCode != 'eng' and mediaId='1_wl-0-0' and longDescription = (select longDescription from video where silCode='eng' and mediaId='1_wl-0-0');
update video set longDescription=null where silCode != 'eng' and mediaId='1_cl-0-0' and longDescription = (select longDescription from video where silCode='eng' and mediaId='1_cl-0-0');
vacuum;
END_SQL

# Create Audio Meta Data files in the output subdirectory
#node js/AudioDBPImporter.js
python py/AudioDBPImporter.py

# Insert Audio MetaData Files
sqlite Versions.db <<END_SQL2
DROP TABLE IF EXISTS AudioBook;
DROP TABLE IF EXISTS Audio;
DROP TABLE IF EXISTS AudioVersion;
END_SQL2
sqlite Versions.db < output/AudioVersionTable.sql
sqlite Versions.db < output/AudioTable.sql
sqlite Versions.db < output/AudioBookTable.sql
sqlite Versions.db < output/AudioChapterTable.sql
# Note: The current AudioDBPImporter is not creating an AudioChapterTable.sql, 
# Hence the old file is being picked up.

#cp Versions.db ../SafeBible/SafeBible_iOS/SafeBible/www/
#cp Versions.db ../SafeBible/SafeBible_Android/app/src/main/assets/www/
#cp Versions.db ../Plugins/AudioPlayer/src/ios/AudioPlayer_TestHarness/AudioPlayer_TestHarness/www/

## cp Versions.db ../Plugins/AudioPlayer/src/ios/AudioPlayer/Versions.db
sqldiff Versions.db orig_Versions.db 



