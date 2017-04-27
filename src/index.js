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

var i = 0;

if (parsed[i] !== 'markdown') {
  throw new Error('Unknown document format: ' + parsed[i]);
}

i++; // i = 1

// Find references
var references = null;
if (parsed[i] && parsed[i].references) {
  references = parsed[i].references;
  i++; // i = 2
}

// Find a title. i = 1 or 2
if (parsed[i][0] !== 'header' || parsed[i][1].level !== 1) {
  throw new Error('Could not find deck title');
}
var title = parsed[i][2];

// Deck in-progress
var deck = new AnkiExport(title);

// Find cards
(function (i) {
  var prevHeaders = {};

  for (; (i + 1) < parsed.length; ++i) {
    var headerLevel = parsed[i] && parsed[i][1] && parsed[i][1].level;

    if (headerLevel) {
      // filter out headers of higher levels
      prevHeaders = Object.keys(prevHeaders).filter(function (otherLevel) {
        return otherLevel < headerLevel;
      }).reduce(function (a, e) {
        a[e] = prevHeaders[e];
        return a;
      }, {});
    }

    if (parsed[i][0] === 'header' && headerLevel > 1 && parsed[i + 1][0] === 'para') {
      // Find end of card back - EOF or next header of equal level
      for (var j = i + 1; j < parsed.length && !(parsed[j][1].level && parsed[j][1].level <= headerLevel); j++);

      var prevHeadersVals = Object.keys(prevHeaders).map(function (k) {
        return prevHeaders[k];
      });
      var cardFront = markdown.toHTML(['markdown', { references: references }].concat(prevHeadersVals).concat([parsed[i]]));
      var cardBackSrc = parsed.splice(i+1, j - i - 1);
      var cardBack = cardFront + '<br /><br />' + markdown.toHTML(['markdown', { references: references }].concat(cardBackSrc));
      deck.addCard(cardFront, cardBack);
    } else if (headerLevel) {
      prevHeaders[headerLevel] = parsed[i];
    }
  }
}(i));

// Write out final product
deck.save().then(function (zip) {
  fs.writeFileSync(outFile, zip, 'binary');
  console.log('Wrote cards file:', outFile);
}).catch(function (err) {
  console.log('Could not save cards file:', err);
  process.exit(1);
});
