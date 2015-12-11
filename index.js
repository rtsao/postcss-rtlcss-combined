var postcss = require('postcss');
var postcssJs = require('postcss-js');

var rtlcss = require('rtlcss');

var prune = require('null-prune');
var differ = require('loot-diff');
var dedupe = require('./dedupe-keys');

var prefixDir = postcss.plugin('postcss-dir-prefix', function (opts) {
    opts = opts || {};
    return function (css) {
        css.walkRules(function (rule) {
            if (rule.nodes.length) {
                rule._originalSelector = rule.selector;
                var dirVal = opts.dir ? '="' + opts.dir + '"' : '';
                rule.selectors = rule.selectors.map(function(selector) {
                    return 'html[dir' + dirVal + '] ' + selector;
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
        
        var sources = [];
        if (ltrOnly == null) {
            sources.push({ src: ltr, plugin: prefixDir });            
        } else {
            var ltrNonOverridable = dedupe(prune(ltrOnly), prune(rtlOnly));
            var bothAndLtrOverridable = differ(ltrNonOverridable, ltr);
            
            if(bothAndLtrOverridable != null)
                sources.push({ src: bothAndLtrOverridable, plugin: prefixDir });
            sources.push({ src: ltrNonOverridable, plugin: prefixDir({ dir: 'ltr' }) });
            sources.push({ src: rtlOnly, plugin: prefixDir({ dir: 'rtl' }) });
        }

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
