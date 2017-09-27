/* global module: true */

function validateFormValue($form, selector) {
    var $elt = $form.find(selector); 
    if ($elt.val().length > 0) {
        return $elt.val();
    }

    $elt.addClass('is-invalid');
}

module.exports.validateFormValue = validateFormValue;