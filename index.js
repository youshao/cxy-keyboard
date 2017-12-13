import CxyKeyboard from './keyboard/index';

const btn = () => {
  const btn = document.createElement('div');
  btn.addEventListener('click', () => {
    const cxyKeyboard = new CxyKeyboard();
    window.cxyKeyboard = cxyKeyboard;
    cxyKeyboard.show({
      type: 'carNumberPre', //  ABC：字母数据键盘；carNumberPre：车牌前缀键盘
      value: '', // 当前输入的内容
      animation: true, // 显示动画 默认：true
    });
    cxyKeyboard.onChange = (value) => console.log("接收到的参数：", value)
  })
  btn.innerHTML = '点击显示键盘';
  document.body.append(btn);
}

btn();


if (module.hot) {
  module.hot.accept('./keyboard/index', function () {
    console.log('页面触发了热更新')
    // 这里需要重新加载组件 否则绑定的事件依旧是旧事件
    const newCxyKeyboard = require('./keyboard/index');
    newCxyKeyboard.show('carNumberPre');
  })
}