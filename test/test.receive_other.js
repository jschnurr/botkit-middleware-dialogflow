var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;

describe('receive() non-text inputs', function() {
    // Dialogflow params
    var config = require('./config.json');

    // Botkit params
    var controller = Botkit.slackbot();
    var bot = controller.spawn({
        token: 'abc123',
    });

    // Dialogflow middleware
    var middleware = require('../src/botkit-middleware-dialogflow')(config);

    before(function() {
        nock.disableNetConnect();
    });

    after(function() {
        nock.cleanAll();
    });

    it('should be a no-op if text field is missing', function(done) {
        var message = {
            type: 'user_typing',
        };

        middleware.receive(bot, message, function(err, response) {
            expect(response).is.undefined;
            done();
        });
    });

    it('should be a no-op if message is echo', function(done) {
        var message = {
            type: 'is_echo',
        };

        middleware.receive(bot, message, function(err, response) {
            expect(response).is.undefined;
            done();
        });
    });

    it('should be a no-op if text field is missing', function(done) {
        var message = {
            type: 'self_message',
            text: 'Hello!',
        };

        middleware.receive(bot, message, function(err, response) {
            expect(response).is.undefined;
            done();
        });
    });
});
