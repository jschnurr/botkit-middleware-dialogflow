var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;

describe('receive() text', function() {
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
        channel: 'D88V7BL2F',
        user: 'U891YCT42',
        text: 'hi',
        ts: '1522500856.000117',
        source_team: 'T8938ACLC',
        team: 'T8938ACLC',
        raw_message: {
            type: 'message',
            channel: 'D88V7BL2F',
            user: 'U891YCT42',
            text: 'hi',
            ts: '1522500856.000117',
            source_team: 'T8938ACLC',
            team: 'T8938ACLC',
        },
        _pipeline: {stage: 'receive'},
    };

    // response from DialogFlow api call to /query endpoint
    var apiResponse = {
        id: '05a7ed32-6572-45a7-a27e-465959df5f9f',
        timestamp: '2018-03-31T14:16:54.369Z',
        lang: 'en',
        result: {
            source: 'agent',
            resolvedQuery: 'hi',
            action: '',
            actionIncomplete: false,
            parameters: {},
            contexts: [],
            metadata: {
                intentId: 'bd8fdabb-2fd6-4018-a3a5-0c57c41f65c1',
                webhookUsed: 'false',
                webhookForSlotFillingUsed: 'false',
                intentName: 'hello-intent',
            },
            fulfillment: {speech: '', messages: [{type: 0, speech: ''}]},
            score: 1,
        },
        status: {code: 200, errorType: 'success', webhookTimedOut: false},
        sessionId: '261d37f0-34ee-11e8-bcca-67db967c2594',
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

    it('should hear intent returned in Dialogflow response', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears(['hello-intent'], message);
            expect(heard).is.true;
            done();
        });
    });

    it('should not hear intent if confidence is not high enough', function(done) {
        middleware.receive(bot, message, function(err, response) {
            message.confidence = 0.1; // under default threshold of 0.5

            let heard = middleware.hears(['hello-intent'], message);
            expect(heard).is.false;
            done();
        });
    });
});
