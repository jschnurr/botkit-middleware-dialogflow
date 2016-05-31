var apiaiService = require('apiai');

module.exports = function(config) {

    if (!config.token) {
        throw new Error('No api.ai token provided.');
    } else {
        var apiai = apiaiService(config.token);
    }

    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }

    var middleware = {};

    middleware.receive = function(bot, message, next) {
        if (message.text) {
            request = apiai.textRequest(message.text);

            request.on('response', function(response) {
                message.intent = response.result.metadata.intentName;
                message.entities = response.result.parameters;
                message.fulfillment = response.result.fulfillment;
                message.confidence = response.result.score;
                message.nlpResponse = response;
                next();
            });

            request.on('error', function(error) {
                next(error);
            });

            request.end();
        }

    };

    middleware.hears = function(tests, message) {
        for (var i = 0; i < tests.length; i++) {
            if (message.intent === tests[i] &&
                message.confidence >= config.minimum_confidence) {
                return true;
            }
        }

        return false;
    };


    return middleware;

};
