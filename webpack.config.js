var path = require('path');

module.exports = {
    entry: __dirname + '/src/index.js',
    output: {
        filename: './bundle.js'
    },
    module: {
        loaders: [
            {test: /\.html$/, loader: 'underscore-template-loader'},
            {test: /\.css$/, loader: 'style-loader!css!'},
            {test: /\.png$/, loader: 'url-loader?mimetype=image/png'},
            {test: /\.jpg$/, loader: 'url-loader?mimetype=image/jpg'},
            {test: /\.json/, loader: 'json-loader'}, {
                test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=application/font-woff&name=./[hash].[ext]'
            }, {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=application/octet-stream&name=./[hash].[ext]'
            }, {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader?&name=./[hash].[ext]' 
            }, {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=image/svg+xml&name=./[hash].[ext]'
            }
        ]
    }
}