/* global jQuery: true, module: true, CryptoJS: true */

jQuery = require('jquery');
var Backbone = require('backbone');
var CryptoJS = require('crypto-js');

var Proximity = {
    'very-close': 'Very Close',
    'somewhat-close': 'Somewhat Close',
    'not-close': 'Not Close'
};

var Influence = {
    'very-helpful': 'Very Helpful',
    'somewhat-helpful': 'Somewhat Helpful',
    'not-helpful': 'Not Helpful'
};

var SupportType = {
    'empathy': {
        'display': 'Empathy',
        'icon': 'heart',
    },
    'advice': {
        'display': 'Advice',
        'icon': 'comments'
    },
    'social': {
        'display': 'Social',
        'icon': 'users'
    },
    'practical': {
        'display': 'Practical',
        'icon': 'wrench'
    }
};

var Person = Backbone.Model.extend({
    defaults: {
        name: '',
        proximity: undefined,
        influence: undefined,
        supportType: undefined,
        notes: ''
    },
    initialize: function(attributes) {
        if (!this.get('supportType')) { 
            this.set({supportType: new Array()});
        }
    },
    toJSON: function() {
        var json = Backbone.Model.prototype.toJSON.call(this);
        json.cid = this.cid;
        return json;
    },
});


var PersonList = Backbone.Collection.extend({
    model: Person,
});


var PersonModalState = Backbone.Model.extend({
    defaults: {
        step: 1,
        lastStep: 5
    },
});


var SocialSupportMap = Backbone.Model.extend({
    defaults: {
        topic: '',
        owner: ''
    },
    initialize: function(attributes) {
        this.set({people: new PersonList()});
    },
    fromJSON: function(json) {
        this.set('topic', json.topic);
        this.set('owner', json.owner);

        var people = this.get('people');
        people.reset();
        for (var i=0; i < json.people.length; i++) {
            people.add(new Person(json.people[i]));
        }
    },
    toJSON: function() {
        var json = Backbone.Model.prototype.toJSON.call(this);
        json.people = this.get('people').toJSON();
        return json;
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

module.exports.Proximity = Proximity;
module.exports.Influence = Influence;
module.exports.SupportType = SupportType;

module.exports.Person = Person;
module.exports.PersonModalState = PersonModalState;
module.exports.SocialSupportMap = SocialSupportMap;
