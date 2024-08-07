/* global module: true */
/* exported SocialSupportMapView */

var jQuery = require('jquery');
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

        this.map = options.map;
        this.people = options.people;
        this.shellLimits = options.shellLimits;
        this.state = new models.PersonModalState();
        this.template = require('../static/templates/personModal.html');
        this.render();
        this.$el.modal({
            backdrop: 'static',
            show: true
        });

        this.state.bind('change:step', this.render);
    },
    destroy: function() {
        this.undelegateEvents();
        this.$el.removeData().unbind();
    },
    render: function() {
        var context = {
            map: this.map.toJSON(),
            person: this.model.toJSON(),
            state: this.state.toJSON(),
            proximity: models.Proximity,
            influence: models.Influence,
            supportType: models.SupportType,
            shellLimits: this.shellLimits
        };

        var markup = this.template(context);
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

        utils.trackEvent('add_person', {
            'support_type': this.model.get('supportType'),
            'influence': this.model.get('influence'),
            'proximity': this.model.get('proximity'),
            'notes': this.model.get('notes').length > 0
        });
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
                    var value = utils.sanitize(jQuery(this).val().trim());
                    self.model.set(p, value, {silent: true});
                } else if (this.type === 'checkbox' &&
                           jQuery(this).is(':checked')) {
                    var a = self.model.get(p);
                    var val = utils.sanitize(jQuery(this).val());
                    if (a.indexOf(val) < 0) {
                        a.push(val);
                    }
                }
            });
        }
    }
});

var PersonViewModal = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');

        this.people = options.people;
        this.proximityChoices = options.proximityChoices;
        this.shellsFull = options.shellsFull;
        this.shellLimits = options.shellLimits;
        this.template = require('../static/templates/personViewModal.html');
        this.render();
    },
    getSupportTypeValues: function() {
        var options = [];
        for (var key in models.SupportType) {
            if (Object.prototype.hasOwnProperty.call(models.SupportType, key)) {
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
            supportType: models.SupportType,
            shellLimits: this.shellLimits,
            shellsFull: this.shellsFull
        };
        var markup = this.template(json);
        this.$el.find('.modal-content').html(markup);
        this.$el.modal({
            backdrop: 'static',
            show: true
        });
        var self = this;
        jQuery('#person-name-edit').editable({
            success: function(response, newValue) {
                self.model.set('name', utils.sanitize(newValue));
            }
        });
        jQuery('#person-proximity-edit').editable({
            value: json.person.proximity,
            source: this.proximityChoices,
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
                self.model.set('notes', utils.sanitize(newValue));
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
        'click .btn-print': 'onPrint',
        'click .map-support-types .support-type-header': 'toggleHighlight',
        'click .btn-new-map': 'newMap'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'supportTypeMenu',
            'createMap', 'importMap', 'exportMap', 'newMap',
            'addPerson', 'viewPerson', 'deletePersonConfirm',
            'deletePerson', 'onPrint', 'shellLimits',
            'renderPeople', 'renderPrintView',
            'readSession', 'writeSession',
            'toggleHighlight', 'removeHighlight');

        jQuery.fn.editable.defaults.mode = 'inline';

        this.createMapTemplate =
            require('../static/templates/createMap.html');

        this.mapTemplate =
            require('../static/templates/map.html');

        this.createModel();

        if (!this.readSession()) {
            this.createSessionId();
            this.render();
        }

        $(window).on('resize', this.renderPeople);

        if (utils.getUrlParameter('title', '1') === '0') {
            this.$el.find('header').hide();
        }

        if (utils.getUrlParameter('footer', '1') === '0') {
            this.$el.find('footer').hide();
        }
    },
    createModel: function() {
        if (this.model) {
            this.model.destroy();
        }

        this.model = new models.SocialSupportMap();
        this.model.bind('change', this.render);
        this.model.get('people').bind('add', this.render);
        this.model.get('people').bind('remove', this.render);
        this.model.get('people').bind('change', this.render);
    },
    supportTypeMenu: function() {
        if(jQuery('.map-support-types').hasClass('slide-up')) {
            jQuery('.map-support-types')
                .addClass('slide-down').removeClass('slide-up');
            jQuery('.toggle-slidenav .fa')
                .removeClass('fa-times').addClass('fa-align-justify');
        } else {
            jQuery('.map-support-types')
                .removeClass('slide-down').addClass('slide-up');
            jQuery('.toggle-slidenav .fa')
                .removeClass('fa-align-justify').addClass('fa-times');
        }
    },
    createSessionId: function() {
        if (window.gtag) {
            var sid = utils.guid();
            this.model.set('sessionId', sid);
            window.gtag('set', {'user_id': sid});
        }
    },
    setSessionId: function(sessionId) {
        if (window.gtag !== undefined) {
            window.gtag('set', {'user_id': sessionId});
        }
    },
    readSession: function() {
        if (utils.storageAvailable('sessionStorage')) {
            var dt = new Date();
            var str =
                dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate();
            var cipher = sessionStorage.getItem('ssnmmap');

            if (cipher) {
                this.model.decrypt(cipher, str);
                this.setSessionId(this.model.get('sessionId'));
                return true;
            }
        }
        return false;
    },
    writeSession: function() {
        if (utils.storageAvailable('sessionStorage')) {
            var dt = new Date();
            var str =
                dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate();
            window.sessionStorage.setItem('ssnmmap', this.model.encrypt(str));
        }
    },
    newMap: function(evt) {
        this.$el.find('#confirmNewMapModal').modal('hide');
        window.sessionStorage.removeItem('ssnmmap');

        this.createModel();
        this.render();
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

        if (!pwd || pwd.length < 8) {
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

        // map was exported
        utils.trackEvent('export_map', {});

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

                // map was imported
                utils.trackEvent('import_map', {});

            // eslint-disable-next-line no-unused-vars
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

        this.$el.find('.selected-file').html('Filename: <em>'
            + file.name+'</em>');
        this.file = file;
    },
    shells: {
        'very-close': {
            'startingAngle': 270,
            'increment': 60,
            'printRadius': 125
        },
        'somewhat-close': {
            'startingAngle': 240,
            'increment': 30,
            'printRadius': 275
        },
        'not-close': {
            'startingAngle': 255,
            'increment': 25,
            'printRadius': 425
        }
    },
    maxPerShell: 6,
    shellLimits: function() {
        for (var key in this.shells) {
            if (Object.prototype.hasOwnProperty.call(this.shells, key)) {
                var selector = '.map-people .person-container.' + key;
                this.shells[key].full =
                    this.$el.find(selector).length >= this.maxPerShell;
            }
        }
        return this.shells;
    },
    shellsFull: function() {
        return this.model.get('people').length >= (this.maxPerShell * 3);
    },
    renderPrintView: function(people) {
        // reset mapping
        for (var key in this.shells) {
            if (Object.prototype.hasOwnProperty.call(this.shells, key)) {
                this.shells[key].angle = this.shells[key].startingAngle;
            }
        }

        // position people in the printable map container based on a
        // hard-coded center + hard-coded radii
        var self = this;
        var ctr = {'x': 150, 'y': 480};
        var selector = '.person-container-print';

        this.model.get('people').forEach(function(person) {
            var sel = selector + '[data-id="' + person.cid + '"]';
            var $elt = self.$el.find(sel);

            var proximity = person.get('proximity');
            var radius = self.shells[proximity].printRadius;
            var radians = utils.radians(self.shells[proximity].angle);
            self.shells[proximity].angle += self.shells[proximity].increment;

            $elt.css({
                'left': radius * Math.cos(radians) + ctr.x - $elt.width() / 2,
                'top': radius * Math.sin(radians) + ctr.y - $elt.height() / 2
            });
        });
    },
    renderPeople: function(people) {
        // reset mapping
        for (var key in this.shells) {
            if (Object.prototype.hasOwnProperty.call(this.shells, key)) {
                this.shells[key].angle = this.shells[key].startingAngle;
            }
        }

        // position people in the responsive container based on the
        // center of the owner circle and radiating outward to the
        // three shells. Using a hard-coded startingAngle & incrementing
        // arc. These variables possibly could be calculated.
        var self = this;
        var ctr = utils.eltCenter(this.$el.find('.circle-center'));
        var selector = '.person-container';

        this.model.get('people').forEach(function(person) {
            var sel = selector + '[data-id="' + person.cid + '"]';
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
        ctx.mapBackground = './map-print-background.png';
        ctx.peopleByProximity = this.model.get('people').groupByProximity();
        ctx.showImportExport = utils.isImportExportSupported();
        ctx.shellsFull = this.shellsFull();
        return ctx;
    },
    render: function() {
        var markup;
        if (this.model.isEmpty()) {
            markup = this.createMapTemplate({
                'showImportExport': utils.isImportExportSupported()
            });
            this.$el.find('.ssnm-map-container').html(markup);
            this.$el.show();
        } else {
            this.writeSession();

            // render the map layer
            markup = this.mapTemplate(this.context());
            this.$el.find('.ssnm-map-container').html(markup);

            this.$el.show();

            // position the people
            this.renderPeople();
            this.renderPrintView();
            this.shellLimits();

            var self = this;
            this.$el.find('#map-topic').editable({
                success: function(response, newValue) {
                    self.model.set('topic', utils.sanitize(newValue));
                }
            });
            this.$el.find('#map-owner').editable({
                success: function(response, newValue) {
                    self.model.set('owner', utils.sanitize(newValue));
                }
            });
            jQuery(function() {
                jQuery('.btn-add-person').popover('show');
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
            map: this.model,
            people: this.model.get('people'),
            shellLimits: this.shellLimits()
        });
        this.$el.find('#personModal').on('hidden.bs.modal', function(e) {
            view.destroy();
        });
    },
    viewPerson: function(evt) {
        var cid = jQuery(evt.currentTarget).data('id');
        var person = this.model.get('people').get(cid);

        var limits = this.shellLimits();
        var choices = {};
        for (var key in limits) {
            if (Object.prototype.hasOwnProperty.call(limits, key) &&
                   (person.get('proximity') === key || !limits[key].full)) {
                choices[key] = models.Proximity[key];
            }
        }

        new PersonViewModal({
            el: this.$el.find('#personViewModal'),
            model: person,
            people: this.model.get('people'),
            proximityChoices: choices,
            shellsFull: this.shellsFull()
        });
        return false;
    },
    deletePersonConfirm: function(evt) {
        var cid = jQuery(evt.currentTarget).attr('data-id');
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

        var cid = jQuery(evt.currentTarget).attr('data-id');
        var person = this.model.get('people').get(cid);

        this.model.get('people').remove(person);
    },
    onPrint: function(evt) {
        window.print();
    },
    removeHighlight: function() {
        this.$el.find('.highlight').removeClass('highlight');
        this.$el.find('.dehighlight').removeClass('dehighlight');
    },
    toggleHighlight: function(evt) {
        var highlighted = jQuery(evt.currentTarget).hasClass('highlight');

        this.removeHighlight();

        if (!highlighted) {
            // highlight the selector
            jQuery(evt.currentTarget).addClass('highlight');

            // dehighlight all person containers
            this.$el.find('.person-container').addClass('dehighlight');

            // remove the dehighlight class from supportive individuals
            var supportType = jQuery(evt.currentTarget).data('id');
            var people =
                this.model.get('people').filterBySupportType(supportType);
            for (var i = 0; i < people.length; i++) {
                var selector = '.person-container[data-id="'
                    + people[i].cid + '"]';
                this.$el.find(selector).removeClass('dehighlight');
            }

            utils.trackEvent('highlight_support_type', {
                'support_type': supportType,
            });
        }
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
