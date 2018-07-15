var Botkit = require('botkit');
var nock = require('nock');
var expect = require('chai').expect;

process.env.GOOGLE_APPLICATION_CREDENTIALS = __dirname + '/credentials.json';

/**
 * Mocks a gRPC method call.
 *
 * @param {object} expectedRequest - the mocked request
 * @param {object} response - the mocked response
 * @param {error} error - the mocked error
 * @return {function} callback function
 */
function mockSimpleGrpcMethod(expectedRequest, response, error) {
    return function(actualRequest, options, callback) {
        if (error) {
            callback(error);
        } else if (response) {
            callback(null, response);
        } else {
            callback(null);
        }
    };
}

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

    // Mock request
    var formattedSession = middleware.app.sessionPath('[PROJECT]', '[SESSION]');
    var queryInput = {};
    var request = {
        session: formattedSession,
        queryInput: queryInput,
    };

    // Mock Grpc layer
    middleware.app._innerApiCalls.detectIntent = mockSimpleGrpcMethod(
        request
    );

    before(function() {
        nock.disableNetConnect();

        nock('https://www.googleapis.com:443')
            .post('/oauth2/v4/token', undefined, {
                reqheaders: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .reply(200, {
                access_token: 'abc123',
                expires_in: 3600,
            });
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

    it('should be a no-op if type matches specific ignoreType config', function(done) {
        var bot2 = controller.spawn({
            token: 'abc123',
            ignoreType: ['facebook_postback'],
        });

        var message = {
            type: 'facebook_postback',
            text: 'payload',
        };

        middleware.receive(bot2, message, function(err, response) {
            expect(response).is.undefined;
            done();
        });
    });

    it('should be a no-op if type matches regex pattern for ignoreType config', function(done) {
        var bot2 = controller.spawn({
            token: 'abc123',
            ignoreType: /^facebook/,
        });

        var message = {
            type: 'facebook_postback',
            text: 'payload',
        };

        middleware.receive(bot2, message, function(err, response) {
            expect(response).is.undefined;
            done();
        });
    });
});
