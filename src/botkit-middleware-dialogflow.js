var debug = require('debug')('dialogflow-middleware');
var apiai = require('apiai');
var uuid = require('node-uuid');

module.exports = function (config) {

    if (!config || !config.token) {
        throw new Error('No dialogflow token provided.');
    }

    if (!config.minimum_confidence) {
        config.minimum_confidence = 0.5;
    }

    var app = apiai(config.token);

    var middleware = {};
    var sessionId = uuid.v1();

    middleware.receive = function (bot, message, next) {
        if (message.bot_id !== undefined) {
            next()
        }
        else if (message.text) {
            debug('Sending message to dialogflow', message.text)
            request = app.textRequest(message.text, {
                sessionId: sessionId
            });

            request.on('response', function (response) {
                message.intent = response.result.metadata.intentName;
                message.entities = response.result.parameters;
                message.fulfillment = response.result.fulfillment;
                message.confidence = response.result.score;
                message.nlpResponse = response;
                debug('dialogflow response', response);
                next();
            });

            request.on('error', function (error) {
                debug('dialogflow returned error', error);
                next(error);
            });

            request.end();
        }
        else {
            next();
        }
    };

    middleware.hears = function (patterns, message) {
        for (var i = 0; i < patterns.length; i++) {
            if (message.intent === patterns[i] &&
                message.confidence >= config.minimum_confidence) {
                debug('dialogflow intent matched hear pattern', message.intent, patterns[i])
                return true;
            }
        }

        return false;
    };

    middleware.action = function (patterns, message) {
        for (var i = 0; i < patterns.length; i++) {
            if (message.nlpResponse.result.action === patterns[i] &&
                message.confidence >= config.minimum_confidence) {
                debug('dialogflow action matched hear pattern', message.intent, patterns[i])
                return true;
            }
        }

        return false;
    };

    return middleware;
};
