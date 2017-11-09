/* global module: true */

function validateFormValue($form, selector) {
    var $elt = $form.find(selector);
    if ($elt.val().length > 0) {
        return $elt.val();
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

module.exports.validateFormValue = validateFormValue;
module.exports.eltCenter = eltCenter;
module.exports.radius = radius;
module.exports.radians = radians;
module.exports.storageAvailable = storageAvailable;