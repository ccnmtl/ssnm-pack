var path = require('path');

module.exports = {
    entry: __dirname + '/src/index.js',
    output: {
        filename: './bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [
                    'underscore-template-loader'
                ]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            }
        ]
    }
}
