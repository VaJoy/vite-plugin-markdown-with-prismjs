let MarkdownIt = require('markdown-it')
let Prism = require('prismjs')
let he = require('he')

const formatHTML = (html, options) => {
    if (!options.disableCustomizedClass) {
        html = classFormat(html, options)
    }

    html = codeFormat(html, options)
    return html
}
const decodeEntry = (html, options) => {
    if (!options.disableDecodeEntry) {
        return he.decode(html)
    }

    return html
}

const customizedClassHandler = (code, options) => {
    let className = ''
    let isChildDomain = false


    if (!options.disableCustomizedClass) {
        // default for `...${class}`
        let reg = /\$\{([^{}]*?)\}/
        // matching `<childElm ..>...</childElm>${class}`
        const regAtEnd = /\$\{([^{}]*?)\}\s*$/
        // matching `<elm attr="xxx${class}xx" >`
        const regAbbrTag = /<[^<>]+\$\{([^{}]*?)\}([^<>]+)>/
        // matching `<elm ..>..${class}</elm>`
        const regInner = /<(\w+)[^<>]*>[^<>]*\$\{([^{}]*?)\}\s*<\/\1>/

        const isMatchAtEnd = code.match(regAtEnd)

        if (!isMatchAtEnd && code.match(regInner)) {

            isChildDomain = true
            code = classFormat(code, options)
        } else {
            isChildDomain = Boolean(code.match(regAbbrTag))
            if (isChildDomain) {
                reg = regAbbrTag
            } else if (code.match(regAtEnd)) {
                reg = regAtEnd
            }

            code = code.replace(reg, (s, g = '', innerElemTail = '') => {
                if (options.classPrefix) {
                    className += (options.classPrefix + g.split(',').join(` ${options.classPrefix}`))
                } else {
                    className += g.replace(/,/g, ' ')
                }

                if (isChildDomain) {
                    return s.replace(/\$\{[^{}]*\}/, `${innerElemTail} class="${className}`)
                }

                return ''
            })
        }

    }
    return { className, code, isChildDomain: Boolean(isChildDomain) }
}

const codeFormat = (html, options) => {
    html = html.replace(/<pre(\sclass="[^"]+")?><code>([\s\S]+?)<\/code><\/pre>/g,
        (s, classes = '', code) => {
            const match = classes.match(/\slanguage-(\w+)"/) || []
            const language = match[1] || 'javascript'
            code = decodeEntry(code, options)
            const newCode = Prism.highlight(code, Prism.languages[language], language)
            return `<pre${classes}><code class="language-${language}">${newCode}</code></pre>`
        })

    return html
}

const replaceHTMLWithCustomizedClass = (options, tag='', tagName='', code='') => {
    const ret = customizedClassHandler(code, options)
    if (ret.code.match(/\$\{[\w-,]+?\}/)) {
        ret.code = classFormat(ret.code, options)
    }

    const newTag = ret.isChildDomain ? tag : combineClassesToTag(tag, ret.className)

    return `${newTag}${ret.code}</${tagName}>`
}


const combineClassesToTag = (tag = '', classes = '') => {
    return tag.replace(/(class="(.*?)")?>/, (s, g1='', g2='') => {
        const newClasses = `${classes} ${g2}`
        return `${g1 ? '' : ' '}class="${newClasses.trim()}">`
    })
}

const classFormat = (html, options) => {
    const parentDomainTags = ['blockquote', 'pre']

    html = html.replace(/(<(\w+?)[^>]*?>)((((?!\2>)[\s\S])*)\$\{[\w-,]+?\}.*?)\s?<\/\2>/g, (s, tag, tagName, code) => {
        return replaceHTMLWithCustomizedClass(options, tag, tagName, code)
    })

    parentDomainTags.forEach((tagname) => {
        const reg = new RegExp(`<${tagname}>\\s?(<[^>]+)(class="[^"]*")`, 'g')
        html = html.replace(reg, (s, g1='', g2='') => {
            return `<${tagname} ${g2}>${g1.trim()}`
        })
    })

    return html
}

var md = MarkdownIt({ html: true })

var result = md.render(`
# title with multi customized classes\${class-a,class-b}

> 引用！！！
- list item\${class-c}
- list item with customized class

[link example\${class-d}](//web.com)

img example: ![\${class-e}](//pic.png)

- 1.1
	- 1.1.1
	- 1.1.2
- 2.1

> quote...\${f}

codes will be processed by **Prism.js\${g}** eventually\${h,i}

\`\`\`js
a<b
\`\`\`

\`\`\`js
  let d = a < b
 \${j,k}
\`\`\`
`)

// var result = md.render(`
// codes will be processed by **Prism.js\${g}** eventually\${h,i}
// `);

//console.log(result, '\n========\n');
console.log(formatHTML(result, {}))