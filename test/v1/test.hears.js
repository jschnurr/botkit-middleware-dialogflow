const Botkit = require('botkit');
const nock = require('nock');
const expect = require('chai').expect;
const clone = require('clone');

describe('hears()', function() {
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
  const message = {
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
    _pipeline: { stage: 'receive' },
  };

  // response from DialogFlow api call to /query endpoint
  const apiResponse = {
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
      .reply(200, apiResponse);
  });

  afterEach(function() {
    nock.cleanAll();
  });

  it('should hear intent returned in Dialogflow response', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(['hello-intent'], message);
      expect(heard).is.true;
      done();
    });
  });

  it('should not hear intent if confidence is not high enough', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const msg = clone(message);
      msg.confidence = 0.1; // under default threshold of 0.5

      const heard = middleware.hears(['hello-intent'], msg);
      expect(heard).is.false;
      done();
    });
  });

  it('should match intent as a string', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('hello-intent', message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a string containing regex', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('hello(.*)', message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a string of mixed case', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('HELLO-intent', message);
      expect(heard).is.true;
      done();
    });
  });

  it('should not match intent as a string if only a substring matches', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('hello-in', message);
      expect(heard).is.false;
      done();
    });
  });

  it('should match intent as a RegExp', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(/^HEl.*/i, message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a string in an array', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(['blah', 'hello-intent'], message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a RegExp in an array', function(done) {
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(['blah', /^(hello)/], message);
      expect(heard).is.true;
      done();
    });
  });
});
