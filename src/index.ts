import Frontmatter from 'front-matter'
import MarkdownIt from 'markdown-it'
import { Plugin } from 'vite'
import { TransformResult } from 'rollup'
import { parseDOM, DomUtils } from 'htmlparser2'
import { Element, Node as DomHandlerNode } from 'domhandler'
import Prism from 'prismjs';

export enum Mode {
  TOC = 'toc',
  HTML = 'html',
  REACT = 'react',
  VUE = 'vue',
}

export interface PluginOptions {
  classPrefix?: string
  disableCustomizedClass?: boolean
  mode?: Mode[]
  markdown?: (body: string) => string
  markdownIt?: MarkdownIt | MarkdownIt.Options
}

const formatHTML = (html: string = '', options:PluginOptions) => {
  let res = codeFormat(html, options);
  if (!options.disableCustomizedClass) {
      res = classFormat(res, options);
  }
  return res;
}

const customizedClassHandler = (code: string = '', options:PluginOptions) => {
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
              isChildDomain = Boolean(code.match(regAbbrTag));
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

const codeFormat = (html:string, options:PluginOptions) => {
  html = html.replace(/<pre>(<code(\sclass="language\-(\w+?)")?.*?>)([\s\S]*?)<\/code><\/pre>/g,
      (s, codeTag, classAttr, language, code) => {
          language = language || 'javascript';
          let ret = customizedClassHandler(code, options);
          let newCode = Prism.highlight(ret.code, Prism.languages[language], language);
          return `<pre class="${ret.className}">${codeTag}${newCode}</code></pre>`
      });

  return html;
}

const replaceHTMLWithCustomizedClass = (options:PluginOptions, tag: string = '', tagName: string = '', code: string = '') => {
  let ret = customizedClassHandler(code, options);
  if (ret.code.match(/\$\{.+?\}/)) {
      ret.code = classFormat(ret.code, options)
  }
  
  let newTag = ret.isChildDomain ? tag : tag.replace('>', ` class="${ret.className}">`);

  return `${newTag}${ret.code}</${tagName}>`
}

const classFormat = (html: string = '', options:PluginOptions) => {
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

const markdownCompiler = (options: PluginOptions): MarkdownIt | { render: (body: string) => string } => {
  if (options.markdownIt) {
    if (options.markdownIt instanceof MarkdownIt || (options.markdownIt?.constructor?.name === 'MarkdownIt')) {
      return options.markdownIt as MarkdownIt
    } else if (typeof options.markdownIt === 'object') {
      return MarkdownIt(options.markdownIt)
    }
  } else if (options.markdown) {
    return { render: options.markdown }
  }
  return MarkdownIt({ html: true, xhtmlOut: options.mode?.includes(Mode.REACT) }) // TODO: xhtmlOut should be got rid of in next major update
}

class ExportedContent {
  #exports: string[] = []
  #contextCode = ''

  addContext(contextCode: string): void {
    this.#contextCode += `${contextCode}\n`
  }

  addExporting(exported: string): void {
    this.#exports.push(exported)
  }

  export(): string {
    return [this.#contextCode, `export { ${this.#exports.join(', ')} }`].join('\n')
  }
}

const tf = (code: string, id: string, options: PluginOptions): TransformResult => {
  if (!id.endsWith('.md')) return null

  const content = new ExportedContent()
  const fm = Frontmatter<unknown>(code)
  content.addContext(`const attributes = ${JSON.stringify(fm.attributes)}`)
  content.addExporting('attributes')

  let html = markdownCompiler(options).render(fm.body)
  html = formatHTML(html, options)

  if (options.mode?.includes(Mode.HTML)) {
    content.addContext(`const html = ${JSON.stringify(html)}`)
    content.addExporting('html')
  }

  if (options.mode?.includes(Mode.TOC)) {
    const root = parseDOM(html)
    const indicies = root.filter(
      rootSibling => rootSibling instanceof Element && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(rootSibling.tagName)
    ) as Element[]

    const toc: { level: string; content: string }[] = indicies.map(index => ({
      level: index.tagName.replace('h', ''),
      content: DomUtils.getInnerHTML(index),
    }))

    content.addContext(`const toc = ${JSON.stringify(toc)}`)
    content.addExporting('toc')
  }

  if (options.mode?.includes(Mode.REACT)) {
    const root = parseDOM(html, { lowerCaseTags: false })
    const subComponentNamespace = 'SubReactComponent'
    const codeFragments: string[] = []

    const markCodeAsPre = (node: DomHandlerNode): void => {
      if (node instanceof Element) {
        if (node.tagName.match(/^[A-Z].+/)) {
          node.tagName = `${subComponentNamespace}.${node.tagName}`
        }
        if (['pre', 'code'].includes(node.tagName) && node.attribs?.class) {
          node.attribs.className = node.attribs.class
          delete node.attribs.class
        }

        if (node.tagName === 'code') {
          const codeContent = DomUtils.getInnerHTML(node, { decodeEntities: true })
          codeFragments.push(codeContent)
          node.attribs.dangerouslySetInnerHTML = 'vfm'
          node.childNodes = []
        }

        if (node.childNodes.length > 0) {
          node.childNodes.forEach(markCodeAsPre)
        }
      }
    }
    root.forEach(markCodeAsPre)

    const h = DomUtils.getOuterHTML(root, { selfClosingTags: true })
      .replace(/dangerouslySetInnerHTML="vfm"/g, () => `dangerouslySetInnerHTML={{__html: \`${codeFragments.shift()}\`}}`)

    const reactCode = `
      const markdown =
        <div>
          ${h}
        </div>
    `
    const compiledReactCode = `
      function (props) {
        Object.keys(props).forEach(function (key) {
          SubReactComponent[key] = props[key]
        })
        ${require('@babel/core').transformSync(reactCode, { ast: false, presets: ['@babel/preset-react'] }).code}
        return markdown
      }
    `
    content.addContext(`import React from "react"\nconst ${subComponentNamespace} = {}\nconst ReactComponent = ${compiledReactCode}`)
    content.addExporting('ReactComponent')
  }

  if (options.mode?.includes(Mode.VUE)) {
    const root = parseDOM(html)
    // Top-level <pre> tags become <pre v-pre>
    root.forEach((node: DomHandlerNode) => {
      if (node instanceof Element) {
        if (['pre', 'code'].includes(node.tagName)) {
          node.attribs['v-pre'] = 'true'
        }
      }
    })

    // Any <code> tag becomes <code v-pre> excepting under `<pre>`
    const markCodeAsPre = (node: DomHandlerNode): void => {
      if (node instanceof Element) {
        if (node.tagName === 'code') node.attribs['v-pre'] = 'true'
        if (node.childNodes.length > 0) node.childNodes.forEach(markCodeAsPre)
      }
    }
    root.forEach(markCodeAsPre)

    const { code: compiledVueCode } = require('@vue/compiler-sfc').compileTemplate({ source: DomUtils.getOuterHTML(root, { decodeEntities: true }), filename: id, id })
    content.addContext(compiledVueCode.replace('\nexport function render(', '\nfunction vueRender(') + `\nconst VueComponent = { render: vueRender }\nVueComponent.__hmrId = ${JSON.stringify(id)}\nconst VueComponentWith = (components) => ({ components, render: vueRender })\n`)
    content.addExporting('VueComponent')
    content.addExporting('VueComponentWith')
  }

  return {
    code: content.export(),
  }
}

export const plugin = (options: PluginOptions = {}): Plugin => {
  return {
    name: 'vite-plugin-markdown',
    enforce: 'pre',
    transform(code, id) {
      return tf(code, id, options)
    },
  }
}

export default plugin
exports.default = plugin
