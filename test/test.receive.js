const Botkit = require('botkit');
const mockery = require('mockery');
const expect = require('chai').expect;
const clone = require('clone');

describe('middleware.receive() normalization into the message object', function() {
  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn({
    token: 'abc123',
  });

  // incoming message from chat platform, before middleware processing
  const defaultMessage = {
    type: 'direct_message',
    channel: 'D88V7BL2F',
    user: 'U891YCT42',
    text: 'I need apples',
  };

  let middleware;

  before(function() {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false,
      warnOnReplace: false,
    });

    mockery.registerSubstitute('dialogflow', '../test/dialogflow-mock-en');

    middleware = require('../src/botkit-middleware-dialogflow')({
      version: 'v2',
      keyFilename: __dirname + '/credentials.json',
    });
  });

  after(function() {
    mockery.disable();
  });

  it('should make a call to the Dialogflow api', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(err).is.undefined;
      done();
    });
  });

  it('should add custom fields to the message object', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(err).is.undefined;
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

  it('should correctly add fields to the message', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      expect(message).to.deep.include({
        type: 'direct_message',
        channel: 'D88V7BL2F',
        user: 'U891YCT42',
        text: 'I need apples',
        intent: 'add-to-list',
        entities: {
          fruits: 'apple',
        },
        action: 'pickFruit',
        fulfillment: {
          text: 'Okay how many apples?',
          messages: [
            {
              platform: 'PLATFORM_UNSPECIFIED',
              text: {
                text: ['Okay how many apples?'],
              },
              message: 'text',
            },
          ],
        },
        confidence: 1,
      });
      done();
    });
  });
});
