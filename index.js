import CxyKeyboard from './keyboard/index';

const btn = () => {
  const btn = document.createElement('div');

  // 绑定点击事件
  btn.addEventListener('touchstart', e => {
    // 显示键盘
    cxyKeyboard.show(Object.assign({}, {
      selectors: '#inputId',
      type: 'idcard', //  ABC：字母数据键盘；carNumberPre：车牌前缀键盘 number:数字键盘 digit:带小数点的数字键盘 idcard:身份证键盘
      placeholder: 'testadsga',
    }, window.showParam));
  })

  btn.id = 'inputId'; // 点击不会关闭键盘的标识符
  btn.style = 'margin:20px auto; padding:0 2px; width:80%; min-height:30px; line-height:30px; max-height:200px; over-flow:auto; border:1px solid #000';
  document.body.appendChild(btn);

  // 示例话 需要放在节点渲染后 否则无法设置placeholder
  const cxyKeyboard = new CxyKeyboard({
    placeholders: [{
      selectors: '#inputId',
      placeholder: 'testadsga'
    }]
  });

  window.keyboard = cxyKeyboard;

  // 内容发生变化
  cxyKeyboard.onChange = (value) => {
    window.showParam = { value };
  };

  // 光标发生变化
  cxyKeyboard.cursorChange = cursorIndex => {
    window.showParam = Object.assign(window.showParam, { cursorIndex });
  };
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