const sanitizeHtml = require('sanitize-html');
const Filter = require('bad-words'),
    filter = new Filter({ placeHolder: 'x' });


function SanitizeHtml(content) {
    return sanitizeHtml(content);
}

function SanitizeWords(content) {
    return filter.clean(content);
}

module.exports = {
    SanitizeHtml,
    SanitizeWords
}