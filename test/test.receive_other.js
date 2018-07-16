const Botkit = require('botkit');
const mockery = require('mockery');
const expect = require('chai').expect;

describe('middleware.receive() message types that should skip dialogflow', function() {
  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn({
    token: 'abc123',
  });

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
    });
  });

  after(function() {
    mockery.disable();
  });

  it('should be a no-op if text field is missing', function(done) {
    const message = {
      type: 'user_typing',
    };

    middleware.receive(bot, message, function(err, response) {
      expect(response).is.undefined;
      done();
    });
  });

  it('should be a no-op if message is echo', function(done) {
    const message = {
      type: 'is_echo',
    };

    middleware.receive(bot, message, function(err, response) {
      expect(response).is.undefined;
      done();
    });
  });

  it('should be a no-op if text field is missing', function(done) {
    const message = {
      type: 'self_message',
      text: 'Hello!',
    };

    middleware.receive(bot, message, function(err, response) {
      expect(response).is.undefined;
      done();
    });
  });

  it('should be a no-op if type matches specific ignoreType config', function(done) {
    const bot2 = controller.spawn({
      token: 'abc123',
      ignoreType: ['facebook_postback'],
    });

    const message = {
      type: 'facebook_postback',
      text: 'payload',
    };

    middleware.receive(bot2, message, function(err, response) {
      expect(response).is.undefined;
      done();
    });
  });

  it('should be a no-op if type matches regex pattern for ignoreType config', function(done) {
    const bot2 = controller.spawn({
      token: 'abc123',
      ignoreType: /^facebook/,
    });

    const message = {
      type: 'facebook_postback',
      text: 'payload',
    };

    middleware.receive(bot2, message, function(err, response) {
      expect(response).is.undefined;
      done();
    });
  });
});
