/**
 * 开发模式下的webpack配置
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const pxtorem = require('postcss-pxtorem');

const config = {
    entry: [
        // 文件入口配置
        './index.js',
    ],

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

    devtool: 'inline-source-map',

    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        port: '8888',
        hot: true,
        host: '0.0.0.0',
        allowedHosts: [
            'weichao.cx580.com',
        ]
    },

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env'],
                        plugins: ['transform-runtime']
                    }
                },
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
                            localIdentName: '[local]___[hash:base64:5]'
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
            debug: true,
        }),

        new HtmlWebpackPlugin({
            template: 'src/index.html',
            // html模板的路径

            title: 'Development',
            // html的标题

            filename: 'index.html',
            // 文件名以及文件将要存放的位置

            // favicon: './src/favicon.ico',
            // favicon路径

            inject: 'body',
            // js插入的位置，true/'head'  false/'body'

            chunks: ['main'],
            // 指定引入的chunk，根据entry的key配置，不配置就会引入所有页面的资源

            hash: false,
            // 这样每次客户端页面就会根据这个hash来判断页面是否有必要刷新
            // 在项目后续过程中，经常需要做些改动更新什么的，一但有改动，客户端页面就会自动更新！

            minify: {
                // 压缩HTML文件
                removeComments: true,
                // 移除HTML中的注释

                collapseWhitespace: true,
                // 删除空白符与换行符
            }
        }),

        new webpack.HotModuleReplacementPlugin(),
    ]
}

module.exports = config;
