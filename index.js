import CxyKeyboard from './keyboard/index';

const btn = () => {
  const btn = document.createElement('div');

  // 绑定点击事件
  btn.addEventListener('touchstart', e => {
    // 显示键盘
    cxyKeyboard.show(Object.assign({}, {
      selectors: '#inputId',
      type: 'carNumberPre', //  ABC：字母数据键盘；carNumberPre：车牌前缀键盘
      placeholder: 'testadsga',
    }, window.showParam));

    // 内容发生变化
    cxyKeyboard.onChange = (value) => {
      window.showParam = { value };
    };

    // 光标发生变化
    cxyKeyboard.cursorChange = cursorIndex => {
      window.showParam = Object.assign(window.showParam, { cursorIndex });
    };
  })

  btn.className = 'js-keyboardHandle'; // 点击不会关闭键盘的标识符
  btn.innerHTML = `输入的内容：<span id="inputId"></span>`;
  document.body.appendChild(btn);

  // 示例话 需要放在节点渲染后 否则无法设置placeholder
  const cxyKeyboard = new CxyKeyboard({
    placeholders: [{
      selectors: '#inputId',
      placeholder: 'testadsga'
    }]
  });
  window.cxyKeyboard = cxyKeyboard;
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