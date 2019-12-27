import 'babel-polyfill';
import CxyKeyboard from './keyboard/index';
module.exports = CxyKeyboard;

if (module.hot) {
  module.hot.accept('./keyboard/index', function () {
    // 这里需要重新加载组件 否则绑定的事件依旧是旧事件
    const newCxyKeyboard = require('./keyboard/index');
    module.exports = newCxyKeyboard;
  })
}
