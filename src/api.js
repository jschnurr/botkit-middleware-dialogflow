const debug = require('debug')('dialogflow-middleware');
const apiai = require('apiai');
const dialogflow = require('dialogflow');
const structProtoToJson = require('./structjson').structProtoToJson;
const _ = require('lodash');

module.exports = function(config) {
  if (config.version.toUpperCase() === 'V1') {
    return new DialogFlowAPI_V1(config);
  } else {
    return new DialogFlowAPI_V2(config);
  }
};

class DialogFlowAPI_V1 {
  constructor(config) {
    this.config = config;
    this.app = apiai(config.token);
  }

  query(sessionId, languageCode, text) {
    this.app.language = languageCode;

    const request = this.app.textRequest(text, {
      sessionId: sessionId,
    });

    return new Promise((resolve, reject) => {
      request.on('response', function(response) {
        try {
          const data = DialogFlowAPI_V1._normalize(response);
          debug('dialogflow api response: ', response);
          resolve(data);
        } catch (err) {
          debug('dialogflow api error: ', err);
          reject(err);
        }
      });

      request.on('error', function(error) {
        debug('dialogflow api error: ', error);
        reject(error);
      });

      request.end();
    });
  }

  // return standardized format
  static _normalize(response) {
    return {
      intent: _.get(response, 'result.metadata.intentName', null),
      entities: _.get(response, 'result.parameters', null),
      action: _.get(response, 'result.action', null),
      fulfillment: _.get(response, 'result.fulfillment', null),
      confidence: _.get(response, 'result.score', null),
      nlpResponse: response,
    };
  }
}

class DialogFlowAPI_V2 {
  constructor(config) {
    this.config = config;
    const opts = _.pick(config, [
      'credentials',
      'keyFilename',
      'projectId',
      'email',
      'port',
      'promise',
      'servicePath',
    ]);

    this.projectId = opts.projectId;

    this.app = new dialogflow.SessionsClient(opts);
  }

  query(sessionId, languageCode, text) {
    const request = {
      session: this.app.sessionPath(this.projectId, sessionId),
      queryInput: {
        text: {
          text: text,
          languageCode: languageCode,
        },
      },
      queryParams: {
        resetContexts: true
      },
    };

    return new Promise((resolve, reject) => {
      this.app.detectIntent(request, function(error, response) {
        if (error) {
          debug('dialogflow api error: ', error);
          reject(error);
        } else {
          debug('dialogflow api response: ', response);
          try {
            const data = DialogFlowAPI_V2._normalize(response);
            resolve(data);
          } catch (err) {
            reject(err);
          }
        }
      });
    });
  }

  // return standardized format
  static _normalize(response) {
    return {
      intent: _.get(response, 'queryResult.intent.displayName', null),
      entities: structProtoToJson(response.queryResult.parameters),
      action: _.get(response, 'queryResult.action', null),
      fulfillment: {
        text: _.get(response, 'queryResult.fulfillmentText', null),
        messages: _.get(response, 'queryResult.fulfillmentMessages', null),
      },
      confidence: _.get(response, 'queryResult.intentDetectionConfidence', null),
      nlpResponse: response,
    };
  }
}
