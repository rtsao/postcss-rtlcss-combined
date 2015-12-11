var postcss = require('postcss');
var postcssJs = require('postcss-js');
var selectorParser = require('postcss-selector-parser');

var rtlcss = require('rtlcss');

var prune = require('null-prune');
var differ = require('loot-diff');
var dedupe = require('./dedupe-keys');

var prefixDir = postcss.plugin('postcss-dir-prefix', function (opts) {
    opts = opts || {};

    var dirSelector = selectorParser.attribute({
        attribute: 'dir',
        operator: opts.dir && '=',
        value: opts.dir && '"' + opts.dir + '"'
    });

    function addDir(selector) {
        if (hasHtmlSelectorPrefix(selector)) {
            selector.first.insertAfter(selector.first.nodes[0], dirSelector);
        } else {
            selector.first.nodes = [
                selectorParser.tag({value: 'html'}),
                dirSelector,
                selectorParser.combinator({value: ' '}),
            ].concat(selector.first.nodes);
        }
    };

    return function (css) {
        css.walkRules(function (rule) {
            if (rule.nodes.length) {
                rule._originalSelector = rule.selector;
                rule.selectors = rule.selectors.map(function(selector) {
                    return selectorParser(addDir).process(selector).result;
                });
            } else {
                rule.remove();
            }
        });
    };
});

module.exports = postcss.plugin('postcss-rtlcss-combined', function (opts) {

    opts = opts || {};

    var rtlify = postcssJs.sync([ rtlcss() ]);

    return function (css, result) {

        var ltr = postcssJs.objectify(css);
        var rtl = rtlify(ltr);

        var ltrOnly = differ(rtl, ltr);
        var rtlOnly = differ(ltr, rtl);

        var ltrNonOverridable = dedupe(prune(ltrOnly), prune(rtlOnly));
        var bothAndLtrOverridable = differ(ltrNonOverridable, ltr);

        var sources = [
            { src: bothAndLtrOverridable, plugin: prefixDir },
            { src: ltrNonOverridable, plugin: prefixDir({ dir: 'ltr' }) },
            { src: rtlOnly, plugin: prefixDir({ dir: 'rtl' }) }
        ];

        var res = sources.map(function (obj) {
            return postcss(obj.plugin ? [obj.plugin] : [])
                .process(obj.src, { parser: postcssJs });
        });

        return new Promise(function (resolve) {
            Promise.all(res).then(function (values) {

                result.root = postcss.root();
                var nodesBySelector = {};

                values.forEach(function (v) {
                    v.root.nodes.forEach(function(n) {
                        if (!nodesBySelector[n._originalSelector]) {
                            nodesBySelector[n._originalSelector] = [];
                        }
                        nodesBySelector[n._originalSelector].push(n);
                    });
                });

                Object.keys(nodesBySelector).forEach(function(selector) {
                    nodesBySelector[selector].forEach(function(node) {
                        result.root.append(node);
                    });
                });

                resolve();
            });
        });
    };
});

function hasHtmlSelectorPrefix(selector) {
    return selector.first
        && selector.first.nodes[0]
        && selector.first.nodes[0].type === 'tag'
        && selector.first.nodes[0].value === 'html';
}
