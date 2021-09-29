/* global describe: true, before: true, it: true */

require('../src/static.js');

//load and apply css
require('!style-loader!css-loader!bootstrap/dist/css/bootstrap.min.css');
require('!style-loader!css-loader!../static/css/common.css');
require('!style-loader!css-loader!../static/css/main.css');

var chai = require('chai');
var assert = chai.assert;

// eslint-disable-next-line no-redeclare
var jQuery = require('jquery');
var module = require('../src/views');

function waitFor(testFx, doneFx, millis) {
    var timeout = millis ? millis : 3000; // Default Max Timout is 10s
    var start = new Date().getTime();

    var interval = setInterval(function() {
        var condition = testFx();

        if (condition) {
            clearInterval(interval);
            doneFx();
        } else if ((new Date().getTime() - start >= timeout)) {
            clearInterval(interval);
            doneFx(new Error('timeout occurred'));
        }
    }, 250); //< repeat check every 250ms
}

describe('SocialSupportNetworkApp', function() {

    before(function() {
        module.SocialSupportNetworkApp.initialize();
    });

    describe('interaction', function() {
        it('initializes', function() {
            assert.equal(jQuery('input[name="topic"]:visible').length, 1);
            assert.equal(jQuery('input[name="owner"]:visible').length, 1);
            assert.equal(jQuery('a.import-map-link:visible').length, 1);

            assert(jQuery('.invalid-feedback:visible').length < 1);
        });

        it('requires owner and topic', function() {
            jQuery('.btn-create-map').click();

            assert(jQuery(
                '.form-group.topic .invalid-feedback:visible').length > 0);
            assert(jQuery(
                '.form-group.owner .invalid-feedback:visible').length > 0);
        });

        it('creates a map instance', function(done) {
            jQuery('input[name="topic"]').val('Something');
            jQuery('input[name="owner"]').val('Someone');
            jQuery('.btn-create-map').click();

            waitFor(function() {
                return jQuery('.create-map-container').length < 1;
            }, done);
        });

        it('has a map view', function() {
            assert.equal(jQuery('a#map-topic').html(), 'Something');
            assert.equal(jQuery('a#map-owner').html(), 'Someone');
        });

        it('can edit map attributes', function(done) {
            jQuery('a#map-topic').click();

            waitFor(function() {
                var $elt = jQuery('.editable-input input[type="text"]');
                return $elt.is(':visible');
            }, done);
        });

        it('can change map attributes', function(done) {
            var $elt = jQuery('.editable-input input[type="text"]');
            $elt.val('Something Else');
            jQuery('.editable-submit').click();

            waitFor(function() {
                return $elt.is(':hidden');
            }, done);
        });

        it('has an updated map view', function() {
            assert.equal(jQuery('a#map-topic').html(), 'Something Else');
        });

        it('can add a person', function(done) {
            jQuery('.btn-add-person').click();

            waitFor(function() {
                return jQuery('#personModal').is(':visible');
            }, done);
        });

        it('can enter person attributes', function(done) {
            jQuery('#personModal').find('[name="name"]').val('alpha');
            jQuery('.btn-next').click();

            jQuery('#personModal').find(
                '[name="proximity"][value="very-close"]').prop('checked', true);
            jQuery('.btn-next').click();

            jQuery('#personModal').find(
                '[name="influence"][value="very-helpful"]').prop(
                'checked', true);
            jQuery('.btn-next').click();

            jQuery('#personModal').find(
                '[name="supportType"]').prop('checked', true);
            jQuery('.btn-next').click();

            jQuery('#personModal').find('[name="notes"]').val('beta');

            waitFor(function() {
                return jQuery('#personModal .btn-save').is(':visible');
            }, done);
        });

        it('can save a person attributes', function(done) {
            jQuery('#personModal').find('.btn-save').click();

            waitFor(function() {
                return jQuery('#personModal').is(':hidden');
            }, done);
        });

        it('can view a person', function() {
            assert.equal(jQuery('.person-container').length, 1);
            assert(
                jQuery('.person-name a').html().indexOf('alpha') > 0);
        });

        it('can edit a person', function() {
            // @todo
        });

        it('can change person attributes', function() {
            // @todo
        });

        it('can see the updated person', function() {
            // @todo
        });

        it('can remove a person from the view 1', function(done) {
            jQuery('a.btn-view-person').click();

            waitFor(function() {
                return jQuery('#personViewModal').is(':visible');
            }, done);
        });

        it('can remove a person from the view 2', function(done) {
            jQuery('.btn-delete-person-confirm').click();

            waitFor(function() {
                return jQuery(
                    '#confirmDeleteModal .btn-delete-person').is(':visible');
            }, done);
        });

        it('can confirm remove a person', function(done) {
            jQuery('#confirmDeleteModal .btn-delete-person').click();

            waitFor(function() {
                return jQuery('.person-container').length === 0;
            }, done);
        });
    });
});
