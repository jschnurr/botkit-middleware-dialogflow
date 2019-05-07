const debug = require('debug')('dialogflow-middleware');
const util = require('./util');
const api = require('./api');
const options = require('./options');

module.exports = function(config) {
  config = options.checkOptions(config);

  const ignoreTypePatterns = util.makeArrayOfRegex(config.ignoreType || []);
  const middleware = {};

  const app = (middleware.api = api(config));

  middleware.receive = async function(bot, message, next) {
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

    const sessionId = message.token.substring(0,message.token.length-1);
    const lang = message.lang || config.lang;

    debug(
      'Sending message to dialogflow. sessionId=%s, language=%s, text=%s',
      sessionId,
      lang,
      message.text
    );

    try {
      const response = await app.query(sessionId, lang, message.text);
      Object.assign(message, response);

      debug('dialogflow annotated message: %O', message);
      next();
    } catch (error) {
      debug('dialogflow returned error', error);
      next(error);
    }
  };

  middleware.hears = function(patterns, message) {
    const regexPatterns = util.makeArrayOfRegex(patterns);

    for (const pattern of regexPatterns) {
      if (pattern.test(message.intent) && message.confidence >= config.minimumConfidence) {
        debug('dialogflow intent matched hear pattern', message.intent, pattern);
        return true;
      }
    }
    return false;
  };

  middleware.action = function(patterns, message) {
    const regexPatterns = util.makeArrayOfRegex(patterns);

    for (const pattern of regexPatterns) {
      if (pattern.test(message.action) && message.confidence >= config.minimumConfidence) {
        debug('dialogflow action matched hear pattern', message.intent, pattern);
        return true;
      }
    }
    return false;
  };

  return middleware;
};

