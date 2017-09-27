/* global jQuery: true, module: true */
/* exported SocialSupportMapView */

jQuery = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var models = require('./models.js');
var utils = require('./utils.js');

window.jQuery = window.$ = jQuery;
window.Popper = require('popper.js');
require('bootstrap');

var FileSaver = require('filesaver.js');


var SocialSupportMapView = Backbone.View.extend({
    events: {
        'click .btn-export': 'exportMap',
        'click .btn-import': 'importMap',
        'change :file': 'onFileSelected',
        'click .btn-create-map': 'createMap'
    },
    initialize: function(options) {
        _.bindAll(this, 'render',
            'createMap', 'importMap', 'exportMap');

        this.createMapTemplate =
            require('../static/templates/createMap.html');

        this.mapTemplate =
            require('../static/templates/map.html');

        this.model = new models.SocialSupportMap();
        this.model.bind('change', this.render);

        this.render();
    },
    exportMap: function(evt) {
        var dlg = jQuery(evt.currentTarget).parents('.modal');
        var pwd = jQuery(dlg).find('.export-password').val();
        var fName = jQuery(dlg).find('.export-filename').val();

        var cipher = this.model.encrypt(pwd);
        var f = new File([cipher], fName, {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(f, fName);

        jQuery(dlg).modal('hide');
        jQuery('.modal-backdrop').remove(); // bootstrap4 bug workaround
    },
    importMap: function(evt) {
        var self = this;
        var dlg = this.$el.find('#importModal');

        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            var pwd = jQuery(dlg).find('.import-password').val();

            self.model.decrypt(contents, pwd);

            jQuery(dlg).modal('hide');
            jQuery('.modal-backdrop').remove(); // bootstrap4 bug workaround
        };
        reader.readAsText(this.file);
    },
    onFileSelected: function(evt) {
        var file = evt.target.files[0];
        if (!file) {
            alert('Please choose a file');
            return;
        }

        this.$el.find('.selected-file').html(file.name);
        this.file = file;
    },
    render: function() {
        var markup;
        if (this.model.isEmpty()) {
            markup = this.createMapTemplate({});
        } else {
            var json = this.model.toTemplate();
            markup = this.mapTemplate(json);
        }

        this.$el.find('.ssnm-map-container').html(markup);
    },
    createMap: function(evt) {
        var $form = jQuery(evt.currentTarget).parents('form');

        var topic = utils.validateFormValue($form, 'input[name="topic"]');
        var owner = utils.validateFormValue($form, 'input[name="owner"]');

        if (!topic || !owner) {
            evt.preventDefault();
            return false;
        }

        this.model.set({'topic': topic, 'owner': owner});
    }
});

var SocialSupportNetworkApp = {
    initialize: function(options) {
        this.view = new SocialSupportMapView({
            el: jQuery('.interactive-container')
        });
    },
};

module.exports.SocialSupportNetworkApp = SocialSupportNetworkApp;
