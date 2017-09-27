/* global describe: true, it: true, Blob: true */

var assert = require('chai').assert;
var models = require('../src/models.js');

describe('SocialSupportMap', function() {

    it('can be initialized', function() {
        var map = new models.SocialSupportMap({
            'topic': 'The Topic',
            'owner': 'An Owner'});
        assert.equal(map.get('topic'), 'The Topic');
        assert.equal(map.get('owner'), 'An Owner');

        assert(!map.isEmpty());
    });

    it('can be encrypted & decrypted', function() {
        var map = new models.SocialSupportMap({
            'topic': 'The Topic',
            'owner': 'An Owner'});
        var cipher = map.encrypt('ipsum');

        var map2 = new models.SocialSupportMap();
        map2.decrypt(cipher, 'ipsum');
        assert.equal(map2.get('topic'), 'The Topic');
        assert.equal(map2.get('owner'), 'An Owner');
    });

    it('can be empty', function() {
        var map = new models.SocialSupportMap();
        assert(map.isEmpty());
    });

});