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

module.exports.validateFormValue = validateFormValue;
module.exports.eltCenter = eltCenter;
module.exports.radius = radius;
module.exports.radians = radians;