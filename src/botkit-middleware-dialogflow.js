const debug = require('debug')('dialogflow-middleware');
const makeArrayOfRegex = require('./util').makeArrayOfRegex;
const generateSessionId = require('./util').generateSessionId;
const api = require('./api');

module.exports = function(config) {
  config = checkOptions(config);

  const ignoreTypePatterns = makeArrayOfRegex(config.ignoreType || []);
  const middleware = {};

  const app = api(config);

  middleware.receive = function(bot, message, next) {
    if (!message.text || message.is_echo || message.type === 'self_message') {
      next();
      return;
    }

    for (const pattern of ignoreTypePatterns) {
      if (pattern.test(message.type)) {
        debug('skipping call to Dialogflow since type matched ', pattern);
        next();
        return;
      }
    }

    const sessionId = generateSessionId(config, message);
    const lang = message.lang || config.lang;

    debug(
      'Sending message to dialogflow. sessionId=%s, language=%s, text=%s',
      sessionId,
      lang,
      message.text
    );

    const request = app.query(sessionId, lang, message.text);

    request.on('response', function(response) {
      Object.assign(message, response);
      debug('dialogflow annotated message: %O', message);
      next();
    });

    request.on('error', function(error) {
      debug('dialogflow returned error', error);
      next(error);
    });
  };

  middleware.hears = function(patterns, message) {
    const regexPatterns = makeArrayOfRegex(patterns);

    for (const pattern of regexPatterns) {
      if (pattern.test(message.intent) && message.confidence >= config.minimumConfidence) {
        debug('dialogflow intent matched hear pattern', message.intent, pattern);
        return true;
      }
    }
    return false;
  };

  middleware.action = function(patterns, message) {
    const regexPatterns = makeArrayOfRegex(patterns);

    for (const pattern of regexPatterns) {
      if (
        pattern.test(message.nlpResponse.result.action) &&
        message.confidence >= config.minimumConfidence
      ) {
        debug('dialogflow action matched hear pattern', message.intent, pattern);
        return true;
      }
    }
    return false;
  };

  return middleware;
};

/**
 * Validate config and set defaults as required
 *
 * @param {object} config - the configuration provided by the user
 * @return {object} validated configuration with defaults applied
 */
function checkOptions(config = {}) {
  const defaults = {
    version: 'v1',
    minimumConfidence: 0.5,
    sessionIdProps: ['user', 'channel'],
    ignoreType: 'self_message',
    lang: 'en',
  };

  config = Object.assign({}, defaults, config);

  if (config.version === 'v1' && !config.token) {
    throw new Error('No dialogflow token provided.');
  }

  debug(`settings are ${JSON.stringify(config)}`);
  return config;
}
