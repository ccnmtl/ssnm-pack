/* global describe: true, it: true, Blob: true */

var assert = require('chai').assert;
var models = require('../src/models.js');

describe('SocialSupportMap', function() {

    it('can be initialized', function() {
        var map = new models.SocialSupportMap({
            'topic': 'The Topic',
            'nickname': 'A Nickname'});
        assert.equal(map.get('topic'), 'The Topic');
        assert.equal(map.get('nickname'), 'A Nickname');
    });

    it('can be encrypted & decrypted', function() {
        var map = new models.SocialSupportMap({
            'topic': 'The Topic',
            'nickname': 'A Nickname'});
        var cipher = map.encrypt('ipsum');

        var map2 = new models.SocialSupportMap();
        map2.decrypt(cipher, 'ipsum');
        assert.equal(map2.get('topic'), 'The Topic');
        assert.equal(map2.get('nickname'), 'A Nickname');
    });
});