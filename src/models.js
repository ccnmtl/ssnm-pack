/* global jQuery: true, module: true, CryptoJS: true */

jQuery = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CryptoJS = require('cryptojs').Crypto;


var SocialSupportMap = Backbone.Model.extend({
    toTemplate: function() {
        return _(this.attributes).clone();
    },
    fromJSON: function(json) {
        this.set('topic', json['topic']);
        this.set('nickname', json['nickname']);
    },
    encrypt: function(password) {
        var contents = JSON.stringify(this.toJSON());
        return CryptoJS.AES.encrypt(contents, password);
    },
    decrypt: function(contents, password) {
        var d = CryptoJS.AES.decrypt(contents, password);
        var plaintext = d.toString(CryptoJS.charenc.Utf8);
        this.fromJSON(JSON.parse(plaintext));
    }
});

module.exports.SocialSupportMap = SocialSupportMap;
