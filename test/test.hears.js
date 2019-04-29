const Botkit = require('botkit');
const mockery = require('mockery');
const expect = require('chai').expect;
const clone = require('clone');

describe('middleware.hears()', function() {
  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn({
    token: 'abc123',
  });

  // Setup message objects
  const defaultMessage = {
    type: 'direct_message',
    text: 'hi',
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

    mockery.registerSubstitute('dialogflow', '../test/dialogflow-mock-en2');

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

  it('should hear intent returned in Dialogflow response', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(['hello-intent'], message);
      expect(heard).is.true;
      done();
    });
  });

  it('should not hear intent if confidence is not high enough', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const msg = clone(message);
      msg.confidence = 0.1; // under default threshold of 0.5

      const heard = middleware.hears(['hello-intent'], msg);
      expect(heard).is.false;
      done();
    });
  });

  it('should match intent as a string', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('hello-intent', message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a string containing regex', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('hello(.*)', message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a string of mixed case', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('HELLO-intent', message);
      expect(heard).is.true;
      done();
    });
  });

  it('should not match intent as a string if only a substring matches', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears('hello-in', message);
      expect(heard).is.false;
      done();
    });
  });

  it('should match intent as a RegExp', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(/^HEl.*/i, message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a string in an array', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(['blah', 'hello-intent'], message);
      expect(heard).is.true;
      done();
    });
  });

  it('should match intent as a RegExp in an array', function(done) {
    const message = clone(defaultMessage);
    middleware.receive(bot, message, function(err, response) {
      const heard = middleware.hears(['blah', /^(hello)/], message);
      expect(heard).is.true;
      done();
    });
  });
});
