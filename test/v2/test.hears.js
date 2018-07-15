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

describe('hears()', function() {
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
        responseId: '261d37f0-34ee-11e8-bcca-67db967c2594',
        queryResult: {
            fulfillmentMessages: [{
                platform: 'PLATFORM_UNSPECIFIED',
                text: {
                    text: ['Good day!'],
                },
                message: 'text',
            }],
            outputContexts: [],
            queryText: 'hi',
            speechRecognitionConfidence: 0,
            action: 'hello-intent',
            parameters: {
                fields: {},
            },
            allRequiredParamsPresent: true,
            fulfillmentText: 'Good day!',
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
                name: 'projects/botkit-middleware/agent/intents/a6bd6dd4-b934-4dc2-ac84-fee6b4c428d5',
                displayName: 'hello-intent',
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

    it('should hear intent returned in Dialogflow response', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears(['hello-intent'], message);
            expect(heard).is.true;
            done();
        });
    });

    it('should not hear intent if confidence is not high enough', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let msg = clone(message);
            msg.confidence = 0.1; // under default threshold of 0.5

            let heard = middleware.hears(['hello-intent'], msg);
            expect(heard).is.false;
            done();
        });
    });

    it('should match intent as a string', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears('hello-intent', message);
            expect(heard).is.true;
            done();
        });
    });

    it('should match intent as a string containing regex', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears('hello(.*)', message);
            expect(heard).is.true;
            done();
        });
    });

    it('should match intent as a string of mixed case', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears('HELLO-intent', message);
            expect(heard).is.true;
            done();
        });
    });

    it('should not match intent as a string if only a substring matches', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears('hello-in', message);
            expect(heard).is.false;
            done();
        });
    });

    it('should match intent as a RegExp', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears(/^HEl.*/i, message);
            expect(heard).is.true;
            done();
        });
    });

    it('should match intent as a string in an array', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears(['blah', 'hello-intent'], message);
            expect(heard).is.true;
            done();
        });
    });

    it('should match intent as a RegExp in an array', function(done) {
        middleware.receive(bot, message, function(err, response) {
            let heard = middleware.hears(['blah', /^(hello)/], message);
            expect(heard).is.true;
            done();
        });
    });
});
