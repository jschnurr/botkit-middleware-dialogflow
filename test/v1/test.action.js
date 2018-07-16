const Botkit = require('botkit');
const nock = require('nock');
const expect = require('chai').expect;
const clone = require('clone');

describe('v1/ action()', function() {
  // Dialogflow params
  const config = require('./config.json');

  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn();

  // Dialogflow middleware
  const middleware = require('../../src/botkit-middleware-dialogflow')({
    version: 'v1',
    token: 'abc',
  });

  // incoming message from chat platform, before middleware processing
  const defaultMessage = {
    type: 'direct_message',
    text: 'pick an apple',
    user: 'test_user',
    channel: 'test_channel',
  };

  // response from DialogFlow api call to /query endpoint
  const apiResponse = {
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

  it('should trigger action returned in Dialogflow response', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action(['pickFruit'], message);
      expect(action).is.true;
      done();
    });
  });
});
