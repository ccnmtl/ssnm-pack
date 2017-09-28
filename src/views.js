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


var MapModal = Backbone.View.extend({
    events: {
        'click .btn-save': 'onSave',
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'onSave');

        this.template = require('../static/templates/editMap.html');
        this.render();
    },
    render: function() {
        var json = this.model.toJSON();
        var markup = this.template(json);
        this.$el.find('.modal-content').html(markup);
        this.$el.modal('show');
    },
    onSave: function(evt) {
        var $form = jQuery(evt.currentTarget).parents('.modal').find('form');

        var topic = utils.validateFormValue($form, 'input[name="topic"]');
        var owner = utils.validateFormValue($form, 'input[name="owner"]');

        if (!topic || !owner) {
            evt.preventDefault();
            return false;
        }

        this.model.set({'topic': topic, 'owner': owner});
        jQuery('.modal-backdrop').remove(); // bootstrap4 bug workaround
    }
});

var PersonModal = Backbone.View.extend({
    events: {
        'click .btn-next': 'onNext',
        'click .btn-prev': 'onPrev',
        'click .btn-save': 'onSave',
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'onNext', 'onPrev', 'onSave',
            'isStepComplete');

        this.parent = options.parent;

        this.state = new models.PersonModalState();
        this.template = require('../static/templates/personModal.html');
        this.render();

        this.state.bind('change:step', this.render);
    },
    render: function() {
        var json = {
            person: this.model.toJSON(),
            state: this.state.toJSON(),
            proximity: models.Proximity,
            influence: models.Influence,
            supportType: models.SupportType
        };

        var markup = this.template(json);
        this.$el.find('.modal-content').html(markup);
    },
    isStepComplete: function() {
        this.$el.find('.is-invalid').removeClass('is-invalid');

        var $step = this.$el.find('.step:visible');

        $step.find('input[type="text"]').each(function() {
            if (!jQuery(this).val().trim().length > 0) {
                jQuery(this).addClass('is-invalid');
            }
        });

        $step.find('input[type="radio"]').each(function() {
            // one in the group needs to be checked
            var selector = 'input[name=' + jQuery(this).attr('name') + ']';
            if (!jQuery(selector).is(':checked')) {
                jQuery(this).parents('.form-group').addClass('is-invalid');
            }
        });
        return this.$el.find('.is-invalid').length < 1;
    },
    onNext: function(evt) {
        if (!this.isStepComplete()) {
            evt.preventDefault();
            return false;
        }

        // set properties on my model
        this.setAttributes();

        var step = this.state.get('step');
        this.state.set('step', ++step);
    },
    onPrev: function(evt) {
        var step = this.state.get('step');
        this.state.set('step', --step);
    },
    onSave: function(evt) {
        this.setAttributes();
        this.parent.trigger('savePerson');
    },
    show: function() {
        this.$el.modal('show');
    },
    hide: function() {
        this.$el.modal('hide');
        jQuery('.modal-backdrop').remove(); // bootstrap4 bug workaround
    },
    setAttributes: function() {
        var self = this;
        for (var p in this.model.attributes) {
            this.$el.find('.step:visible [name="' + p + '"]').each(function() {
                if (this.type === 'text' ||
                    (this.type === 'radio' && jQuery(this).is(':checked')) ||
                    this.tagName === 'TEXTAREA' ||
                        this.tagName === 'SELECT') {
                    self.model.set(p, jQuery(this).val().trim());
                } else if (this.type === 'checkbox' &&
                           jQuery(this).is(':checked')) {
                    var a = self.model.get(p);
                    var val = jQuery(this).val();
                    if (a.indexOf(val) < 0) {
                        a.push(val);
                    }
                }
            });
        }
    }
});

var SocialSupportMapView = Backbone.View.extend({
    events: {
        'click .btn-export': 'exportMap',
        'click .btn-import': 'importMap',
        'change :file': 'onFileSelected',
        'click .btn-create-map': 'createMap',
        'click .btn-edit-map': 'editMap',
        'click .btn-add-person': 'addPerson',
    },
    initialize: function(options) {
        _.bindAll(this, 'render',
            'createMap', 'editMap', 'importMap', 'exportMap',
            'addPerson', 'savePerson');

        this.createMapTemplate =
            require('../static/templates/createMap.html');

        this.mapTemplate =
            require('../static/templates/map.html');

        this.model = new models.SocialSupportMap();
        this.model.bind('change', this.render);
        this.model.get('people').bind('add', this.render);
        this.model.get('people').bind('remove', this.render);

        this.on('savePerson', this.savePerson);

        this.personModal = jQuery('#personModal');

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
            var json = this.model.toJSON();
            json.proximity = models.Proximity;
            json.influence = models.Influence;
            json.supportType = models.SupportType;
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
    },
    editMap: function() {
        new MapModal({
            el: this.$el.find('#editMapModal'),
            model: this.model
        });
    },
    addPerson: function() {
        this.personModal = new PersonModal({
            el: this.$el.find('#personModal'),
            model: new models.Person({}),
            parent: this
        });
        this.personModal.show();
    },
    savePerson: function() {
        this.model.get('people').add(this.personModal.model);
        this.personModal.hide();
        delete this.personModal;
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
