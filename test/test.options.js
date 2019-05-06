const mockery = require('mockery');
const expect = require('chai').expect;

describe('options parser', function() {
  before(function() {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false,
      warnOnReplace: false,
    });
  });

  afterEach(() => {
    delete process.env.DIALOGFLOW_CLIENT_EMAIL;
    delete process.env.DIALOGFLOW_PRIVATE_KEY;
    delete process.env.DIALOGFLOW_PROJECT_ID;
  });

  after(function() {
    mockery.disable();
  });

  it('should throw if v1 and token is missing', function(done) {
    const config = { version: 'v1' };

    const checkOptions = require('../src/options').checkOptions;
    expect(() => checkOptions(config)).to.throw(Error, 'Dialogflow token must be provided for v1.');
    done();
  });

  it('should throw if v2 and keyFilename and env variables are missing', function(done) {
    const config = { version: 'v2' };

    const checkOptions = require('../src/options').checkOptions;
    expect(() => checkOptions(config)).to.throw(
      Error,
      'projectId and credentials required, either via keyFile or environment variables.'
    );
    done();
  });

  it('should throw if v2 and keyFilename and env variables are both supplied', function(done) {
    const config = { version: 'v2', keyFilename: __dirname + '/credentials.json' };
    process.env.DIALOGFLOW_CLIENT_EMAIL = 'testemail';
    process.env.DIALOGFLOW_PRIVATE_KEY = 'testkey';
    process.env.DIALOGFLOW_PROJECT_ID = 'testproject';

    const checkOptions = require('../src/options').checkOptions;
    expect(() => checkOptions(config)).to.throw(
      Error,
      'Invalid configuration - cannot provide both keyfile and explicit credentials.'
    );
    done();
  });

  it('should set the projectId if passed explicitly as an option', function(done) {
    const checkOptions = require('../src/options').checkOptions;

    const config = {
      version: 'v2',
      projectId: 'test',
      credentials: {},
    };

    const options = checkOptions(config);
    expect(options.projectId).to.equal(config.projectId);
    done();
  });

  it('should set the projectId if passed implicitly via keyfile', function(done) {
    const checkOptions = require('../src/options').checkOptions;

    const config = {
      version: 'v2',
      keyFilename: __dirname + '/credentials.json',
    };
    const options = checkOptions(config);

    expect(options.projectId).to.equal('abc123');
    done();
  });

  it('should set credentials and projectID through environment variables', function(done) {
    const checkOptions = require('../src/options').checkOptions;

    const config = {
      version: 'v2',
      projectId: 'testproject',
    };

    process.env.DIALOGFLOW_CLIENT_EMAIL = 'testemail';
    process.env.DIALOGFLOW_PRIVATE_KEY = 'testkey';
    process.env.DIALOGFLOW_PROJECT_ID = 'testproject';

    const options = checkOptions(config);

    expect(options.credentials).to.deep.equal({
      private_key: 'testkey',
      client_email: 'testemail',
    });

    expect(options.projectId).to.equal('testproject');

    done();
  });
});
