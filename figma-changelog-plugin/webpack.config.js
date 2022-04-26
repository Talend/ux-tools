const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => ({
    mode: argv.mode === "production" ? "production" : "development",
    devtool: argv.mode === "production" ? false : "inline-source-map",
    entry: {
        ui: "./src/ui.tsx",
        code: "./src/code.ts",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            // { test: /\.(png|jpg|gif|webp|svg|zip)$/, loader: [{ loader: 'url-loader' }] }
            {
                test: /\.svg/,
                type: "asset/inline",
            },
        ],
    },
    resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"] },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new webpack.DefinePlugin({
            global: {},
        }),
        new HtmlWebpackPlugin({
            inject: "body",
            template: "./src/ui.html",
            filename: "ui.html",
            chunks: ["ui"],
        }),
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
    ],
});
