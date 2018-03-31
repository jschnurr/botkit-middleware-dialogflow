/*
Botkit allows patterns to be an array or a comma separated string containing a list of regular expressions.
This function converts regex, string, or array of either into an array of RexExp.
*/
exports.makeArrayOfRegex = function(data) {
    let patterns = [];

    if (typeof data === 'string') {
        data = data.split(',');
    }

    if (data instanceof RegExp) {
        return [data];
    }

    for (let item of data) {
        if (item instanceof RegExp) {
            patterns.push(item);
        } else {
            patterns.push(new RegExp('^' + item + '$', 'i'));
        }
    }
    return patterns;
};
