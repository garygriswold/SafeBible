#!/bin/sh
echo \"use strict\"\; > Publisher.js
cat ../Library/manufacture/AssetType.js >> Publisher.js
cat ../Library/manufacture/AssetBuilder.js >> Publisher.js
cat ../Library/manufacture/VersionStatistics.js >> Publisher.js
cat ../Library/manufacture/ChapterBuilder.js >> Publisher.js
cat ../Library/manufacture/VerseBuilder.js >> Publisher.js
cat ../Library/manufacture/TOCBuilder.js >> Publisher.js
cat ../Library/manufacture/ConcordanceBuilder.js >> Publisher.js
cat ../Library/manufacture/StyleIndexBuilder.js >> Publisher.js
cat ../Library/manufacture/StyleUseBuilder.js >> Publisher.js
cat ../Library/manufacture/DOMBuilder.js >> Publisher.js
cat ../Library/manufacture/HTMLBuilder.js >> Publisher.js
cat ../Library/model/usx/USX.js >> Publisher.js
cat ../Library/model/usx/Book.js >> Publisher.js
cat ../Library/model/usx/Cell.js >> Publisher.js
cat ../Library/model/usx/Chapter.js >> Publisher.js
cat ../Library/model/usx/Para.js >> Publisher.js
cat ../Library/model/usx/Row.js >> Publisher.js
cat ../Library/model/usx/Table.js >> Publisher.js
cat ../Library/model/usx/Verse.js >> Publisher.js
cat ../Library/model/usx/Note.js >> Publisher.js
cat ../Library/model/usx/Char.js >> Publisher.js
cat ../Library/model/usx/Ref.js >> Publisher.js
cat ../Library/model/usx/OptBreak.js >> Publisher.js
cat ../Library/model/usx/Text.js >> Publisher.js
cat ../Library/xml/XMLTokenizer.js >> Publisher.js
cat ../Library/xml/USXParser.js >> Publisher.js
cat ../Library/model/meta/Canon.js >> Publisher.js
cat ../Library/model/meta/TOC.js >> Publisher.js
cat ../Library/model/meta/TOCBook.js >> Publisher.js
cat ../Library/model/meta/Concordance.js >> Publisher.js
cat ../Library/model/meta/DOMNode.js >> Publisher.js
cat ../Library/model/meta/PubVersion.js >> Publisher.js
cat ../Library/io/IOError.js >> Publisher.js
cat ../Library/io/NodeFileReader.js >> Publisher.js
cat ../Library/io/DeviceDatabaseNode.js >> Publisher.js
cat ../Library/io/ChaptersAdapter.js >> Publisher.js
cat ../Library/io/VersesAdapter.js >> Publisher.js
cat ../Library/io/ConcordanceAdapter.js >> Publisher.js
cat ../Library/io/TableContentsAdapter.js >> Publisher.js
cat ../Library/io/StyleIndexAdapter.js >> Publisher.js
cat ../Library/io/StyleUseAdapter.js >> Publisher.js
cat ../Library/io/CharsetAdapter.js >> Publisher.js
cat ../Library/io/VersionsReadAdapter.js >> Publisher.js
cat ../Library/util/LocalizeNumber.js >> Publisher.js
cat ../Library/manufacture/AssetController.js >> Publisher.js
node Publisher.js $*

node ../Library/manufacture/CopyBiblesDev.js $*
