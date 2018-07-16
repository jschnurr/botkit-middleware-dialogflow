class SessionsClient {
  constructor(opts) {
    this.opts = opts;
  }

  sessionPath() {
    return 'path123';
  }

  detectIntent(request, cb) {
    cb(null, {
      responseId: '261d37f0-34ee-11e8-bcca-67db967c2594',
      queryResult: {
        fulfillmentMessages: [
          {
            platform: 'PLATFORM_UNSPECIFIED',
            text: {
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
    });
  }
}

module.exports.SessionsClient = SessionsClient;
