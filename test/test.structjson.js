var expect = require('chai').expect;
var {structProtoToJson, jsonToStructProto} = require('../src/structjson');

describe('structjson functions', function() {
    var json = {
        prop1: 'test value',
        prop2: ['foo', 'bar', 'baz'],
        prop3: {prop4: 'blah'},
    };
    var proto = {
        fields: {
            prop1: {
                kind: 'stringValue',
                stringValue: 'test value',
            },
            prop2: {
                kind: 'listValue',
                listValue: {
                    values: [{
                        kind: 'stringValue',
                        stringValue: 'foo',
                    },
                    {
                        kind: 'stringValue',
                        stringValue: 'bar',
                    },
                    {
                        kind: 'stringValue',
                        stringValue: 'baz',
                    },
                    ],
                },
            },
            prop3: {
                kind: 'structValue',
                structValue: {
                    fields: {
                        prop4: {
                            kind: 'stringValue',
                            stringValue: 'blah',
                        },
                    },
                },
            },
        },
    };

    it('should correctly return a struct proto from an object', function(done) {
        expect(jsonToStructProto(json)).to.deep.equal(proto);
        done();
    });

    it('should return an empty struct proto', function(done) {
        expect(jsonToStructProto(null)).to.deep.equal({fields: {}});
        done();
    });

    it('should correctly return an object from a struct proto', function(done) {
        expect(structProtoToJson(proto)).to.deep.equal(json);
        done();
    });

    it('should return an empty object', function(done) {
        expect(structProtoToJson(null)).to.deep.equal({});
        done();
    });
});
