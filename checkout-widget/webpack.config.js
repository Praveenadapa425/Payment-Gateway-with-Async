const path = require('path');

module.exports = {
  entry: './src/sdk/PaymentGateway.js',
  output: {
    filename: 'checkout.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'PaymentGateway',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  mode: 'production',
};