/**
 * 开发模式下的webpack配置
 */

const path = require('path');
const webpack = require('webpack');
const pxtorem = require('postcss-pxtorem');

const config = {
    entry: {
        // 文件入口配置
        main: './keyboard/index.js'
    },

    output: {
        // 文件输出配置

        filename: 'bundle.js',
        // 命名生成的JS

        path: path.resolve(__dirname, 'dist'),
        // 目标输出目录 

        publicPath: '',
        // 模板、样式、脚本、图片等资源对应的server上的路径

        library: 'cxyKeyboard',
        // 库名
    },

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: 'ys-[local]'
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            parser: 'postcss-scss',
                            sourceMap: true,
                            plugins: (loader) => [
                                require('precss')(),
                                require('autoprefixer')(),
                                require('rucksack-css')(),
                                pxtorem({
                                    rootValue: 100,
                                    propWhiteList: [],
                                })
                            ]
                        }
                    },
                ]
            },
            {
                test: /\.(otf|eot|svg|ttf|woff|woff2).*$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000
                        }
                    }
                ]
            },
        ]
    },

    plugins: [
        new webpack.LoaderOptionsPlugin({
            debug: false,
        }),

        new webpack.optimize.OccurrenceOrderPlugin(),
        // webapck 会给编译好的代码片段一个id用来区分
        // 而这个插件会让webpack在id分配上优化并保持一致性。
        // 具体是的优化是：webpack就能够比对id的使用频率和分布来得出最短的id分配给使用频率高的模块

        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            },
        }),
    ]
}

module.exports = config;
