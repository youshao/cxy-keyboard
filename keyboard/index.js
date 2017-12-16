import { setTimeout, clearInterval, clearTimeout, setInterval } from 'timers';

const styles = require('./index.scss');

/**
 * H5键盘类
 * @author YS
 */
class CxyKeyboard {

    /**
     * 构造函数
     * @constructor
     * @param {object} params 
     * {
     * @param {string} domId Dom元素的Id 默认：cxyKeyboard
     * @param {array} placeholders placeholder数组
     * [{
     * @param {string} selectors css选择器
     * @param {string} placeholder 无输入时的提示
     * @param {string} placeholderColor placeholder的字体颜色，支持css所支持的字符串
     * }]
     */
    constructor(params = {}) {
        const { domId, placeholders } = params;

        // 键盘
        this.keys = this.defaultKeys();

        // 键盘组件的domId
        this.domId = domId || 'cxyKeyboard';

        // 键盘输入的内容
        this.value = '';

        // 非输入内容 过滤返回键、删除键、键盘切换键
        this.excludeValue = ['BACK', 'DEL', 'ABC'];

        // 显示键盘时的接收到的参数
        this.showParam = {};

        // 键盘处于显示状态
        this.isShow = false;

        // 当前位置
        this.cursorIndex = undefined;

        // 点击输入框的次数 当点击第一个文字时，用来随机切换光标的位置。临时处理方法，后续应该将文字的点击区块分为左右两块区域
        this.countClick = 0;

        // 隐藏键盘
        this.hideKeyboard = true;

        // 判断当前是否可以点击按钮 用于避免频繁点击
        this.canClickBtn = true;

        // 初始化placeholders
        this.placeholdersInit(placeholders);

        // 其他JS操作
        this.other();
    }

    /**
     * 重置
     */
    reset() {
        this.value = '';
        this.showParam = {};
        this.isShow = false;
        this.cursorIndex = undefined;
        this.countClick = 0;
        this.hideKeyboard = true;
    }

    /**
     * 默认键盘对象
     * @returns {object} 键盘对象
     */
    defaultKeys() {
        return {
            // abc键盘（想不到合适的名字）：包含数字和字母，对象类型{value:'',className:''}
            ABC: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
                'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
                'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
                '返回', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'].map(item => {
                    switch (item) {
                        case 'A':
                            return {
                                name: item,
                                value: item,
                                className: styles.aBox
                            }
                        case '返回':
                            return {
                                name: 'BACK',
                                value: item,
                                className: styles.backBtn
                            };
                        case 'DEL':
                            return {
                                name: 'DEL',
                                value: '',
                                className: styles.delBtn
                            }
                        default:
                            return {
                                name: item,
                                value: item,
                            }
                    }
                }),
            carNumberPre: ['京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏',
                '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼',
                '川', '贵', '云', '陕', '甘', '青', '蒙', '桂', '宁', '新',
                'ABC', '藏', '使', '领', '警', '学', '港', '澳', 'DEL'].map(item => {
                    switch (item) {
                        case 'ABC':
                            return {
                                name: item,
                                value: item,
                                className: styles.abcBox
                            }
                        case 'DEL':
                            return {
                                name: 'DEL',
                                value: '',
                                className: styles.delBtn
                            }
                        default:
                            return {
                                name: item,
                                value: item
                            }
                    }
                })
        }
    }

    /**
     * 新增键盘对象 如果键盘已经存在 则覆盖已有键盘
     * @param {object} obj 键盘对象 {key:[{value:'',className}]}
     * @returns {boolean} 返回是否新增成功
     */
    addKeys(obj) {
        if (obj && Object.keys(obj).length === 1) {
            // 检测对象是否存在 以及对象是否合法 
            const key = Object.keys(obj)[0];
            this.keys[key] = obj[key]; // 覆盖或是新增键盘
        } else {
            console.error('传入的参数有误：' + JSON.stringify(obj));
            return false;
        }
        return true;
    }

    /**
     * 创建键盘Dom元素，并且写入内容，如果Dom元素以及存在，则修改内容
     * @param {string} id Dom元素的ID
     * @param {string} type Dom元素的类型
     * @param {string} html 写入Dom元素的内容
     * @returns {DocumentFragment} 文档片段
     */
    createEle(id, type, html) {
        const dom = document.getElementById(id);
        if (dom) {
            // Dom元素已经存在
            dom.innerHTML = html;
            return dom;
        } else {
            const fragment = document.createDocumentFragment();

            // 键盘Dom元素
            const ele = document.createElement(type);
            ele.id = id; // 设置id
            ele.innerHTML = html; // 写入内容

            // 绑定触摸事件
            ele.addEventListener('touchstart', (e) => {
                this.handleClick(e); // 处理触摸事件
                CxyKeyboard.watchLongPress(); // 监听长按事件
            });

            // 手指离开时 移除长按事件
            ele.addEventListener('touchend', (e) => CxyKeyboard.removeLongPress());

            // 添加Dom元素到DocumentFragment中
            fragment.appendChild(ele);

            // 透明背景 用于兼容在UIwebView下 点击空白处时 document.documentElement.addEventListener监听无效
            const ele2Dom = document.querySelector('.' + styles.transparentBg);
            if (!ele2Dom) {
                // Dom元素不存在时 创建Dom元素
                const ele2 = document.createElement('div');
                ele2.className = styles.transparentBg;
                fragment.appendChild(ele2);
            }

            // 渲染Dom元素
            if (document.body) {
                document.body.appendChild(fragment);
            } else {
                console.error('document.body不存在，请确认调用js之前，body是否已经加载')
            };
            return fragment;
        }
    }

    /**
     * 显示键盘
     * @param {object} param 参数
     * {
     * @param {string} selectors css选择器（不支持选<input/>或<textarea/>等输入标签，因为这些标签会调起系统键盘）
     * @param {string} type 键盘的类型 ABC：字母数据键盘；carNumberPre：车牌前缀键盘
     * @param {boolean} animation 显示动画 默认：true 
     * @param {string} value 已经输入的内容
     * @param {string} backgroundColor 蒙层背景色 不传时 不显示背景 支持css所支持的数值 例如（rgba(0,0,0,1)、#FFF)
     * @param {string} placeholder 无输入时的提示
     * @param {string} placeholderColor placeholder的字体颜色，支持css所支持的字符串
     * }
     * @param {boolean} isSwitch 切换键盘标识符，非切换键盘时，如果键盘已经存在，则不重新渲染页面
     * @returns {DocumentFragment} createEle函数返回的文档片段
     */
    show(param = {}, isSwitch = false) {
        // 阻止关闭键盘
        this.stopCloseKeyboard();

        // pushState 来处理安卓点击后退按钮会关闭webView的问题
        if (this.isAndroid() && !this.isShow) {
            history.replaceState({ hideKeyboard: true }, "", "");
            history.pushState({}, "", "");
        }

        // 处于显示状态时并且不是切换键盘，则不重新渲染
        if (this.isShow && !isSwitch) {
            return false;
        }

        const { selectors, type = 'ABC', value = '', animation = true, backgroundColor,
            cursorIndex } = param;

        // 保存传递过来的参数 后续的切换键盘、写入输入等操作需要用到
        this.showParam = param;

        // 设置默认已经输入的值
        this.value = value;

        // 键盘显示标识符
        this.isShow = true;

        // 设置内容和光标的位置
        this.setInputValue();

        return this.createEle(this.domId, 'div', `
                <div class="${styles.keyboard}">
                    <div class="${styles.keys + (animation ? ' ' + styles.showKeys : '')}">
                        ${this.keys[type] && this.keys[type].map(item => `
                            <div keyboard-key-name="${item.name}" class="${styles.keyBox}">
                                <span class="${styles.key + ' ' + (item.className || '')}">${item.value || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${ backgroundColor ? `<div class="${styles.keyboardBg}" keyboard-hide="1" style="background:${backgroundColor}" ></div>` : ''}
                </div>
            `)
    }

    /**
     * 隐藏键盘
     */
    hide() {
        // pushState 来处理安卓点击后退按钮的问题
        if (this.isAndroid() && !this.isShow) {
            history.back();
        }

        // 隐藏光标
        this.setInputValue({ showCursor: false });

        const dom = this.getKeyboardDom();
        if (dom) {
            dom.className += ' ' + styles.hideKeys; // 隐藏动画
            this.removeKeyboardDomId = setTimeout(() => {
                dom.remove(); // 移除键盘Dom元素
                this.reset(); // 重置
            }, 300); // 延迟300毫秒删除键盘 等待动画结束
        }


    }

    /**
     * 恢复处于删除中的键盘
     */
    restoreDeleteKeyboard() {
        const dom = this.getKeyboardDom();
        if (dom && this.removeKeyboardDomId) {
            clearTimeout(this.removeKeyboardDomId); // 阻止删除Dom元素操作
            dom.className = dom.className.replace(' ' + styles.hideKeys, ''); // 移除隐藏动画
        }
    }

    /**
     * 阻止关闭键盘
     */
    stopCloseKeyboard() {
        // 不允许隐藏键盘
        this.hideKeyboard = false;

        // 键盘处于删除状态时，还原键盘
        this.restoreDeleteKeyboard();

        // 移除关闭键盘事件的句柄Id
        this.removeHandleOtherClickId();
    }

    /**
     * 切换键盘
     * @param {string} type 键盘的类型
     */
    switchKeyboard(type = 'ABC') {
        const param = Object.assign({}, this.showParam, { type, value: this.value, animation: false });
        this.show(param, true);
    }

    /**
     * 新增内容
     * @param {string} value 当前点击按钮的value
     */
    addValue(value) {
        // 如果光标位置存在
        if (this.cursorIndex !== undefined) {
            if (this.cursorIndex < 0) {
                this.value = value + this.value;
            } else {
                this.value = this.value.slice(0, this.cursorIndex + 1) + value + this.value.slice(this.cursorIndex + 1);
            }

            this.cursorIndex += 1; // 将光标位置+1

        } else {
            this.value += value;
        }
    }

    /**
     * 删除内容
     * @param {string} value 当前点击按钮的value
     */
    deleteValue(value) {
        // 如果光标位置存在
        if (this.cursorIndex !== undefined) {
            if (this.cursorIndex < 0) {
                // 光标在最左边，所以不需要删除
            } else {
                this.value = this.value.slice(0, this.cursorIndex) + this.value.slice(this.cursorIndex + 1);
            }

            if (this.cursorIndex < 0) {
                this.cursorIndex = -1 // 最小值为-1
            } else {
                this.cursorIndex -= 1; // 将光标位置-1
            }
        } else {
            this.value = this.value.slice(0, this.value.length - 1)
        }
    }

    /**
     * 键盘点击事件
     * @param {element} e 点击的element对象
     */
    handleClick(e) {
        e.preventDefault();

        // 不可点击时，直接返回 避免性能问题
        if (!this.canClickBtn) {
            return false;
        }

        // 设置为不可点击
        this.canClickBtn = false;

        // 阻止关闭键盘
        this.stopCloseKeyboard();

        // 处理键盘点击事件
        this.handleKeyboard(e);

        // 重写静态方法
        CxyKeyboard.handleKeyboard = () => this.handleKeyboard(e);

        // 设置为可点击
        this.canClickBtn = true;
    }

    /**
     * 处理键盘点击事件
     * @param {element} e 点击的element对象
     */
    handleKeyboard(e) {
        // 获取所有参数
        const attributes = CxyKeyboard.getAllAttr(e);

        // 隐藏键盘
        if (attributes['keyboard-hide']) {
            this.hideKeyboard = true;
        }

        // 获取点击的按钮
        const keyboardName = attributes['keyboard-key-name'];
        if (keyboardName) {
            if (this.excludeValue.indexOf(keyboardName) === -1) {
                // 普通按键 新增的内容
                this.addValue(keyboardName);
            } else if (keyboardName === 'DEL' && this.value.length > 0) {
                // 删除按键
                this.deleteValue(keyboardName);
            } else if (keyboardName === 'BACK') {
                // 切换键盘
                this.switchKeyboard('carNumberPre');
            } else if (keyboardName === 'ABC') {
                // 切换键盘
                this.switchKeyboard('ABC');
            }
        }

        // 回调内容改变事件
        this.onChange(this.value);
        this.cursorChange(this.cursorIndex || this.value.length - 1);
        this.setInputValue();
    }

    /**
     * 输入框点击事件
     * @param {element} e 点击的element对象
     */
    handleInput(e) {
        if (this.isShow) e.preventDefault();

        // 阻止关闭键盘
        this.stopCloseKeyboard();

        // 获取所有参数
        const attributes = CxyKeyboard.getAllAttr(e);

        // 获取位置
        let index = attributes['keyboard-index'];
        if (index) {
            index = index * 1; // 转为整数
        }
        if (index === 0 && this.countClick % 2) {
            // 随机设置index为-1
            index = -1;
        }

        this.cursorIndex = index;
        this.countClick += 1;

        // 渲染页面
        this.setInputValue();

        // 返回光标位置
        this.cursorChange(this.cursorIndex);
    }

    /**
     * 页面其他Dom元素的点击事件
     * @param {element} e 点击的element对象
     * @returns {undefined|false} CxyKeyboard.handleOtherClickId句柄存在时返回false
     */
    handleOtherClick(e) {
        if (CxyKeyboard.handleOtherClickId !== undefined) {
            // 句柄ID存在 需要等待句柄Id执行完毕才能执行下一次操作
            return false;
        } else {
            // 延迟关闭 避免点击的Dom元素不需要关闭
            CxyKeyboard.handleOtherClickId = setTimeout(() => {
                // 判断是否应该隐藏键盘
                if (this.isShow && this.hideKeyboard) {
                    CxyKeyboard.hide();
                } else {
                    this.hideKeyboard = true;
                }
                CxyKeyboard.handleOtherClickId = undefined;
            }, 300);
        }

    }

    /**
     * 移除关闭键盘事件的句柄Id
     */
    removeHandleOtherClickId() {
        // 存在关闭键盘的等待句柄
        if (CxyKeyboard.handleOtherClickId) {
            // 取消关闭事件
            clearTimeout(CxyKeyboard.handleOtherClickId);

            // 清除句柄id
            CxyKeyboard.handleOtherClickId = undefined;
        }
    }

    /**
    * 修改输入框的内容以及控制光标
    * @param {object} param 参数
    * {
    * @param {boolean} showCursor 显示光标
    * }
    */
    setInputValue(param = {}) {
        // 内容发生变化时 会自动触发此函数
        const { showCursor = true } = param;

        // 判断是否显示光标
        const isShowCursor = showCursor && this.isShow;

        const dom = this.getInputDom();

        if (dom) {
            const value = this.value.split(''); // 转为数组

            // 当前高亮显示的位置
            let index = this.cursorIndex !== undefined ? this.cursorIndex : value.length - 1;

            // 光标的样式名称
            let cursorClassName = styles.cursor;
            if (index < 0) {
                cursorClassName += ' ' + styles.leftCursor;
                index = 0; // 不能为负数
            }

            // 输入的内容
            const values = value.map((item, i) =>
                `<span 
                    class="${styles.keyValue + (isShowCursor && i === index ? ' ' + cursorClassName : '')}" 
                    keyboard-index="${i}"
                >${item}</span>`)
                .join('');

            // 用P标签包裹输入的内容
            const p = document.createElement('p');
            p.className = styles.input;
            if (values.length > 0) {
                // 存在内容
                p.innerHTML = values;
                p.addEventListener('touchstart', (e) => this.handleInput(e));
            } else {
                const { placeholder, placeholderColor = '#ccc' } = this.showParam;
                p.innerHTML = placeholder
                    ? `
                    <span 
                        class="${styles.keyValue + (isShowCursor ? ' ' + styles.cursor + ' ' + styles.leftCursor : '')}" 
                        style="color:${placeholderColor}">${placeholder}</span>`
                    : '';
            }
            dom.innerHTML = ''; // 清空内容
            dom.appendChild(p); // 显示输入的内容
        }
    }

    /**
     * 键盘输入的内容发生变化
     * @param {string} value 内容
     */
    onChange(value) {
        // 内容发生变化时 会自动触发此函数
    }

    /**
     * 键盘输入的内容发生变化
     * @param {boolean} cursorIndex 光标的位置
     */
    cursorChange(cursorIndex) {
        // 通过此方法可以在用户点击输入框时获得光标的位置
    }

    /**
     * 获取键盘的Dom元素
     * @returns {element} 键盘的Dom元素
     */
    getKeyboardDom() {
        return document.getElementById(this.domId);
    }

    /**
     * 获取输入框的Dom元素
     * @param {string} selectors 包含一个或是多个 CSS 选择器 ，多个则以逗号分隔。默认值：this.showParam.selectors
     * @returns {element|false} 返回Dom元素，不存在时返回false
     */
    getInputDom(selectors = this.showParam.selectors) {
        if (selectors) {
            const dom = document.querySelector(selectors);
            if (dom) return dom;
        }
        return false;
    }

    /**
     * placeholders初始化
     * @param {array} placeholders placeholder数组
     * [{
     * @param {string} selectors css选择器
     * @param {string} placeholder 无输入时的提示
     * @param {string} placeholderColor placeholder的字体颜色，支持css所支持的字符串
     * }]
     */
    placeholdersInit(placeholders) {
        if (placeholders && placeholders.length > 0) {
            placeholders.map(item => {
                const { selectors, placeholder, placeholderColor = '#ccc' } = item;
                const dom = this.getInputDom(selectors);
                if (dom) {
                    const p = document.createElement('p');
                    p.className = styles.input;
                    p.innerHTML = placeholder
                        ? `
                        <span 
                            class="${styles.keyValue}" 
                            style="color:${placeholderColor}"
                            >${placeholder}</span>`
                        : '';
                    dom.innerHTML = ''; // 清空内容
                    dom.appendChild(p); // 显示输入的内容
                }
                return dom;
            })
        }
    }

    /**
     * 浏览器相关
     */
    browser() {
        const u = navigator.userAgent;
        //app = navigator.appVersion;
        return {
            versions: { //移动终端浏览器版本信息 
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端 
                iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器 
                iPad: u.indexOf('iPad') > -1, //是否iPad 
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1 //android终端或uc浏览器 
            }
        }
    }

    /**
     * 检测当前浏览器是否为Android(Chrome)
     */
    isAndroid() {
        const browser = this.browser();
        return browser.versions.android;
    };

    /**
     * 其他JS操作
     */
    other() {
        // 多个实例时 只绑定一次
        if (!CxyKeyboard.isOnly) {
            // 修改唯一标识符为true，后续的实例化会重新覆盖静态方法
            CxyKeyboard.isOnly = true;

            // 重写静态的方法 多个实例时，取第一个实例
            CxyKeyboard.hide = () => this.hide();
            CxyKeyboard.handleOtherClick = e => this.handleOtherClick(e);

            // 绑定事件
            document.documentElement.addEventListener('touchstart', CxyKeyboard.handleOtherClick);
            window.addEventListener('popstate', CxyKeyboard.popstate);
        }
    }

    /**
     * 监听长按事件
     */
    static watchLongPress() {
        clearTimeout(CxyKeyboard.longPressKeyboardId); // 避免重复执行
        CxyKeyboard.longPressKeyboardId = setTimeout(() => {
            CxyKeyboard.isLongPress = true; // 设置长按标识符为true
            CxyKeyboard.longPressKeyboard();
        }, 1000); // 1秒后触发长按事件
    }

    /**
     * 移除长按事件
     */
    static removeLongPress() {
        CxyKeyboard.isLongPress = undefined; // 移除长按标识符
        clearTimeout(CxyKeyboard.longPressKeyboardId);
    }

    /**
     * 键盘长按事件
     */
    static longPressKeyboard() {
        if (CxyKeyboard.isLongPress) {
            // 先移除 再执行，避免出现多个
            clearInterval(CxyKeyboard.longPressKeyboardFunId);

            CxyKeyboard.longPressKeyboardFunId = setInterval(() => {
                // 判断是否处于长按状态
                if (CxyKeyboard.isLongPress) {
                    CxyKeyboard.handleKeyboard();
                } else {
                    clearInterval(CxyKeyboard.longPressKeyboardFunId);
                }
            }, 100); // 每100毫秒 模拟一次按键
        }
    }

    /**
     * 监听路由变化
     * @param {element} e history对象
     */
    static popstate(e) {
        if (e.state) {
            if (e.state.hideKeyboard) CxyKeyboard.hide(); // 隐藏
        }
    }

    /**
     * 获取当前Dom元素以及所有父元素的attribute
     * @param {element} e 点击的element对象
     */
    static getAllAttr(e) {
        let attrOjb = {}; // attribute对象
        let target = e.target;
        let attributes = '';
        do {
            ({ attributes='' } = target); // 获取attributes
            if (attributes) {
                Object.keys(attributes).map(item => {
                    const { name, value } = attributes[item];
                    attrOjb = Object.assign({ [name]: value }, attrOjb); // 合并对象
                    return true
                });
                target = target.parentNode; // 设置target为父元素
            }
        } while (attributes);

        return attrOjb;
    }

    /**
     * 隐藏键盘 静态方法
     */
    static hide() {
        // 隐藏键盘的静态方法会在对象实例化后重新赋值
    }
}

// 静态属性说明
CxyKeyboard.isOnly = undefined; // 唯一标识符，存在多个实例时，只保存第一个实例的值
CxyKeyboard.isLongPress = undefined; // 长按句柄标识符
CxyKeyboard.longPressKeyboardId = undefined; // 长按键盘的句柄Id
CxyKeyboard.longPressKeyboardFunId = undefined; // 长按键盘时，重复执行函数的句柄Id
CxyKeyboard.handleOtherClickId = undefined; // 全局触摸事件的句柄Id 用于判断是否应该隐藏键盘

module.exports = CxyKeyboard;
