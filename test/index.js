import postcss from 'postcss';
import test    from 'ava';
import fs      from 'fs';

import plugin from '../';

function run(t, input, output, opts = { }) {
    return postcss([ plugin(opts) ]).process(input)
        .then( result => {
            t.same(result.css, output);
            t.same(result.warnings().length, 0);
        });
}

var source = fs.readFileSync('./basic.source.css', 'utf8');
var expected = fs.readFileSync('./basic.expected.css', 'utf8').trim();

test('basic functionality', t => {
    return run(t, source, expected, { });
});
