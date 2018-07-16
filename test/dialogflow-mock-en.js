class SessionsClient {
  constructor(opts) {
    this.opts = opts;
  }

  sessionPath() {
    return 'path123';
  }

  detectIntent(request, cb) {
    cb(null, {
      responseId: '7f9da300-c16a-48be-b52e-f09157d34215',
      queryResult: {
        fulfillmentMessages: [
          {
            platform: 'PLATFORM_UNSPECIFIED',
            text: {
              text: ['Okay how many apples?'],
            },
            message: 'text',
          },
        ],
        outputContexts: [], // incoming message from chat platform, before middleware processing
        queryText: 'I need apples',
        speechRecognitionConfidence: 0,
        action: 'pickFruit',
        parameters: {
          fields: {
            fruits: {
              stringValue: 'apple',
              kind: 'stringValue',
            },
          },
        },
        allRequiredParamsPresent: true,
        fulfillmentText: 'Okay how many apples?',
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
          name: 'projects/botkit-dialogflow/agent/intents/4f01bbf2-41d7-41cc-9c9f-0969a8fa588c',
          displayName: 'add-to-list',
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
