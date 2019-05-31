const path = require('path');

module.exports = {
    /**
     * @see https://webpack.js.org/configuration/devtool#devtool
     */
    devtool: false,
    /**
     * @see https://webpack.js.org/configuration/entry-context/#entry
     */
    entry: './src/main.ts',
    /**
     * @see https://webpack.js.org/configuration/module/
     */
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    /**
     * @see https://webpack.js.org/configuration/resolve/
     */
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    /**
     * @see https://webpack.js.org/configuration/output/
     */
    output: {
        chunkFilename: '[id].chunk.js',
        filename: '[name].bundle.js',
        library: '[name]',
        libraryTarget: 'var',
        path: path.resolve(__dirname, 'oozaru'),
        sourceMapFilename: '[file].map',
    },
    /**
     * Polyfill or mock certain Node.js globals and modules for the browser.
     * @see https://webpack.js.org/configuration/node/
     */
    node: {
        clearImmediate: false,
        crypto: 'empty',
        fs: 'empty',
        global: true,
        module: false,
        process: true,
        setImmediate: false,
    },
};