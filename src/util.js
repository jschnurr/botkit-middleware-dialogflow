var hasha = require('hasha');
var uuid = require('node-uuid');
var debug = require('debug')('dialogflow-middleware');

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

/**
 * Create a session ID using a hash of fields on the message.
 *
 * The Sessionid is an md5 hash of select message object properties, concatenated together.
 * In the event the message object doesn't have those object properties, use random uuid.
 *
 * @param {object} config - the configuration set on the middleware
 * @param {object} message - a message object
 * @return {string} session identifier
 */
exports.generateSessionId = function(config, message) {
    var props;

    if (typeof config.sessionIdProps === 'string') {
        props = [config.sessionIdProps];
    } else {
        props = config.sessionIdProps;
    }

    var hashElements = props
        .map((x) => {
            if (message[x]) return message[x].trim();
        })
        .filter((x) => typeof x === 'string');

    debug('generateSessionId using props %j. Values on this message are %j', props, hashElements);
    if (hashElements.length > 0) {
        return hasha(hashElements.join(''), {algorithm: 'md5'});
    } else {
        return uuid.v1();
    }
};
