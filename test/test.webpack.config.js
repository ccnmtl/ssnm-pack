/* global module: true */
/* eslint security/detect-unsafe-regex: 0 */

module.exports = {
    entry: './test/view-test.js',
    output: {
        filename: './testBundle.js'
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
                    'file-loader'
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader'
                ]
            }
        ]
    }
};
