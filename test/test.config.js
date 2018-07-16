const expect = require('chai').expect;

describe('middleware config parsing', function() {
  it('should throw if v1 and token is missing', function(done) {
    const config = { version: 'v1' };

    expect(() => require('../src/botkit-middleware-dialogflow')(config)).to.throw(
      Error,
      'Dialogflow token must be provided for v1.'
    );
    done();
  });

  it('should throw if v2 and keyFilename is missing', function(done) {
    const config = { version: 'v2' };

    expect(() => require('../src/botkit-middleware-dialogflow')(config)).to.throw(
      Error,
      'Dialogflow keyFilename must be provided for v2.'
    );
    done();
  });
});
