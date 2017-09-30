/* global describe: true, before: true, it: true */

require('!file-loader?name=[name].[ext]!./view-test.html');
require('../src/static.js');

var chai = require('chai');
var assert = chai.assert;

var jQuery = require('jquery');

var module = require('../src/views.js');

// eslint-disable-next-line no-unused-vars
function waitFor(testFx, doneFx, millis) {
    var timeout = millis ? millis : 3000; // Default Max Timout is 10s
    var start = new Date().getTime();

    // eslint-disable-next-line scanjs-rules/call_setInterval
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

    describe('map interaction', function() {
        it('initializes', function() {
            assert.equal(jQuery('input[name="topic"]:visible').length, 1);
            assert.equal(jQuery('input[name="owner"]:visible').length, 1);
            assert.equal(jQuery('a.import-map-link:visible').length, 1);
        });

        it('requires owner and topic', function() {
            jQuery('.btn-create-map').click();

            assert(jQuery(
                '.form-group.topic .invalid-feedback:visible').length > 0);
            assert(jQuery(
                '.form-group.owner .invalid-feedback:visible').length > 0);
        });

    });
});