import HtmlWebpackPlugin from 'html-webpack-plugin'
export default () => ({
  mode: 'production',
  devtool: false,
  entry: './src/renderer.tsx',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'electron-scan',
      favicon: 'src/assets/hbk-logo.ico',
      template: 'src/index.html'
    })
  ]
})
