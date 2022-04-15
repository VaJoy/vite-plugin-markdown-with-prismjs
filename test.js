var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attrs');

md.use(markdownItAttrs, {
  // optional, these are default options
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: []  // empty array = all attributes are allowed
});


var src = `
^^^ {.a}

> wrapped-block-1

wrapped-block-2

^^^
`;
var res = md.render(src);

console.log(res);