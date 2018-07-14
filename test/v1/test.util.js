var expect = require('chai').expect;
var util = require('../src/util');

describe('generateSessionId functions', function() {
    it('should return a hash when property is provided as a string', function(done) {
        var config = {sessionIdProps: 'blah'};
        var message = {blah: 'test value'};
        expect(util.generateSessionId(config, message)).to.equal('cc2d2adc8b1da820c1075a099866ceb4');
        done();
    });

    it('should return a hash when property is provided as an array of strings', function(done) {
        var config = {sessionIdProps: ['blah']};
        var message = {blah: 'test value'};
        expect(util.generateSessionId(config, message)).to.equal('cc2d2adc8b1da820c1075a099866ceb4');
        done();
    });

    it('should return a hash when properties are missing, as long as at least one is available', function(done) {
        var config = {sessionIdProps: ['prop1', 'prop2']};
        var message = {prop1: 'test value'};
        expect(util.generateSessionId(config, message)).to.equal('cc2d2adc8b1da820c1075a099866ceb4');
        done();
    });

    it('should return a random uuid when all properties are missing from message object', function(done) {
        var config = {sessionIdProps: ['prop1', 'prop2']};
        var message = {prop3: 'test value'};
        expect(util.generateSessionId(config, message)).to.contain('-'); // uuid's have seperators
        done();
    });
});
