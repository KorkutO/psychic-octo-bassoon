# Blossom Chess

A free static chess puzzle trainer for GitHub Pages.

## What it uses

- **Hosting:** GitHub Pages, free for this public repository.
- **Move legality:** `chess.js`, an open-source BSD-2-Clause chess rules library.
- **Expandable puzzle source:** the Lichess puzzle database, released as CC0/public-domain data at <https://database.lichess.org/>.

The current version includes a small starter puzzle set directly in `script.js`. A larger Lichess CC0 puzzle slice can be converted to JSON later.

## Structure

- `index.html` - main website and trainer layout
- `styles.css` - visual design and board styling
- `script.js` - puzzle data, board rendering, and chess move checking

## Live site

After GitHub Pages builds, the site should be available at:

`https://korkuto.github.io/psychic-octo-bassoon/`
