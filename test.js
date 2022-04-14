var md = require('markdown-it')();
var markdownItAttrs = require('markdown-it-attrs');

md.use(markdownItAttrs, {
  // optional, these are default options
  leftDelimiter: '{',
  rightDelimiter: '}',
  allowedAttributes: []  // empty array = all attributes are allowed
});


var src = `
# t1
## t2 {.t2}
p1

\`\`\`js {.c1}
var a = 1;
var b = 2;
\`\`\`

\`\`\`js {.c2 data-c=hello}
var c = 1;
var d = 2;
\`\`\`
`;
var res = md.render(src);

console.log(res);