const Botkit = require('botkit');
const mockery = require('mockery');
const expect = require('chai').expect;
const clone = require('clone');

describe('middleware.action()', function() {
  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn({
    token: 'abc123',
  });

  // Setup message objects
  const defaultMessage = {
    type: 'direct_message',
    text: 'I need apples',
    user: 'test_user',
    channel: 'test_channel',
  };

  let middleware;

  before(function() {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false,
      warnOnReplace: false,
    });
    mockery.registerSubstitute('dialogflow', '../test/dialogflow-mock-en');

    // Dialogflow middleware
    middleware = require('../src/botkit-middleware-dialogflow')({
      version: 'v2',
      keyFilename: __dirname + '/credentials.json',
      minimumConfidence: 0.5
    });
  });

  after(function() {
    mockery.disable();
  });

  it('should trigger action returned in Dialogflow response', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action(['pickFruit'], message);
      expect(action).is.true;
      done();
    });
  });

  it('should not trigger action if confidence is not high enough', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const msg = clone(message);
      msg.confidence = 0.1; // under default threshold of 0.5

      const action = middleware.action(['pickFruit'], msg);
      expect(action).is.false;
      done();
    });
  });

  it('should match action as a string', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action('pickFruit', message);
      expect(action).is.true;
      done();
    });
  });

  it('should match action as a string containing regex', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action('pick(.*)', message);
      expect(action).is.true;
      done();
    });
  });

  it('should match action as a string of mixed case', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action('pickFRUIT', message);
      expect(action).is.true;
      done();
    });
  });

  it('should not match action as a string if only a substring matches', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action('pick', message);
      expect(action).is.false;
      done();
    });
  });

  it('should match action as a RegExp', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action(/^pick/, message);
      expect(action).is.true;
      done();
    });
  });

  it('should match action as a string in an array', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action(['blah', 'pickFruit'], message);
      expect(action).is.true;
      done();
    });
  });

  it('should match action as a RegExp in an array', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const action = middleware.action(['blah', /^(pick)/], message);
      expect(action).is.true;
      done();
    });
  });
});
