#!/bin/sh
cat ../model/usx/USX.js > temp.js
cat ../model/usx/Book.js >> temp.js
cat ../model/usx/Chapter.js >> temp.js
cat ../model/usx/Para.js >> temp.js
cat ../model/usx/Verse.js >> temp.js
cat ../model/usx/Note.js >> temp.js
cat ../model/usx/Char.js >> temp.js
cat ../model/usx/Text.js >> temp.js
cat ../xml/XMLTokenizer.js >> temp.js
cat ../xml/USXParser.js >> temp.js
cat ../model/meta/TOC.js >> temp.js
cat ../model/meta/TOCBook.js >> temp.js
cat ../model/meta/Concordance.js >> temp.js
cat ../model/meta/StyleIndex.js >> temp.js
cat ../io/CommonIO.js >> temp.js
cat ../io/NodeFileReader.js >> temp.js
cat ../io/NodeFileWriter.js >> temp.js
cat ChapterBuilder.js >> temp.js
cat TOCBuilder.js >> temp.js
cat ConcordanceBuilder.js >> temp.js
cat StyleIndexBuilder.js >> temp.js
cat HTMLBuilder.js >> temp.js
cat AssetBuilder.js >> temp.js
cat AssetBuilderTest.js >> temp.js
node temp.js