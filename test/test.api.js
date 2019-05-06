const mockery = require('mockery');
const expect = require('chai').expect;

describe('dialogflow api constructor', function() {
  before(function() {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false,
      warnOnReplace: false,
    });
  });

  after(function() {
    mockery.disable();
  });

  it('should pass config options through to SessionsClient constructor', function(done) {
    const dialogflowMock = {
      SessionsClient: function(opts) {
        return opts;
      },
    };
    mockery.registerMock('dialogflow', dialogflowMock);
    const api = require('../src/api');

    const config = {
      version: 'v2',
      projectId: 'test',
      credentials: { x: 'y' },
      email: 'a@b.com',
      port: 1234,
      promise: Promise,
      servicePath: 'abc',
    };
    const app = api(config);

    expect(app.config).to.deep.equal(config);

    mockery.deregisterMock('dialogflow');
    done();
  });
});
