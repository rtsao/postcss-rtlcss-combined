# PostCSS-RTLCSS-Combined [![Build Status][ci-img]][ci]

[PostCSS] plugin that creates a combined LTR/RTL stylesheet

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/rtsao/postcss-rtlcss-combined.svg
[ci]:      https://travis-ci.org/rtsao/postcss-rtlcss-combined

```css
.foo {
    color: red;
    left: 10px;
    border-color: red blue green orange
}
```

```css
.foo {
    color: red;
    border-color: red blue green orange
}
html[dir="ltr"] .foo {
    left: 10px
}
html[dir="rtl"] .foo {
    border-color: red orange green blue;
    right: 10px
}
```

## Usage

```js
postcss([ require('postcss-rtlcss-combined') ])
```

See [PostCSS] docs for examples for your environment.
