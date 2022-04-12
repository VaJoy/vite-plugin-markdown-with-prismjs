let MarkdownIt = require('markdown-it')
let Prism = require('prismjs');

const formatHTML = (html, options) => {
    let res = codeFormat(html, options);
    if (!options.disableCustomizedClass) {
        res = classFormat(res, options);
    }
    return res;
}

const customizedClassHandler = (code, options) => {
    let className = ``;
    let isChildDomain = false;

    if (!options.disableCustomizedClass) {
        if (!options.disableCustomizedClass) {
            // default for `...${class}`
            let reg = /\$\{([^\{\}]*?)\}/;
            // matching `<childElm ..>...</childElm>${class}`
            const regAtEnd = /\$\{([^\{\}]*?)\}\s*$/;
            // matching `<elm attr="xxx${class}xx" >`
            const regAbbrTag = /<[^<>]+\$\{([^\{\}]*?)\}([^<>]+)>/;
            // matching `<elm ..>..${class}</elm>`
            const regInner = /<(\w+)[^<>]*>[^<>]*\$\{([^\{\}]*?)\}\s*<\/\1>/;

            const isMatchAtEnd = code.match(regAtEnd);

            if (!isMatchAtEnd && code.match(regInner)) {

                isChildDomain = true;
                code = codeFormat(code, options)
            } else {
                isChildDomain = code.match(regAbbrTag);
                if (isChildDomain) {
                    reg = regAbbrTag;
                } else if (code.match(regAtEnd)) {
                    reg = regAtEnd;
                }

                code = code.replace(reg, (s, g = '', innerElemTail = '') => {
                    if (options.classPrefix) {
                        className += (options.classPrefix + g.split(',').join(` ${options.classPrefix}`));
                    } else {
                        className += g.replace(/,/g, ' ');
                    }

                    if (isChildDomain) {
                        return s.replace(/\$\{[^\{\}]*\}/, `${innerElemTail} class="${className}`)
                    }

                    return '';
                });
            }

            
        }
    }
    return { className, code, isChildDomain: Boolean(isChildDomain) };
}

const codeFormat = (html, options) => {
    html = html.replace(/<pre>(<code(\sclass="language\-(\w+?)")?.*?>)([\s\S]*?)<\/code><\/pre>/g,
        (s, codeTag, classAttr, language, code) => {
            language = language || 'javascript';
            let ret = customizedClassHandler(code, options, 'pre');
            let newCode = Prism.highlight(ret.code, Prism.languages[language], language);
            return `<pre class="${ret.className}">${codeTag}${newCode}</code></pre>`
        });

    return html;
}

const replaceHTMLWithCustomizedClass = (options, tag, tagName, code) => {
    let ret = customizedClassHandler(code, options, tagName);
    if (ret.code.match(/\$\{.+?\}/)) {
        ret.code = classFormat(ret.code, options)
    }
    
    let newTag = ret.isChildDomain ? tag : tag.replace('>', ` class="${ret.className}">`);

    return `${newTag}${ret.code}</${tagName}>`
}

const classFormat = (html, options) => {
    const parentDomainTpls = ['blockquote'];

    html = html.replace(/(<(\w+?).*?>)(.*?\$\{.+?\}.*?)<\/\2>/g, (s, tag, tagName, code) => {
        return replaceHTMLWithCustomizedClass(options, tag, tagName, code)
    });

    parentDomainTpls.forEach((tagname) => {
        const reg = new RegExp(`<${tagname}>([\\s\\S]*?)(class="[^"]*")`, 'g');
        html = html.replace(reg, (s, g1, g2) => {
            return `<${tagname} ${g2}>${g1}`
        })
    })

    return html
}

var md = MarkdownIt({ html: true, })

var result = md.render(`
# title with multi customized classes\${class-a,class-b}

- list item
- list item with customized class\${class-c}

[link example\${class-d}](//web.com)

img example: ![\${class-e}](//pic.png)

> quote...\${f}

codes will be processed by **Prism.js\${g}** eventually\${h,i}

\`\`\`js
var a = 1
console.log(a)
\${j,k}
\`\`\`
`);

// var result = md.render(`
// codes will be processed by **Prism.js\${g}** eventually\${h,i}
// `);


console.log(formatHTML(result, {}))