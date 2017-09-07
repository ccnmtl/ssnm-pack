/* global jQuery: true */

require('!file-loader?name=[name].[ext]!../static/index.html');
require('./static.js');

// load and apply css
require('!style-loader!css-loader!bootstrap/dist/css/bootstrap.min.css');
require('!style-loader!css-loader!bootstrap-arrow-buttons/dist/css/' +
        'bootstrap-arrow-buttons.css');
require('!style-loader!css-loader!../static/css/common.css');
require('!style-loader!css-loader!../static/css/main.css');

var jQuery = require('jquery');

