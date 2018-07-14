var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;
var structProtoToJson = require('../src/structjson').structProtoToJson;

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
    var expectedDfData = {
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
        expectedDfData
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

    it('should make a call to the Dialogflow api', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(err).is.undefined;
            done();
        });
    });

    it('should add custom fields to the message object', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(err).is.undefined;
            expect(message)
                .to.be.an('object')
                .that.includes.all.keys('nlpResponse', 'intent', 'entities', 'fulfillment', 'confidence');
            done();
        });
    });

    it('should correctly include the Dialogflow API result on the nlpResponse key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.nlpResponse).to.deep.equal(expectedDfData);
            done();
        });
    });

    it('should correctly copy result.metadata.intentName to the message.intent key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.intent).to.eql(expectedDfData.queryResult.intent.displayName);
            done();
        });
    });

    it('should correctly copy result.parameters to the message.entities key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.entities).to.eql(structProtoToJson(expectedDfData.queryResult.parameters));
            done();
        });
    });

    it('should correctly copy result.fulfillment to the message.fulfillment key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.fulfillment.speech).to.eql(expectedDfData.queryResult.fulfillmentText);
            expect(message.fulfillment.messages).to.deep.equal(expectedDfData.queryResult.fulfillmentMessages);
            done();
        });
    });

    it('should correctly copy result.score to the message.confidence key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.confidence).to.eql(expectedDfData.queryResult.intentDetectionConfidence);
            done();
        });
    });
});
