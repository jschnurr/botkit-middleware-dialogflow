var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;
var clone = require('clone');

process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + '/credentials.json';

/**
 * Mocks a gRPC method call.
 *
 * @param {object} expectedRequest - the mocked request
 * @param {object} response - the mocked response
 * @param {error} error - the mocked error
 * @return {function} callback function
 */
function mockSimpleGrpcMethod(expectedRequest, response, error) {
    return function(actualRequest, options, callback) {
        if (error) {
            callback(error);
        } else if (response) {
            callback(null, response);
        } else {
            callback(null);
        }
    };
}

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
        user: 'test_user',
        channel: 'test_channel',
    };

    // response from DialogFlow api call to /query endpoint
    var apiResponse = {
        responseId: '7f9da300-c16a-48be-b52e-f09157d34215',
        queryResult: {
            fulfillmentMessages: [{
                platform: 'PLATFORM_UNSPECIFIED',
                text: {
                    text: ['Okay how many apples?'],
                },
                message: 'text',
            }],
            outputContexts: [],
            queryText: 'I need apples',
            speechRecognitionConfidence: 0,
            action: 'pickFruit',
            parameters: {
                fields: {
                    fruits: {
                        stringValue: 'apple',
                        kind: 'stringValue',
                    },
                },
            },
            allRequiredParamsPresent: true,
            fulfillmentText: 'Okay how many apples?',
            webhookSource: '',
            webhookPayload: null,
            intent: {
                inputContextNames: [],
                events: [],
                trainingPhrases: [],
                outputContexts: [],
                parameters: [],
                messages: [],
                defaultResponsePlatforms: [],
                followupIntentInfo: [],
                name: 'projects/botkit-dialogflow/agent/intents/4f01bbf2-41d7-41cc-9c9f-0969a8fa588c',
                displayName: 'add-to-list',
                priority: 0,
                isFallback: false,
                webhookState: 'WEBHOOK_STATE_UNSPECIFIED',
                action: '',
                resetContexts: false,
                rootFollowupIntentName: '',
                parentFollowupIntentName: '',
                mlDisabled: false,
            },
            intentDetectionConfidence: 1,
            diagnosticInfo: {
                fields: {},
            },
            languageCode: 'en',
        },
        webhookStatus: null,
    };

    // Mock request
    var formattedSession = middleware.app.sessionPath('[PROJECT]', '[SESSION]');
    var queryInput = {};
    var request = {
        session: formattedSession,
        queryInput: queryInput,
    };

    // Mock Grpc layer
    middleware.app._innerApiCalls.detectIntent = mockSimpleGrpcMethod(
        request,
        apiResponse
    );

    before(function() {
        nock.disableNetConnect();

        nock('https://www.googleapis.com:443')
            .post('/oauth2/v4/token', undefined, {
                reqheaders: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .reply(200, {
                access_token: 'abc123',
                expires_in: 3600,
            });
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
            let msg = clone(message);
            msg.confidence = 0.1; // under default threshold of 0.5

            let action = middleware.action(['pickFruit'], msg);
            expect(action).is.false;
            done();
        });
    });

    it('should match action as a string', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action('pickFruit', message);
            expect(action).is.true;
            done();
        });
    });

    it('should match action as a string containing regex', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action('pick(.*)', message);
            expect(action).is.true;
            done();
        });
    });

    it('should match action as a string of mixed case', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action('pickFRUIT', message);
            expect(action).is.true;
            done();
        });
    });

    it('should not match action as a string if only a substring matches', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action('pick', message);
            expect(action).is.false;
            done();
        });
    });

    it('should match action as a RegExp', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action(/^pick/, message);
            expect(action).is.true;
            done();
        });
    });

    it('should match action as a string in an array', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action(['blah', 'pickFruit'], message);
            expect(action).is.true;
            done();
        });
    });

    it('should match action as a RegExp in an array', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let action = middleware.action(['blah', /^(pick)/], message);
            expect(action).is.true;
            done();
        });
    });
});
