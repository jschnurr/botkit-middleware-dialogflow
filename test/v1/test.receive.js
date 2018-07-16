const Botkit = require('botkit');
const nock = require('nock');
const expect = require('chai').expect;
const clone = require('clone');

describe('v1/ receive() text', function() {
  // Dialogflow params
  const config = require('./config.json');

  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn({
    token: 'abc123',
  });

  // Dialogflow middleware
  const middleware = require('../../src/botkit-middleware-dialogflow')({
    version: 'v1',
    token: 'abc',
  });

  // incoming message from chat platform, before middleware processing
  const defaultMessage = {
    type: 'direct_message',
    channel: 'D88V7BL2F',
    user: 'U891YCT42',
    text: 'hi',
  };

  // response from DialogFlow api call to /query endpoint
  const expectedDfData = {
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
      fulfillment: { speech: '', messages: [{ type: 0, speech: '' }] },
      score: 1,
    },
    status: { code: 200, errorType: 'success', webhookTimedOut: false },
    sessionId: '261d37f0-34ee-11e8-bcca-67db967c2594',
  };

  beforeEach(function() {
    nock.disableNetConnect();

    nock(config.url)
      .post('/' + config.version + '/query?v=' + config.protocol)
      .optionally()
      .reply(200, expectedDfData);
  });

  afterEach(function() {
    nock.cleanAll();
  });

  it('should make a call to the Dialogflow api', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(nock.isDone()).is.true;
      done();
    });
  });

  it('should add custom fields to the message object', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(message)
        .to.be.an('object')
        .that.includes.all.keys(
          'nlpResponse',
          'intent',
          'entities',
          'fulfillment',
          'confidence',
          'action'
        );
      done();
    });
  });

  it('should correctly include the Dialogflow API result on the nlpResponse key', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(message.nlpResponse).to.deep.equal(expectedDfData);
      done();
    });
  });

  it('should correctly add fields to the message', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(message).to.deep.include({
        type: 'direct_message',
        channel: 'D88V7BL2F',
        user: 'U891YCT42',
        text: 'hi',
        intent: 'hello-intent',
        entities: {},
        action: '',
        fulfillment: {
          speech: '',
          messages: [
            {
              type: 0,
              speech: '',
            },
          ],
        },
        confidence: 1,
      });
      done();
    });
  });
});
