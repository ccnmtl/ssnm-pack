/* global module: true */
var UAParser = require('ua-parser-js');

var sanitize = function(value) {
    // http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(value));
    return div.innerHTML;
};

function validateFormValue($form, selector) {
    var $elt = $form.find(selector);
    if ($elt.val().length > 0) {
        return sanitize($elt.val());
    }

    $elt.addClass('is-invalid');
}

function eltCenter($elt) {
    var offset = $elt.position();
    return {
        x: offset.left +  $elt.width() / 2,
        y: offset.top +  $elt.height() / 2
    };
}

function radius($elt) {
    var shellHeight = $elt.prev().position().top - $elt.position().top;
    return $elt.height() / 2 - shellHeight / 2;
}

function radians(angle) {
    return angle * Math.PI / 180;
}

// https://developer.mozilla.org/en-US/docs/Web/API/
//    Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if
            // there's something already stored
            storage.length !== 0;
    }
}

function getUrlParameter(sParam, defaultValue) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1));
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ?
                defaultValue : sParameterName[1];
        }
    }
    return defaultValue;
}


function isImportExportSupported() {
    var ua = new UAParser();
    var browser = ua.getBrowser();
    if (browser.name === 'IE' || browser.name === 'Edge') {
        return false;
    }

    var device = ua.getDevice();
    if (device.vendor === 'Apple' && (
        device.type === 'mobile' || device.type === 'tablet')) {
        return false;
    }
    return true;
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function trackEvent(eventName, extraParams) {
    if (window.gtag !== undefined) {
        var params = {
            'event_category': 'ssnm',
            'event_label': 'interaction'
        };
        jQuery.extend(params, extraParams);

        window.gtag('event', eventName, params);
    }
}

module.exports.validateFormValue = validateFormValue;
module.exports.eltCenter = eltCenter;
module.exports.radius = radius;
module.exports.radians = radians;
module.exports.storageAvailable = storageAvailable;
module.exports.getUrlParameter = getUrlParameter;
module.exports.sanitize = sanitize;
module.exports.isImportExportSupported = isImportExportSupported;
module.exports.guid = guid;
module.exports.trackEvent = trackEvent;
