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
        // For pure CSS - /\.css$/i,
        // For Sass/SCSS - /\.((c|sa|sc)ss)$/i,
        // For Less - /\.((c|le)ss)$/i,
        test: /\.((c|sa|sc)ss)$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              // Run `postcss-loader` on each CSS `@import` and CSS modules/ICSS imports, do not forget that `sass-loader` compile non CSS `@import`'s into a single file
              // If you need run `sass-loader` and `postcss-loader` on each CSS `@import` please set it to `2`
              importLoaders: 1,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      stage: 0,
                    },
                  ],
                ],
              },
            },
          },
          // Can be `less-loader`
          {
            loader: "sass-loader",
          },
        ],
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
