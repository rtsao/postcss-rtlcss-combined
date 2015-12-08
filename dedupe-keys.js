'use strict';

function isObject(val) {
    return typeof val === 'object' && val !== null;
}

module.exports = function dedupeKeys(val1, val2) {
    if (isObject(val1)) {
        return isObject(val2) ? Object.keys(val1).reduce(function (acc, key) {
            if (!val2.hasOwnProperty(key)) {
                acc[key] = val1[key];
            } else {
                var deduped = dedupeKeys(val1[key], val2[key]);
                if (deduped) {
                    acc[key] = deduped;
                }
            }
            return acc;
        }, {}) : val1;
    }
};
