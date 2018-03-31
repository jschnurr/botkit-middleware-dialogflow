var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;

describe('action()', function() {
    // Dialogflow params
    var config = require('./config.json');

    // Botkit params
    var controller = Botkit.slackbot();
    var bot = controller.spawn({
        token: 'abc123',
    });

    // Dialogflow middleware
    var middleware = require('../src/botkit-middleware-dialogflow')(config);

    // incoming message from chat platform, before middleware processing
    var message = {
        type: 'direct_message',
        text: 'pick an apple',
    };

    // response from DialogFlow api call to /query endpoint
    var apiResponse = {
        id: '3622be70-cb49-4796-a4fa-71f16f7b5600',
        lang: 'en',
        result: {
            action: 'pickFruit',
            actionIncomplete: false,
            contexts: ['shop'],
            fulfillment: {
                messages: [
                    {
                        platform: 'google',
                        textToSpeech: 'Okay how many apples?',
                        type: 'simple_response',
                    },
                    {
                        platform: 'google',
                        textToSpeech: 'Okay. How many apples?',
                        type: 'simple_response',
                    },
                    {
                        speech: 'Okay how many apples?',
                        type: 0,
                    },
                ],
                speech: 'Okay how many apples?',
            },
            metadata: {
                intentId: '21478be9-bea6-449b-bcca-c5f009c0a5a1',
                intentName: 'add-to-list',
                webhookForSlotFillingUsed: 'false',
                webhookUsed: 'false',
            },
            parameters: {
                fruit: ['apples'],
            },
            resolvedQuery: 'I need apples',
            score: 1,
            source: 'agent',
        },
        sessionId: '12345',
        status: {
            code: 200,
            errorType: 'success',
        },
        timestamp: '2017-09-19T21:16:44.832Z',
    };

    before(function() {
        nock.disableNetConnect();

        nock(config.url)
            .post('/' + config.version + '/query?v=' + config.protocol)
            .reply(200, apiResponse);
    });

    after(function() {
        nock.cleanAll();
    });

    it('should trigger action returned in Dialogflow response', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action(['pickFruit'], message);
            expect(action).is.true;
            done();
        });
    });

    it('should not trigger action if confidence is not high enough', function(done) {
        middleware.receive(bot, message, function(err, response) {
            message.confidence = 0.1; // under default threshold of 0.5

            let action = middleware.action(['pickFruit'], message);
            expect(action).is.false;
            done();
        });
    });
});
