/* global jQuery: true, module: true */
/* exported SocialSupportMapView */

jQuery = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var models = require('./models.js');

window.jQuery = window.$ = jQuery;
window.Popper = require('popper.js');
require('bootstrap');

var FileSaver = require('filesaver.js');

var SocialSupportMapView = Backbone.View.extend({
    events: {
        'click .btn-export': 'exportMap',
        'click .btn-import': 'importMap',
        'change :file': 'onFileSelected'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'exportMap', 'importMap');

        this.mapTemplate =
            require('../static/templates/map.html');

        this.model = new models.SocialSupportMap();
        this.model.bind('change', this.render);

        this.render();

    },
    exportMap: function(evt) {
        // debug only. this will be removed
        this.model.set({
            'topic': this.$el.find('input[name="map-topic"]').val(),
            'nickname': this.$el.find('input[name="map-nickname"]').val()
        });

        var dlg = jQuery(evt.currentTarget).parents('.modal');
        var pwd = jQuery(dlg).find('.export-password').val();
        var fName = jQuery(dlg).find('.export-filename').val();

        var cipher = this.model.encrypt(pwd);
        var f = new File([cipher], fName, {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(f, fName);

        jQuery(dlg).modal('hide');
    },
    importMap: function(evt) {
        var self = this;
        var dlg = jQuery(evt.currentTarget).parents('.modal');

        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            var pwd = jQuery(dlg).find('.import-password').val();

            self.model.decrypt(contents, pwd);

            jQuery(dlg).modal('hide');
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
        var json = this.model.toTemplate();
        var markup = this.mapTemplate(json);
        this.$el.find('.ssnm-map-container').html(markup);
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
