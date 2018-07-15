var expect = require('chai').expect;

describe('middleware config parsing', function() {
    it('should throw if project ID is missing', function(done) {
        var config = {};

        expect(() => require('../src/botkit-middleware-dialogflow')(config)).to.throw(
            Error,
            'No dialogflow project ID provided.'
        );
        done();
    });
});
