class SessionsClient {
  constructor(opts) {
    this.opts = opts;
  }

  sessionPath() {
    return 'path123';
  }

  detectIntent(request, cb) {
    cb(null, {
      responseId: '7cfc3ba7-cf87-4319-8c7a-0ba2f598e813',
      queryResult: {
        fulfillmentMessages: [
          {
            platform: 'PLATFORM_UNSPECIFIED',
            text: {
              text: ['comment vas-tu aujourd\'hui'],
            },
            message: 'text',
          },
        ],
        outputContexts: [],
        queryText: 'bonjour',
        speechRecognitionConfidence: 0,
        action: 'hello-intent',
        parameters: {
          fields: {},
        },
        allRequiredParamsPresent: true,
        fulfillmentText: 'comment vas-tu aujourd\'hui',
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
        languageCode: 'fr',
      },
      webhookStatus: null,
    });
  }
}

module.exports.SessionsClient = SessionsClient;
