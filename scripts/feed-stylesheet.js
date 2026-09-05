'use strict';

const fs = require('node:fs');
const path = require('node:path');

hexo.extend.filter.register('after_generate', () => {
  const feedPath = path.join(hexo.public_dir, 'atom.xml');
  if (!fs.existsSync(feedPath)) return;

  const feed = fs.readFileSync(feedPath, 'utf8');
  const stylesheetInstruction = '<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>';
  if (feed.includes(stylesheetInstruction)) return;

  const declaration = feed.match(/^<\?xml[^?]*\?>/);
  if (!declaration) return;

  // The feed generator creates atom.xml dynamically, so attach the browser stylesheet after generation.
  const styledFeed = feed.slice(0, declaration[0].length)
    + `\n${stylesheetInstruction}`
    + feed.slice(declaration[0].length);
  fs.writeFileSync(feedPath, styledFeed, 'utf8');
});
