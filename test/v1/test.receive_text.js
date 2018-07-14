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
    var expectedDfData = {
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
            .reply(200, expectedDfData);
    });

    after(function() {
        nock.cleanAll();
    });

    it('should make a call to the Dialogflow api', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(nock.isDone()).is.true;
            done();
        });
    });

    it('should add custom fields to the message object', function(done) {
        middleware.receive(bot, message, function(err, response) {
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
            expect(message.intent).to.eql(expectedDfData.result.metadata.intentName);
            done();
        });
    });

    it('should correctly copy result.parameters to the message.entities key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.entities).to.eql(expectedDfData.result.parameters);
            done();
        });
    });

    it('should correctly copy result.fulfillment to the message.fulfillment key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.fulfillment).to.eql(expectedDfData.result.fulfillment);
            done();
        });
    });

    it('should correctly copy result.score to the message.confidence key', function(done) {
        middleware.receive(bot, message, function(err, response) {
            expect(message.confidence).to.eql(expectedDfData.result.score);
            done();
        });
    });
});
