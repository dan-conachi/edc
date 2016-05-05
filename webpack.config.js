const webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry: __dirname + '/app/index.js',
  output: {
    filename: 'app.js',
    path : __dirname + '/client/js'
  },
  module : {
    loaders : [
      {test : /\.js$/, loader : 'babel', exclude : /node_modules/, query : {presets : ['es2015']}}
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ]
}
