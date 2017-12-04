var apiai = require('apiai');
var uuid = require('node-uuid');

module.exports = function (config) {

    if (!config || !config.token) {
        throw new Error('No dialogflow token provided.');
    }

    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }

    if (!config.skip_bot) {
        config.skip_bot = false;
    }

    var app = apiai(config.token);

    var middleware = {};
    var sessionId = uuid.v1();

    middleware.receive = function (bot, message, next) {
        if (config.skip_bot === true && message.bot_id !== undefined) {
            next()
        }
        else if (message.text) {
            request = app.textRequest(message.text, {
                sessionId: sessionId
            });

            request.on('response', function (response) {
                message.intent = response.result.metadata.intentName;
                message.entities = response.result.parameters;
                message.fulfillment = response.result.fulfillment;
                message.confidence = response.result.score;
                message.nlpResponse = response;
                next();
            });

            request.on('error', function (error) {
                next(error);
            });

            request.end();
        }
        else {
            next();
        }
    };

    middleware.hears = function (tests, message) {
        for (var i = 0; i < tests.length; i++) {
            if (message.intent === tests[i] &&
                message.confidence >= config.minimum_confidence) {
                return true;
            }
        }

        return false;
    };

    middleware.action = function (tests, message) {
        for (var i = 0; i < tests.length; i++) {
            if (message.nlpResponse.result.action === tests[i] &&
                message.confidence >= config.minimum_confidence) {
                return true;
            }
        }

        return false;
    };

    return middleware;
};
