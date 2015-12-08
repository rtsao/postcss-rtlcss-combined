var postcss = require('postcss');
var postcssJs = require('postcss-js');

var rtlcss = require('rtlcss');

var prune = require('null-prune');
var differ = require('loot-diff');
var dedupe = require('./dedupe-keys');

var prefixDir = postcss.plugin('postcss-remove', function (opts) {
    opts = opts || {
        dir: 'ltr'
    };
    return function (css) {
        css.walkRules(function (rule) {
            rule.selector = 'html[dir="' + opts.dir + '"] ' + rule.selector;
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
            { src: bothAndLtrOverridable },
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
                values.forEach(function (v) {
                    result.root.append(v.root);
                });
                resolve();
            });
        });
    };
});
