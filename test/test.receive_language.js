var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;
var clone = require('clone');

process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + '/credentials.json';

describe('receive() text language support', function() {
    // Dialogflow params
    var config = require('./config.json');

    // Botkit params
    var controller = Botkit.slackbot();
    var bot = controller.spawn({
        token: 'abc123',
    });

    // Dialogflow middleware
    var middleware = require('../src/botkit-middleware-dialogflow')(config);

    // Setup message objects
    const defaultMessage = {
        type: 'direct_message',
        text: 'hi',
        user: 'test_user',
        channel: 'test_channel',
    };

    const englishMessage = {
        type: 'direct_message',
        text: 'hi',
        lang: 'en',
        user: 'test_user',
        channel: 'test_channel',
    };

    const frenchMessage = {
        type: 'direct_message',
        text: 'bonjour',
        lang: 'fr',
        user: 'test_user',
        channel: 'test_channel',
    };

    // tests
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

    it('should call the Dialogflow API with en if no language is specified on message object', function(done) {
        // Mock Grpc layer
        middleware.app._innerApiCalls.detectIntent = function(actualRequest, options, callback) {
            if (actualRequest.queryInput.text.languageCode === 'en') {
                callback(null);
            } else {
                callback('Invalid languageCode');
            }
        };

        middleware.receive(bot, clone(defaultMessage), function(err, response) {
            expect(err).is.undefined;
            done();
        });
    });

    // the language used by the nodejs client for Dialogflow is sticky over subsequent calls
    // Need to confirm we're resetting it.
    it('should call the API with correct language over subsequent calls in different languages', function(done) {
        // English
        middleware.app._innerApiCalls.detectIntent = function(actualRequest, options, callback) {
            if (actualRequest.queryInput.text.languageCode === 'en') {
                callback(null);
            } else {
                callback('Invalid languageCode');
            }
        };
        middleware.receive(bot, clone(englishMessage), function(err, response) {
            expect(err).is.undefined;
        });

        // French
        middleware.app._innerApiCalls.detectIntent = function(actualRequest, options, callback) {
            if (actualRequest.queryInput.text.languageCode === 'fr') {
                callback(null);
            } else {
                callback('Invalid languageCode');
            }
        };
        middleware.receive(bot, clone(frenchMessage), function(err, response) {
            expect(err).is.undefined;
        });

        // Default
        middleware.app._innerApiCalls.detectIntent = function(actualRequest, options, callback) {
            if (actualRequest.queryInput.text.languageCode === 'en') {
                callback(null);
            } else {
                callback('Invalid languageCode');
            }
        };
        middleware.receive(bot, clone(defaultMessage), function(err, response) {
            expect(err).is.undefined;
        });

        done();
    });

    it('should flow the language set on the message object through to the response', function(done) {
        middleware.app._innerApiCalls.detectIntent = function(actualRequest, options, callback) {
            callback(null, {
                responseId: '7cfc3ba7-cf87-4319-8c7a-0ba2f598e813',
                queryResult: {
                    fulfillmentMessages: [{
                        platform: 'PLATFORM_UNSPECIFIED',
                        text: {
                            text: ['comment vas-tu aujourd\'hui'],
                        },
                        message: 'text',
                    }],
                    outputContexts: [],
                    queryText: 'bonjour',
                    speechRecognitionConfidence: 0,
                    action: 'hello-intent',
                    parameters: {
                        fields: {},
                    },
                    allRequiredParamsPresent: true,
                    fulfillmentText: 'comment vas-tu aujourd\'hui',
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
                    languageCode: 'fr',
                },
                webhookStatus: null,
            });
        };

        let msg = clone(frenchMessage);
        middleware.receive(bot, msg, function(err, response) {
            expect(msg.lang).is.equal('fr');
            done();
        });
    });
});
