/* eslint require-jsdoc:0 */

const EventEmitter = require('events');
const debug = require('debug')('dialogflow-middleware'); // eslint-disable-line
const apiai = require('apiai');

module.exports = function(config) {
  if (config.version === 'v1') {
    return new V1(config);
  } else {
    return new V2(config);
  }
};

// dialogflow API /v1
class V1 {
  constructor(config) {
    this.config = config;
    this.app = apiai(config.token);
  }

  query(sessionId, languageCode, text) {
    this.app.language = languageCode;

    const emitter = new EventEmitter();

    const request = this.app.textRequest(text, {
      sessionId: sessionId,
    });

    request.on('response', function(response) {
      emitter.emit('response', V1._normalize(response));
    });

    request.on('error', function(error) {
      emitter.emit('error', error);
    });

    request.end();

    return emitter;
  }

  // return standardized format
  static _normalize(response) {
    return {
      intent: response.result.metadata.intentName,
      entities: response.result.parameters,
      fulfillment: response.result.fulfillment,
      confidence: response.result.score,
      nlpResponse: response,
    };
  }
}

// dialogflow API /v2
class V2 {
  constructor() {
    throw new Error('v2 not implemented yet.');
  }
}
