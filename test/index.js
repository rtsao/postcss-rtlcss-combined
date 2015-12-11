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

function testFromFixture(name) {
    var source = fs.readFileSync('./' + name + '.source.css', 'utf8');
    var expected = fs.readFileSync('./' + name + '.expected.css', 'utf8')
      .trim();

    test(name, t => {
        return run(t, source, expected, { });
    });
}

var tests = [
    'basic',
    'selector-order',
    'multiple-selectors',
    'html-selector-merge'
];

tests.forEach(testFromFixture);
