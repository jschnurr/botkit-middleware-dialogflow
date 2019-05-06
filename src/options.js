const path = require('path');
const debug = require('debug')('dialogflow-middleware');

/**
 * Validate config and set defaults as required
 *
 * @param {object} config - the configuration provided by the user
 * @return {object} validated configuration with defaults applied
 */

exports.checkOptions = function checkOptions(config = {}) {
  // start with defaults
  const defaults = {
    version: 'v2',
    minimumConfidence: 0.0,
    sessionIdProps: ['user', 'channel'],
    ignoreType: 'self_message',
    lang: 'en',
  };

  // overlay any explicit configuration
  config = Object.assign({}, defaults, config);

  // overlay keyfile data and environment variables
  if (config.version.toUpperCase() === 'V2') {
    if (config.keyFilename) {
      // overlay project and credentials from keyfile
      config = Object.assign({}, config, getKeyData(config.keyFilename));
    }

    if (process.env.DIALOGFLOW_PROJECT_ID) {
      config.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    }

    if (process.env.DIALOGFLOW_CLIENT_EMAIL && process.env.DIALOGFLOW_PRIVATE_KEY) {
      config.credentials = {
        private_key: process.env.DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
      };
    }
  }

  // clean and validate options
  config.version = config.version.toUpperCase();
  if (config.version === 'V1') {
    // V1
    if (!config.token) {
      throw new Error('Dialogflow token must be provided for v1.');
    }
  } else {
    // V2
    if (!config.projectId || !config.credentials) {
      throw new Error(
        'projectId and credentials required, either via keyFile or environment variables.'
      );
    }

    if (
      config.keyFilename &&
      (process.env.DIALOGFLOW_CLIENT_EMAIL || process.env.DIALOGFLOW_PRIVATE_KEY)
    ) {
      throw new Error(
        'Invalid configuration - cannot provide both keyfile and explicit credentials.'
      );
    }
  }

  debug(`settings are ${JSON.stringify(config)}`);
  return config;
};

function getKeyData(keyFilename) {
  if (!path.isAbsolute(keyFilename)) {
    keyFilename = path.join(process.cwd(), keyFilename);
  }
  const keyFile = require(keyFilename);

  return {
    keyFilename: keyFilename,
    credentials: {
      private_key: keyFile.private_key,
      client_email: keyFile.client_email,
    },
    projectId: keyFile.project_id,
  };
}
