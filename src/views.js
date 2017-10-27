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
require('../static/js/bootstrap-editable.min.js');

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
        jQuery('body').removeClass('modal-open').removeAttr('style'); // bootstrap4 bug workaround
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

        this.people = options.people;

        this.state = new models.PersonModalState();
        this.template = require('../static/templates/personModal.html');
        this.render();
        this.$el.modal('show');

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
        this.people.add(this.model);
        this.$el.modal('hide');
        jQuery('.modal-backdrop').remove(); // bootstrap4 bug workaround
        jQuery('body').removeClass('modal-open').removeAttr('style'); // bootstrap4 bug workaround
        this.people.trigger('change', this.people, {});
    },
    setAttributes: function() {
        var self = this;
        for (var p in this.model.attributes) {
            this.$el.find('.step:visible [name="' + p + '"]').each(function() {
                if (this.type === 'text' ||
                    (this.type === 'radio' && jQuery(this).is(':checked')) ||
                    this.tagName === 'TEXTAREA' ||
                        this.tagName === 'SELECT') {
                    self.model.set(
                        p, jQuery(this).val().trim(), {silent:true});
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

var PersonViewModal = Backbone.View.extend({
    events: {
        //'click .btn-save': 'onSave',
    },
    initialize: function(options) {
        _.bindAll(this, 'render');

        this.people = options.people;

        this.template = require('../static/templates/personViewModal.html');
        this.render();

        jQuery.fn.editable.defaults.mode = 'inline';
    },
    render: function() {
        var json = {
            person: this.model.toJSON(),
            proximity: models.Proximity,
            influence: models.Influence,
            supportType: models.SupportType
        };
        var markup = this.template(json);
        this.$el.find('.modal-content').html(markup);
        this.$el.modal('show');
        var self = this;
        jQuery('#person-name-edit').editable({
            success: function(response, newValue) {
                self.model.set('name', newValue);
            }
        });
        jQuery('#person-proximity-edit').editable({
            source: [
                {value: 'very-close', text: 'Very Close'},
                {value: 'somewhat-close', text: 'Somewhat Close'},
                {value: 'not-close', text: 'Not Close'}
            ],
            success: function(response, newValue) {
                self.model.set('proximity', newValue);
            }
        });
        jQuery('#person-influence-edit').editable({
            source: [
                {value: 'very-helpful', text: 'Very Helpful'},
                {value: 'somewhat-helpful', text: 'Somewhat Helpful'},
                {value: 'not-helpful', text: 'Not Helpful'}
            ],
            success: function(response, newValue) {
                self.model.set('influence', newValue);
            }
        });
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
        'click .btn-delete-person-confirm': 'deletePersonConfirm',
        'click .btn-delete-person': 'deletePerson',
        'click .btn-view-person': 'viewPerson',
        'click .btn-edit-person': 'editPerson'
    },
    initialize: function(options) {
        _.bindAll(this, 'render',
            'createMap', 'editMap', 'importMap', 'exportMap',
            'addPerson', 'viewPerson', 'editPerson', 'deletePersonConfirm',
            'deletePerson');

        this.createMapTemplate =
            require('../static/templates/createMap.html');

        this.mapTemplate =
            require('../static/templates/map.html');

        this.model = new models.SocialSupportMap();
        this.model.bind('change', this.render);
        this.model.get('people').bind('add', this.render);
        this.model.get('people').bind('remove', this.render);
        this.model.get('people').bind('change', this.render);

        this.render();
        
        jQuery.fn.editable.defaults.mode = 'inline';
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
        jQuery('body').removeClass('modal-open').removeAttr('style'); // bootstrap4 bug workaround
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
            jQuery('body').removeClass('modal-open').removeAttr('style'); // bootstrap4 bug workaround
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
            this.$el.find('.ssnm-map-container').html(markup);

        } else {
            var json = this.model.toJSON();
            json.proximity = models.Proximity;
            json.influence = models.Influence;
            json.supportType = models.SupportType;
            markup = this.mapTemplate(json);
            this.$el.find('.ssnm-map-container').html(markup);

            var self = this;
            jQuery('#map-topic').editable({
                success: function(response, newValue) {
                    self.model.set('topic', newValue);
                }
            });
            jQuery('#map-owner').editable({
                success: function(response, newValue) {
                    self.model.set('owner', newValue);
                }
            });
        }
    },
    createMap: function(evt) {
        evt.preventDefault();

        var $form = jQuery(evt.currentTarget).parents('form');

        var topic = utils.validateFormValue($form, 'input[name="topic"]');
        var owner = utils.validateFormValue($form, 'input[name="owner"]');

        if (topic && owner) {
            this.model.set({'topic': topic, 'owner': owner});
        }
        return false;
    },
    editMap: function() {
        new MapModal({
            el: this.$el.find('#editMapModal'),
            model: this.model
        });
    },
    addPerson: function() {
        new PersonModal({
            el: this.$el.find('#personModal'),
            model: new models.Person({}),
            people: this.model.get('people')
        });
    },
    editPerson: function(evt) {
        var cid = jQuery(evt.currentTarget).data('id');
        var person = this.model.get('people').get(cid);

        new PersonModal({
            el: this.$el.find('#personModal'),
            model: person,
            people: this.model.get('people')
        });
    },
    viewPerson: function(evt) {
        var cid = jQuery(evt.currentTarget).data('id');
        var person = this.model.get('people').get(cid);

        new PersonViewModal({
            el: this.$el.find('#personViewModal'),
            model: person,
            people: this.model.get('people')
        });
    },
    deletePersonConfirm: function(evt) {
        var $elt = jQuery(evt.currentTarget);
        var cid = $elt.data('id');
        var person = this.model.get('people').get(cid);

        jQuery('#confirmDeleteModal').find('.name').html(person.get('name'));
        jQuery('#confirmDeleteModal').find(
            '.btn-delete-person').attr('data-id', cid);
        jQuery('#confirmDeleteModal').modal('show');
    },
    deletePerson: function(evt) {
        jQuery('#confirmDeleteModal').modal('hide');
        jQuery('.modal-backdrop').remove(); // bootstrap4 bug workaround
        jQuery('body').removeClass('modal-open').removeAttr('style'); // bootstrap4 bug workaround

        var cid = jQuery(evt.currentTarget).data('id');
        var person = this.model.get('people').get(cid);

        this.model.get('people').remove(person);
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
