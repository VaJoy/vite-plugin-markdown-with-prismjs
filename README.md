# vite-plugin-markdown-with-prismjs

A [vite-plugin-markdown](https://github.com/hmsk/vite-plugin-markdown) based plugin enables you to import a Markdown file as various formats **with customized classes & [Prismjs](https://prismjs.com/) processing** on your vite project.

## 1. Setup

```
npm i -D vite-plugin-markdown-with-prismjs
```

## 2. Guidelines 

### Config

```js
// vite.config.js
const mdPlugin = require('vite-plugin-markdown-with-prismjs')

module.exports = {
  plugins: [mdPlugin(options)]
}
```

### Markdown File
We now can add customized classes to the HTML wrapping by writing `${classes}` in the end of each block's content.
```md
# title with multi customized classes${class-a,class-b}

- list item
- list item with customized class${class-c}

[link example${class-d}](//web.com)

img example: ![${class-e}](//pic.png)

> quote...${f}

codes will be processed by **Prism.js${g}** eventually${h,i}

'''js
var a = 1
console.log(a)
${j,k}
'''
```

output:

```html
<h1 class="class-a class-b">title with multi customized classes</h1>
<ul>
<li>list item</li>
<li class="class-c">list item with customized class</li>
</ul>
<p><a href="//web.com" class="class-d">link example</a></p>
<p>img example: <img src="//pic.png" alt="" class="class-e"></p>
<blockquote class="f">
<p >quote...</p>
</blockquote>
<p class="h i">codes will be processed by <strong class="g">Prism.js</strong> eventually</p>
<pre class="j k"><code class="language-js"><span class="token keyword">var</span> a <span class="token operator">=</span> <span class="token 
number">1</span>
console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>a<span class="token punctuation">)</span>
</code></pre>
```

## Module

```js
import { html } from './contents/the-doc.md';

console.log(html)
```

## 3. Extended Options

```js
disableCustomizedClass?: boolean = false
classPrefix?: string = ''
```

More detail of the original `Options` see [vite-plugin-markdown#options](https://github.com/hmsk/vite-plugin-markdown#options).

## License

MIT
