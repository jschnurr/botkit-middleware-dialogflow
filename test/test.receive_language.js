const Botkit = require('botkit');
const sinon = require('sinon');
const mockery = require('mockery');
const expect = require('chai').expect;
const clone = require('clone');

describe('receive() text language support', function() {
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

  const frenchMessage = {
    type: 'direct_message',
    text: 'bonjour',
    lang: 'fr',
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

    mockery.registerSubstitute('dialogflow', '../test/dialogflow-mock-fr');

    // Dialogflow middleware
    middleware = require('../src/botkit-middleware-dialogflow')({
      version: 'v2',
      keyFilename: __dirname + '/credentials.json',
    });
  });

  after(function() {
    mockery.disable();
  });

  it('should call the Dialogflow API with en if no language is specified on message object', function(done) {
    const spy = sinon.spy(middleware.api.app, 'detectIntent');

    middleware.receive(bot, clone(defaultMessage), function(err, response) {
      expect(spy.args[0][0].queryInput.text.languageCode).is.equal('en');

      spy.restore();
      done();
    });
  });

  it('should pass lang set on the messsage through to the Dialogflow API call.', function(done) {
    const spy = sinon.spy(middleware.api.app, 'detectIntent');

    middleware.receive(bot, clone(frenchMessage), function(err, response) {
      expect(spy.args[0][0].queryInput.text.languageCode).is.equal('fr');

      spy.restore();
      done();
    });
  });

  it('should flow the language set on the message object through to the response', function(done) {
    const msg = clone(frenchMessage);
    const spy = sinon.spy(middleware.api.app, 'detectIntent');

    middleware.receive(bot, msg, function(err, response) {
      expect(msg.lang).is.equal('fr');

      spy.restore();
      done();
    });
  });
});
