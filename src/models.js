/* global jQuery: true, module: true, CryptoJS: true */

jQuery = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CryptoJS = require('crypto-js');


var SocialSupportMap = Backbone.Model.extend({
    defaults: {
        topic: '',
        owner: ''
    },
    toTemplate: function() {
        return _(this.attributes).clone();
    },
    fromJSON: function(json) {
        this.set('topic', json.topic);
        this.set('owner', json.owner);
    },
    encrypt: function(password) {
        var contents = JSON.stringify(this.toJSON());
        return CryptoJS.AES.encrypt(contents, password);
    },
    decrypt: function(contents, password) {
        var d = CryptoJS.AES.decrypt(contents, password);
        var plaintext = d.toString(CryptoJS.enc.Utf8);
        this.fromJSON(JSON.parse(plaintext));
    },
    isEmpty: function() {
        return this.get('topic').length < 1 && this.get('owner').length < 1;
    }
});

module.exports.SocialSupportMap = SocialSupportMap;
