/* global module: true */

var Backbone = require('backbone');
var CryptoJS = require('crypto-js');

var Proximity = {
    'very-close': 'Very Close',
    'somewhat-close': 'Somewhat Close',
    'not-close': 'Not Close'
};

var Influence = {
    'very-helpful': 'Positive',
    'somewhat-helpful': 'In-between/Neutral',
    'not-helpful': 'Negative'
};

var SupportType = {
    'empathy': {
        'display': 'Empathy',
        'icon': 'heart',
        'description': 'Emotional support is showing empathy, ' +
        'compassion, and genuine concern. This person listens to you and ' +
        'understands when you tell them about how you feel.'
    },
    'advice': {
        'display': 'Advice',
        'icon': 'commenting',
        'description': 'Advice or informational support is suggestions or ' +
        'information that you can use to work on problems. You would ask ' +
        'this person for advice and trust their judgment.'
    },
    'social': {
        'display': 'Social',
        'icon': 'users',
        'description': 'Social support is company that helps you to feel ' +
        'good about yourself. This is a person you like to hang out with.'
    },
    'practical': {
        'display': 'Practical',
        'icon': 'cog',
        'description': 'Practical support is help that makes your life ' +
        'more manageable. You can ask this person for things like money, ' +
        'a ride, or help taking care of your children.'
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
    filterBySupportType: function(supportType) {
        var results = [];
        this.forEach(function(person) {
            var a = person.get('supportType');
            if (a && a.indexOf(supportType) > -1) {
                results.push(person);
            }
        });
        return results;
    },
    groupByProximity: function() {
        var p;
        var results = {};
        for (p in Proximity) {
            results[p] = [];
        }
        this.forEach(function(person) {
            var a = person.get('proximity');
            results[a].push(person.toJSON());
        });
        for (p in Proximity) {
            results[p].sort(function(a, b) {
                return a.name.toLowerCase() >
                    b.name.toLowerCase();
            });
        }
        return results;
    }
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
        var people = this.get('people');
        people.reset();
        for (var i=0; i < json.people.length; i++) {
            people.add(new Person(json.people[i]), {silent: true});
        }
        this.set('topic', json.topic, {silent: true});
        this.set('owner', json.owner);
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
module.exports.PersonList = PersonList;
module.exports.PersonModalState = PersonModalState;
module.exports.SocialSupportMap = SocialSupportMap;
