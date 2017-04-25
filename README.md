# md2anki

Converts a markdown file to the anki flashcard format.

## Install

```
npm install -g md2anki
```

## Usage

Assuming you have a `mycards.md` file with flashcard information:

```
md2anki mycards.md mycards.apkg
```

## Format

The top-level heading of the document `#` becomes the title of the overall deck.

Second-level and deeper headings with _only_ text in the body (no other sections, etc)
become card fronts, and their bodies become the card backs.

No media supported currently.

## License

MIT License, Copyright (c) 2017, Joshua Gross.
