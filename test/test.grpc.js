const Botkit = require('botkit');
const expect = require('chai').expect;

describe('grpc layer', function() {
  // Botkit params
  const controller = Botkit.slackbot();
  const bot = controller.spawn({
    token: 'abc123',
  });

  // Dialogflow middleware
  const middleware = require('../src/botkit-middleware-dialogflow')({
    version: 'v2',
    keyFilename: __dirname + '/credentials.json',
  });

  // incoming message from chat platform, before middleware processing
  const message = {
    type: 'direct_message',
    channel: 'D88V7BL2F',
    user: 'U891YCT42',
    text: 'hi',
  };

  // response from DialogFlow api call
  const apiResponse = {
    responseId: '261d37f0-34ee-11e8-bcca-67db967c2594',
    queryResult: {
      // incoming message from chat platform, before middleware processing
      fulfillmentMessages: [
        {
          platform: 'PLATFORM_UNSPECIFIED',
          text: {
            // incoming message from chat platform, before middleware processing
            text: ['Good day!'],
          },
          message: 'text',
        },
      ],
      outputContexts: [],
      queryText: 'hi',
      speechRecognitionConfidence: 0,
      action: 'hello-intent',
      parameters: {
        fields: {},
      },
      allRequiredParamsPresent: true,
      fulfillmentText: 'Good day!',
      webhookSource: '',
      webhookPayload: null,
      intent: {
        inputContextNames: [],
        events: [],
        trainingPhrases: [],
        outputContexts: [],
        parameters: [],
        messages: [],
        defaultResponsePlatforms: [],
        followupIntentInfo: [],
        name: 'projects/botkit-middleware/agent/intents/a6bd6dd4-b934-4dc2-ac84-fee6b4c428d5',
        displayName: 'hello-intent',
        priority: 0,
        isFallback: false,
        webhookState: 'WEBHOOK_STATE_UNSPECIFIED',
        action: '',
        resetContexts: false,
        rootFollowupIntentName: '',
        parentFollowupIntentName: '',
        mlDisabled: false,
      },
      intentDetectionConfidence: 1,
      diagnosticInfo: {
        fields: {},
      },
      languageCode: 'en',
    },
    webhookStatus: null,
  };

  // Mock request
  const formattedSession = middleware.api.app.sessionPath('[PROJECT]', '[SESSION]');
  const queryInput = {};
  const request = {
    session: formattedSession,
    queryInput: queryInput,
  };

  // Mock Grpc layer
  middleware.api.app._innerApiCalls.detectIntent = mockSimpleGrpcMethod(request, apiResponse);

  it('should make a call to Dialogflow and return an annotated message', function(done) {
    // eslint-disable-next-line
    middleware.receive(bot, message, function(err, response) {
      expect(message).to.deep.equal({
        type: 'direct_message',
        channel: 'D88V7BL2F',
        user: 'U891YCT42',
        text: 'hi',
        intent: 'hello-intent',
        entities: {},
        action: 'hello-intent',
        fulfillment: {
          text: 'Good day!',
          messages: [
            {
              platform: 'PLATFORM_UNSPECIFIED',
              text: {
                text: ['Good day!'],
              },
              message: 'text',
            },
          ],
        },
        confidence: 1,
        nlpResponse: apiResponse,
      });
      done();
    });
  });
});

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
