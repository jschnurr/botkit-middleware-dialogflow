const expect = require('chai').expect;

describe('middleware config parsing', function() {
  it('should throw if token is missing', function(done) {
    const config = { version: 'v1' };

    expect(() => require('../../src/botkit-middleware-dialogflow')(config)).to.throw(
      Error,
      'No dialogflow token provided.'
    );
    done();
  });
});
