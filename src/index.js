#!/usr/bin/env node
/**
 * md2anki - convert markdown files to anki flashcard files.
 *
 * Copyright (c) 2017, Joshua Gross, All Rights Reserved
 * MIT license.
 */

var fs         = require('fs');
var AnkiExport = require('anki-apkg-export').default;
var markdown   = require('markdown').markdown;

if (process.argv.length < 4) {
  throw new Error('Call md2anki with an input file and output file: `md2anki in.md out.apkg`');
}

var inFile  = process.argv[process.argv.length - 2];
var outFile = process.argv[process.argv.length - 1];

// Read infile
var inContents = fs.readFileSync(inFile).toString();

// Parse markdown contents
var parsed = markdown.parse(inContents);

if (parsed[0] !== 'markdown') {
  throw new Error('Unknown document format: ' + parsed[0]);
}

// Find a title
if (parsed[1][0] !== 'header' || parsed[1][1].level !== 1) {
  throw new Error('Could not find deck title');
}
var title = parsed[1][2];

// Deck in-progress
var deck = new AnkiExport(title);

// Find cards
(function () {
  for (var i = 2; i < parsed.length; ++i) {
    if (parsed[i][0] === 'header' && parsed[i][1].level > 1 && parsed[i+1][0] === 'para') {
      var cardFront = parsed[i][2];
      var cardBack = parsed[i+1][1];
      deck.addCard(cardFront, cardBack);
    }
  }
}());

// Write out final product
deck.save().then(function (zip) {
  fs.writeFileSync(outFile, zip, 'binary');
  console.log('Wrote cards file:', outFile);
}).catch(function (err) {
  console.log('Could not save cards file:', err);
  process.exit(1);
});
