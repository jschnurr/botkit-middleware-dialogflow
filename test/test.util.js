const expect = require('chai').expect;
const util = require('../src/util');

describe('generateSessionId functions', function() {
  it('should return a hash when property is provided as a string', function(done) {
    const config = { sessionIdProps: 'blah' };
    const message = { blah: 'test value' };
    expect(util.generateSessionId(config, message)).to.equal('cc2d2adc8b1da820c1075a099866ceb4');
    done();
  });

  it('should return a hash when property is provided as an array of strings', function(done) {
    const config = { sessionIdProps: ['blah'] };
    const message = { blah: 'test value' };
    expect(util.generateSessionId(config, message)).to.equal('cc2d2adc8b1da820c1075a099866ceb4');
    done();
  });

  it('should return a hash when properties are missing, as long as at least one is available', function(done) {
    const config = { sessionIdProps: ['prop1', 'prop2'] };
    const message = { prop1: 'test value' };
    expect(util.generateSessionId(config, message)).to.equal('cc2d2adc8b1da820c1075a099866ceb4');
    done();
  });

  it('should return a random uuid when all properties are missing from message object', function(done) {
    const config = { sessionIdProps: ['prop1', 'prop2'] };
    const message = { prop3: 'test value' };
    expect(util.generateSessionId(config, message)).to.contain('-'); // uuid's have seperators
    done();
  });
});
