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
require('../static/js/bootstrap-editable.js');


var FileSaver = require('filesaver.js');


var PersonAddModal = Backbone.View.extend({
    events: {
        'click .btn-next': 'onNext',
        'click .btn-prev': 'onPrev',
        'click .btn-save': 'onSave',
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'onNext', 'onPrev', 'onSave',
            'isStepComplete', 'destroy');

        this.people = options.people;

        this.state = new models.PersonModalState();
        this.template = require('../static/templates/personModal.html');
        this.render();
        this.$el.modal('show');

        this.state.bind('change:step', this.render);
    },
    destroy: function() {
        this.undelegateEvents();
        this.$el.removeData().unbind();
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
                        p, jQuery(this).val().trim(), {silent: true});
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
    },
    getSupportTypeValues: function() {
        var options = [];
        for (var key in models.SupportType) {
            if (models.SupportType.hasOwnProperty(key)) {
                options.push({value: key,
                    text: models.SupportType[key].display});
            }
        }
        return options;
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
            value: json.person.proximity,
            source: json.proximity,
            success: function(response, newValue) {
                self.model.set('proximity', newValue);
            }
        });
        jQuery('#person-influence-edit').editable({
            value: json.person.influence,
            source: json.influence,
            success: function(response, newValue) {
                self.model.set('influence', newValue);
            }
        });
        jQuery('#person-supporttype-edit').editable({
            value: json.person.supportType,
            source: this.getSupportTypeValues(),
            success: function(response, newValue) {
                self.model.set('supportType', newValue);
            }
        });
        jQuery('#person-notes-edit').editable({
            value: json.person.notes,
            emptytext: 'Add details',
            success: function(response, newValue) {
                self.model.set('notes', newValue);
            }
        });
    }
});

var SocialSupportMapView = Backbone.View.extend({
    events: {
        'click .toggle-slidenav': 'supportTypeMenu',
        'click .btn-export': 'exportMap',
        'click .btn-import': 'importMap',
        'change :file': 'onFileSelected',
        'click .btn-create-map': 'createMap',
        'click .btn-add-person': 'addPerson',
        'click .btn-delete-person-confirm': 'deletePersonConfirm',
        'click .btn-delete-person': 'deletePerson',
        'click .btn-view-person': 'viewPerson',
        'click .btn-print': 'onPrint'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'supportTypeMenu',
            'createMap', 'importMap', 'exportMap',
            'addPerson', 'viewPerson', 'deletePersonConfirm',
            'deletePerson', 'onPrint', 'positionPeople',
            'readSession', 'writeSession');

        this.createMapTemplate =
            require('../static/templates/createMap.html');

        this.mapTemplate =
            require('../static/templates/map.html');

        this.model = new models.SocialSupportMap();

        this.model.bind('change', this.render);
        this.model.get('people').bind('add', this.render);
        this.model.get('people').bind('remove', this.render);
        this.model.get('people').bind('change', this.render);

        if (!this.readSession()) {
            this.render();
        }

        jQuery.fn.editable.defaults.mode = 'inline';
        $(window).on('resize', this.positionPeople);
    },
    supportTypeMenu: function() {
        if(jQuery('.map-support-types').hasClass('slide-up')) {
            jQuery('.map-support-types')
                .addClass('slide-down').removeClass('slide-up');
        } else {
            jQuery('.map-support-types')
                .removeClass('slide-down').addClass('slide-up');
        }
    },
    readSession: function() {
        /* eslint-disable scanjs-rules/identifier_sessionStorage */
        if (utils.storageAvailable('sessionStorage')) {
            var dt = new Date();
            var str =
                dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate();
            var cipher = sessionStorage.getItem('ssnmmap');

            if (cipher) {
                this.model.decrypt(cipher, str);
                return true;
            }
        }
        /* eslint-enable scanjs-rules/identifier_sessionStorage */
        return false;
    },
    writeSession: function() {
        /* eslint-disable scanjs-rules/identifier_sessionStorage */
        /* eslint-disable scanjs-rules/property_sessionStorage */
        if (utils.storageAvailable('sessionStorage')) {
            var dt = new Date();
            var str =
                dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate();
            window.sessionStorage.setItem('ssnmmap', this.model.encrypt(str));
        }
        /* eslint-enable scanjs-rules/identifier_sessionStorage */
        /* eslint-enable scanjs-rules/property_sessionStorage */
    },
    exportMap: function(evt) {
        var dlg = jQuery(evt.currentTarget).parents('.modal');
        var pwd = jQuery(dlg).find('.export-password').val();
        var fName = jQuery(dlg).find('.export-filename').val();

        jQuery(dlg).find('.is-invalid').removeClass('is-invalid');

        var error = false;

        if (!fName) {
            var $elt = jQuery(dlg).find('.export-filename');
            $elt.addClass('is-invalid');
            $elt.parents('.form-group').addClass('is-invalid');
            error = true;
        }

        if (!pwd) {
            $elt = jQuery(dlg).find('.export-password');
            $elt.addClass('is-invalid');
            $elt.parents('.form-group').addClass('is-invalid');
            error = true;
        }

        if (error) {
            return;
        }

        var cipher = this.model.encrypt(pwd);
        var f = new File([cipher], fName, {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(f, fName);

        jQuery(dlg).modal('hide');
    },
    importMap: function(evt) {
        var self = this;
        var dlg = this.$el.find('#importModal');
        jQuery(dlg).find('.is-invalid').removeClass('is-invalid');

        var error = false;

        if (!this.file) {
            var $btn = jQuery(dlg).find('input[type="file"]');
            $btn.addClass('is-invalid');
            $btn.parents('.form-group').addClass('is-invalid');
            error = true;
        }

        var $pwd = jQuery(dlg).find('.import-password');
        var password = $pwd.val();
        if (!password) {
            $pwd.addClass('is-invalid');
            $pwd.parents('.form-group').addClass('is-invalid');
            error = true;
        }

        if (error) {
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                self.model.decrypt(e.target.result, password);

                jQuery(dlg).modal('hide');

                // bootstrap4 bug workaround
                jQuery('.modal-backdrop').remove();
                jQuery('body').removeClass('modal-open').removeAttr('style');
            } catch(err) {
                var $elt = jQuery(dlg).find('.file-read-error');
                $elt.addClass('is-invalid');
                $elt.parents('.form-group').addClass('is-invalid');
            }
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
    shells: {
        'very-close': {
            'startingAngle': 270,
            'increment': 60
        },
        'somewhat-close': {
            'startingAngle': 240,
            'increment': 30
        },
        'not-close': {
            'startingAngle': 255,
            'increment': 25
        }
    },
    positionPeople: function() {
        // reset mapping
        for (var key in this.shells) {
            if (this.shells.hasOwnProperty(key)) {
                this.shells[key].angle = this.shells[key].startingAngle;
            }
        }

        // base center from the interior circle
        var ctr = utils.eltCenter(this.$el.find('.circle-center'));

        // position people based on current layout
        var self = this;
        this.model.get('people').forEach(function(person) {
            var sel = '.person-container[data-id="' + person.cid + '"]';
            var $elt = self.$el.find(sel);

            var proximity = person.get('proximity');
            var radius = utils.radius(self.$el.find('.circle-' + proximity));
            var radians = utils.radians(self.shells[proximity].angle);
            self.shells[proximity].angle += self.shells[proximity].increment;

            $elt.css({
                'left': radius * Math.cos(radians) + ctr.x - $elt.width() / 2,
                'top': radius * Math.sin(radians) + ctr.y - $elt.height() / 2
            });
        });
    },
    context: function() {
        var ctx = this.model.toJSON();
        ctx.proximity = models.Proximity;
        ctx.influence = models.Influence;
        ctx.supportType = models.SupportType;
        return ctx;
    },
    render: function() {
        var markup;
        if (this.model.isEmpty()) {
            markup = this.createMapTemplate({});
            this.$el.find('.ssnm-map-container').html(markup);
        } else {
            this.writeSession();

            // render the map layer
            markup = this.mapTemplate(this.context());
            this.$el.find('.ssnm-map-container').html(markup);

            // position the people
            this.positionPeople();

            var self = this;
            this.$el.find('#map-topic').editable({
                success: function(response, newValue) {
                    self.model.set('topic', newValue);
                }
            });
            this.$el.find('#map-owner').editable({
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
    addPerson: function() {
        var view = new PersonAddModal({
            el: this.$el.find('#personModal'),
            model: new models.Person({}),
            people: this.model.get('people')
        });
        this.$el.find('#personModal').on('hidden.bs.modal', function(e) {
            view.destroy();
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

        var $modal = this.$el.find('#confirmDeleteModal');
        $modal.find('.name').html(person.get('name'));
        $modal.find('.btn-delete-person').attr('data-id', cid);
        $modal.modal('show');
    },
    deletePerson: function(evt) {
        this.$el.find('#confirmDeleteModal').modal('hide');

        // bootstrap4 bug workaround
        jQuery('.modal-backdrop').remove();
        jQuery('body').removeClass('modal-open').removeAttr('style');

        var cid = jQuery(evt.currentTarget).data('id');
        var person = this.model.get('people').get(cid);

        this.model.get('people').remove(person);
    },
    onPrint: function(evt) {
        window.print();
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
