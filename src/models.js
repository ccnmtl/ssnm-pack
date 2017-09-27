/* global jQuery: true, module: true, CryptoJS: true */

jQuery = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CryptoJS = require('crypto-js');

// eslint-disable-next-line no-unused-vars
var Proximity = {
    VERY_CLOSE: 1,
    SOMEWHAT_CLOSE: 2,
    NOT_CLOSE: 3
};

//eslint-disable-next-line no-unused-vars
var Influence = {
    VERY_HELPFUL: 1,
    SOMEWHAT_HELPFUL: 2,
    NOT_HELPFUL: 3
};

//eslint-disable-next-line no-unused-vars
var SupportType = {
    EMPATHY: 1,
    ADVICE: 2,
    SOCIAL: 3,
    PRACTICAL: 4
};

var Person = Backbone.Model.extend({
    defaults: {
        name: '',
        proximity: undefined,
        influence: undefined,
        supportTypes: [],
        notes: ''
    },
});

var PersonList = Backbone.Collection.extend({
    model: Person,
    initialize: function(lst) {
        if (lst !== undefined && lst instanceof Array) {
            for (var i = 0; i < lst.length; i++) {
                var x = new Person(lst[i]);
                this.add(x);
            }
        }
    },
    toTemplate: function() {
        var a = [];
        this.forEach(function(item) {
            a.push(item.toTemplate());
        });
        return a;
    }
});


var SocialSupportMap = Backbone.Model.extend({
    defaults: {
        topic: '',
        owner: '',
        people: new PersonList()
    },
    toTemplate: function() {
        return _(this.attributes).clone();
    },
    fromJSON: function(json) {
        this.set('topic', json.topic);
        this.set('owner', json.owner);
        this.set('people', new PersonList(json.people));
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
