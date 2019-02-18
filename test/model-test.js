/* global describe: true, it: true, before: true */

var assert = require('chai').assert;
var models = require('../src/models.js');

describe('Person', function() {
    it('can be initialized', function() {
        var person = new models.Person({
            'name': 'Sam',
            'proximity': 'very-close',
            'influence': 'very-helpful',
            'supportType': ['empathy', 'advice'],
            'notes': 'some notes here'
        });
        assert.equal(person.get('name'), 'Sam');
        assert.equal(person.get('proximity'), 'very-close');
        assert.equal(person.get('influence'), 'very-helpful');
        assert.equal(person.get('supportType')[0], 'empathy');
        assert.equal(person.get('supportType')[1], 'advice');
        assert.equal(person.get('notes'), 'some notes here');
    });

    it('can be empty', function() {
        var person = new models.Person({});
        assert.equal(person.get('name'), '');
        assert.equal(person.get('supportType').length, 0);
    });
});

describe('PersonList', function() {
    var people = new models.PersonList();
    before(function() {
        people.add(new models.Person({
            'name': 'A', 'proximity': 'very-close',
            'supportType': ['empathy', 'advice']}));
        people.add(new models.Person({
            'name': 'a', 'proximity': 'very-close',
            'supportType': ['empathy', 'practical']}));
        people.add(new models.Person({
            'name': 'B', 'proximity': 'very-close',
            'supportType': ['social']}));
        people.add(new models.Person({
            'name': 'C', 'proximity': 'somewhat-close',
            'supportType': ['advice']}));
        people.add(new models.Person({
            'name': 'D', 'proximity': 'not-close',
            'supportType': ['practical']}));
    });

    it('can be filtered', function() {
        var lst = people.filterBySupportType('foo');
        assert.equal(lst.length, 0);

        lst = people.filterBySupportType('empathy');
        assert.equal(lst.length, 2);
        assert.equal(lst[0].get('name'), 'A');
        assert.equal(lst[1].get('name'), 'a');

        lst = people.filterBySupportType('social');
        assert.equal(lst.length, 1);
        assert.equal(lst[0].get('name'), 'B');
    });

    it('can be grouped', function() {
        var a = people.groupByProximity();
        assert.equal(Object.keys(a)[0], 'very-close');
        assert.equal(a['very-close'][0].name, 'A');
        assert.equal(a['very-close'][1].name, 'a');
        assert.equal(a['very-close'][2].name, 'B');

        assert.equal(Object.keys(a)[1], 'somewhat-close');
        assert.equal(a['somewhat-close'][0].name, 'C');

        assert.equal(Object.keys(a)[2], 'not-close');
        assert.equal(a['not-close'][0].name, 'D');
    });
});

describe('SocialSupportMap', function() {

    it('can be initialized', function() {
        var map = new models.SocialSupportMap({
            'topic': 'The Topic',
            'owner': 'An Owner'});

        map.get('people').add(new models.Person({
            'name': 'a', 'proximity': 'very-close',
            'influence': 'very-helpful',
            'supportType': ['empathy'], 'notes': 'aaaaaaaa'}));

        assert.equal(map.get('topic'), 'The Topic');
        assert.equal(map.get('owner'), 'An Owner');

        var people = map.get('people');
        assert.equal(people.size(), 1);
        assert.equal(people.at(0).get('name'), 'a');
        assert.equal(people.at(0).get('proximity'), 'very-close');
        assert.equal(people.at(0).get('influence'), 'very-helpful');
        assert.equal(people.at(0).get('supportType')[0], 'empathy');
        assert.equal(people.at(0).get('notes'), 'aaaaaaaa');

        assert(!map.isEmpty());
    });

    it('can be encrypted & decrypted', function() {
        var map = new models.SocialSupportMap({
            'topic': 'The Topic',
            'owner': 'An Owner'});
        map.get('people').add(new models.Person({
            'name': 'a', 'proximity': 'very-close',
            'influence': 'very-helpful',
            'supportType': ['empathy'], 'notes': 'aaaaaaaa'}));

        var cipher = map.encrypt('ipsum');

        var map2 = new models.SocialSupportMap();
        map2.decrypt(cipher, 'ipsum');
        assert.equal(map2.get('topic'), 'The Topic');
        assert.equal(map2.get('owner'), 'An Owner');

        var people = map2.get('people');
        assert.equal(people.size(), 1);
        assert.equal(people.at(0).get('name'), 'a');
        assert.equal(people.at(0).get('proximity'), 'very-close');
        assert.equal(people.at(0).get('influence'), 'very-helpful');
        assert.equal(people.at(0).get('supportType')[0], 'empathy');
        assert.equal(people.at(0).get('notes'), 'aaaaaaaa');
    });

    it('can be empty', function() {
        var map = new models.SocialSupportMap();
        assert(map.isEmpty());
    });

});