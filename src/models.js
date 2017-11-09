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
        'description': 'Emotional support is the ability to show empathy, ' +
        'compassion, and genuine concern for another person. Someone ' +
        'emotionally supportive listens and understands when you tell them ' +
        'about how you feel and demonstrates genuine concern for you. Does ' +
        'this person listen to you?'
    },
    'advice': {
        'display': 'Advice',
        'icon': 'commenting',
        'description': 'Advice or informational support involves the ' +
        'provision of advice, suggestions, and information that we can use ' +
        'to address our problems.  Would you ask this person for advice? ' +
        'Do you trust their judgment?'
    },
    'social': {
        'display': 'Social',
        'icon': 'users',
        'description': 'Sharing leisure or other activities with someone. ' +
        'Information and company that helps you to feel good about yourself.' +
        ' Do you like to “hangout” with this person?'
    },
    'practical': {
        'display': 'Practical',
        'icon': 'cog',
        'description': 'The provision of tangible aid and services that ' +
        'directly assist us in making our days and our lives more manageable.' +
        ' Is this someone you can ask for a ride? For money? To take care ' +
        'of your children?'
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
    bySupportType: function(supportType) {
        var results = [];
        this.forEach(function(person) {
            var a = person.get('supportType');
            if (a && a.indexOf(supportType) > -1) {
                results.push(person);
            }
        });
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
