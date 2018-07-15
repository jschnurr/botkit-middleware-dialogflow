const Botkit = require('botkit');
const nock = require('nock');
const expect = require('chai').expect;

describe('receive() non-text inputs', function() {
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

  before(function() {
    nock.disableNetConnect();
  });

  after(function() {
    nock.cleanAll();
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
