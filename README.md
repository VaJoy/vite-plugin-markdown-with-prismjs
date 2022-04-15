# vite-plugin-markdown-with-prismjs

A plugin based on [vite-plugin-markdown](https://github.com/hmsk/vite-plugin-markdown) & combines [markdown-it-attrs](https://github.com/arve0/markdown-it-attrs) enables you to import a Markdown file as various formats **with [Prismjs](https://prismjs.com/) processing** on your vite project.

![](./GIF.gif)

## 1. Setup

```
npm i -D vite-plugin-markdown-with-prismjs
```

## 2. Guidelines 

### Config

```js
// vite.config.js
/** commonjs **/
const mdPlugin = require('vite-plugin-markdown-with-prismjs');
const options = {mode: ['html']};

module.exports = {
  plugins: [mdPlugin(options)]
}

/** esm **/
import mdPlugin from 'vite-plugin-markdown-with-prismjs'
module.exports = {
  plugins: [mdPlugin.plugin(options)]  // use mdPlugin.plugin API under esm mode
}
```

### Markdown File
All the code blocks will be processed by Prismjs.

> `[toc]` syntax is now optional supported as well. You sholud write `[toc]` on top as using this featrue.

> Btw, you can wrap certain blocks by `^^^` syntax (see example belows).

```md
[toc]
# t1
## t2 {.t2}

p1
# t2
ˋˋˋjs {.c1}
var a = 1;
var b = 2;
ˋˋˋ

^^^ {.wrapper-class}

> wrapped-block-1

wrapped-block-2

^^^

ˋˋˋjs {.c2 data-c=hello}
var c = 1;
var d = 2;
ˋˋˋ

## t2-1
### t2-1-1
```

output:

```html
  <ul class="toc-container">
    <li class="level-1">t1</li>
    <li class="level-2">t2</li>
    <li class="level-1">t2</li>
    <li class="level-2">t2-1</li>
    <li class="level-3">t2-1-1</li>
  </ul>
  <h1>t1</h1>
  <h2 class="t2">t2</h2>
  <p>p1</p>
  <h1>t2</h1>
  <pre class="c1 language-js"><code class="language-js" v-pre="true"><span class="token keyword">var</span> a <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
  <span class="token keyword">var</span> b <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">;</span>
  </code></pre>
  <div class="wrapper-class">
    <blockquote>
      <p>wrapped-block-1</p>
    </blockquote>
    <p>wrapped-block-2</p>
  </div>
  <pre class="c2 language-js" data-c="hello"><code class="language-js" v-pre="true"><span class="token keyword">var</span> c <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
  <span class="token keyword">var</span> d <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">;</span>
  </code></pre>
  <h2>t2-1</h2>
  <h3>t2-1-1</h3>
```

## Module

```js
import { html } from './contents/the-doc.md';

console.log(html)
```

## 3. APIs

More details see [vite-plugin-markdown#options](https://github.com/hmsk/vite-plugin-markdown#options) and [https://github.com/arve0/markdown-it-attrs#usage](https://github.com/arve0/markdown-it-attrs#usage).

## License

MIT
