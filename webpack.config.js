const path = require('path')
const TerserWebpackPlugin = require('terser-webpack-plugin')

module.exports = {
    entry: {
        lib: './src/index.ts',
        playground: './src/playground.ts'
    },
    module: {
        rules: [
            {
                test: /\.worker.ts$/,
                use: {
                    loader: 'worker-loader',
                    options: {
                        inline: true,
                        name: '[name].js'
                    }
                }
            },
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
                use: [
                    {
                        loader: 'arraybuffer-loader'
                    }
                ]
            },
            {
                test: /\.glsl$/,
                use: [
                    process.env.MODE === 'production' ? {
                        loader: 'webpack-glsl-minify',
                        options: {
                            esModule: false,
                            preserveUniforms: true
                        }
                    } : {
                        loader: 'raw-loader',
                        options: {
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.glsl', '.wasm']
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: path.resolve(__dirname, 'static'),
        writeToDisk: true
    },
    optimization: {
        minimizer: [
            new TerserWebpackPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    toplevel: true,
                    drop_console: true,
                    dead_code: true
                }
            })
        ]
    },
    node: {
        fs: 'empty'
    }
}
