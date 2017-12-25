const styles = require('./index.scss');

/**
 * H5键盘类
 * @author YS
 */
class CxyKeyboard {

    /**
     * 构造函数
     * @constructor
     * @param {object} params 参数
     * @param {string} params.domId 键盘Dom元素的Id 默认：cxyKeyboard
     */
    constructor(params = {}) {
        const { domId } = params;

        /** 键盘对象 */
        this.keys = this.defaultKeys();

        /** 键盘组件的domId */
        this.domId = domId || 'cxyKeyboard';

        /** 键盘输入的内容 */
        this.value = '';

        /** 过滤的功能按键 */
        this.excludeValue = [
            'BACK', // 返回键
            'DEL', // 删除键
            'ABC', // ABC键盘切换键
            'NONE', // 空白键
            'SWITCH_url', // url小写键盘切换键
            'SWITCH_URL', // URL大写键盘切换键
        ];

        /** 显示键盘时的接收到的参数 */
        this.showParam = {};

        /** 键盘处于显示状态 */
        this.isShow = false;

        /** 当前活跃的输入框Id */
        this.activeId = undefined;

        /** 光标当前位置 */
        this.cursorIndex = undefined;

        /** 点击输入框的次数(键盘隐藏后重置为：0) 当点击第一个文字时，用来随机切换光标的位置。临时处理方法，后续应该将文字的点击区块分为左右两块区域 */
        this.countClick = 0;

        /** 隐藏键盘的标识符 */
        this.hideKeyboard = true;

        /** 判断当前是否可以点击按键 用于避免频繁点击 */
        this.canClickBtn = true;

        /** 保存所有input框在显示键盘时的接收到的参数 */
        this.inputs = {};

        // 其他JS操作
        this.other();
    }

    /**
     * 初始化
     * @param {object} params 参数
     * @param {string} params.domId 键盘Dom元素的Id 默认：cxyKeyboard
     * @param {inputArray} params.inputs placeholder数组
     * @param {string} param.input.selectors css选择器（不支持选input或textarea等输入标签，因为这些标签会调起系统键盘）
     * @param {string} param.input.type 键盘的类型 默认：ABC（字母数字键盘）
     * @param {boolean} param.input.animation 显示动画 默认键盘非显示状态时显示动画，键盘处于显示状态时不显示动画
     * @param {string} param.input.value 已经输入的内容
     * @param {string} param.input.backgroundColor 蒙层背景色 不传时 不显示背景 支持css所支持的数值 例如（rgba(0,0,0,1)、#FFF)
     * @param {string} param.input.placeholder 无输入时的提示
     * @param {string} param.input.placeholderColor placeholder的字体颜色，支持css所支持的字符串
     */
    init(params = {}) {
        const { domId, inputs } = params;

        /** 键盘组件的domId */
        this.domId = domId || 'cxyKeyboard';

        // 初始化输入框
        this.inputsInit(inputs);
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
            // 数字键盘
            number: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'NONE', '0', 'DEL'].map(item => {
                switch (item) {
                    case 'NONE':
                        return {
                            name: item,
                            value: '',
                            className: styles.noneBtn
                        }
                    case 'DEL':
                        return {
                            name: item,
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

            // 带小数点的数字键盘
            digit: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL']
                .map(item => item === 'DEL' ? ({
                    name: item,
                    value: '',
                    className: styles.delBtn
                }) : ({
                    name: item,
                    value: item,
                })),

            // 身份证键盘
            idcard: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'X', '0', 'DEL']
                .map(item => item === 'DEL' ? ({
                    name: item,
                    value: '',
                    className: styles.delBtn
                }) : ({
                    name: item,
                    value: item,
                })),

            // abc键盘（想不到合适的名字）：包含数字和字母，对象类型{value:'',className:''}
            ABC: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
                'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
                'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
                'BACK', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'].map(item => {
                    switch (item) {
                        case 'A':
                            return {
                                name: item,
                                value: item,
                                className: styles.aBox
                            }
                        case 'BACK':
                            return {
                                name: item,
                                value: '地区',
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

            // 车牌前缀键盘
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
                }),

            // url键盘 小写字母+符号
            url: ['.', '#', '&', '?', ':', '/', '@', '-', '_', '=',
                'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p',
                'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
                'SWITCH_URL', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'DEL'].map(item => {
                    switch (item) {
                        case 'a':
                            return {
                                name: item,
                                value: item,
                                className: styles.aBox
                            }
                        case 'SWITCH_URL':
                            return {
                                name: 'SWITCH_URL', // 切换到大写字母+数字键盘
                                value: 'A',
                                className: styles.switchBtn
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
            // URL键盘 大写字母+数字
            URL: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
                'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
                'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
                'SWITCH_url', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'].map(item => {
                    switch (item) {
                        case 'A':
                            return {
                                name: item,
                                value: item,
                                className: styles.aBox
                            }
                        case 'SWITCH_url':
                            return {
                                name: 'SWITCH_url', // 切换到小写字母+符号键盘
                                value: 'a',
                                className: styles.switchBtn
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

            // 绑定触摸离开事件
            ele.addEventListener('touchend', (e) => {
                // 移除长按事件
                CxyKeyboard.removeLongPress();

                // 移除点击按键时的UI效果
                CxyKeyboard.removeKeyActiveUI();
            });

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
     * 获取键盘按键的Dom字符串
     * @param {string} type 键盘类型
     * @returns {string} 返回键盘按键的Dom字符串
     */
    getKeysDomString(type = 'ABC') {
        // 获取键盘的按键
        const keys = this.keys[type];
        if (!keys) return '';

        if (['number', 'digit', 'idcard'].indexOf(type) !== -1) {
            // 数字键盘 || 九宫格风格
            return `<div class="${styles.numberKeyboard}">
                        ${keys.map(item => `
                            <div keyboard-key-name="${item.name}" class="${styles.numKeyBox}">
                                <span class="${styles.numKey + ' ' + (item.className || '')}">${item.value || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="${styles.rigthBtns}">
                    </div>`;
        } else {
            return `<div class="${styles.defaultKeyboard}">
                        ${keys.map(item => `
                            <div keyboard-key-name="${item.name}" class="${styles.keyBox}">
                                <span class="${styles.key + ' ' + (item.className || '')}">${item.value || ''}</span>
                            </div>
                        `).join('')}
                    </div>`;
        }
    }

    /**
     * 显示键盘
     * @param {object} param 参数
     * @param {string} param.selectors css选择器（不支持选input或textarea等输入标签，因为这些标签会调起系统键盘）
     * @param {string} param.type 键盘的类型 默认：ABC（字母数字键盘）
     * @param {boolean} param.animation 显示动画 默认键盘非显示状态时显示动画，键盘处于显示状态时不显示动画 
     * @param {string} param.value 已经输入的内容
     * @param {string} param.backgroundColor 蒙层背景色 不传时 不显示背景 支持css所支持的数值 例如（rgba(0,0,0,1)、#FFF)
     * @param {string} param.placeholder 无输入时的提示
     * @param {string} param.placeholderColor placeholder的字体颜色，支持css所支持的字符串
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

        // 移除光标
        CxyKeyboard.removeCursor();

        const { selectors } = param;

        // 保存当前输入框的内容到inputs中
        this.activeId = selectors; // 保存当前活跃的id
        this.inputs[selectors] = Object.assign(
            {
                value: '',
                type: 'ABC',
                animation: true
            },
            this.inputs[selectors],
            param); // 合并数据

        // 获取合并后的数据
        this.showParam = this.inputs[selectors];
        this.value = this.inputs[selectors].value;

        const { type, animation, backgroundColor } = this.showParam;

        // 处于显示状态时并且不是切换键盘，则不重新渲染
        if (this.isShow && !isSwitch) {
            return false;
        }

        // 键盘显示标识符
        this.isShow = true;

        // 设置内容和光标的位置
        this.setInputValue();

        const ele = this.createEle(this.domId, 'div', `
                <div class="${styles.keyboard}">
                    <div class="${styles.keys + (animation ? ' ' + styles.showKeys : '')}">
                        ${this.getKeysDomString(type)}
                    </div>
                    ${ backgroundColor ? `<div class="${styles.keyboardBg}" keyboard-hide="1" style="background:${backgroundColor}" ></div>` : ''}
                </div>
            `)

        this.dispatchEvent('cxyKeyboard_show');

        return ele;
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
                this.dispatchEvent('cxyKeyboard_hide');
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
        this.dispatchEvent('cxyKeyboard_switchKeyboard');
    }

    /**
     * 新增内容
     * @param {string} value 当前点击按钮的value
     */
    addValue(value) {
        const { maxLength } = this.showParam;

        if (this.value.length >= maxLength) {
            return false; // 禁止写入
        }
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
        this.dispatchEvent('cxyKeyboard_addValue');
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
        this.dispatchEvent('cxyKeyboard_deleteValue');
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

        // 重写静态方法
        CxyKeyboard.handleKeyboard = () => this.handleKeyboard(e);

        // 处理键盘点击事件
        this.handleKeyboard(e);

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
            return this.hideKeyboard = true;
        }

        // 获取点击的按钮
        const keyboardName = attributes['keyboard-key-name'];

        if (keyboardName) {

            // 显示点击按键时的UI效果
            CxyKeyboard.addKeyActiveUI(keyboardName);

            // 处理完UI交互后 再进行逻辑处理
            if (this.excludeValue.indexOf(keyboardName) === -1) {
                // 普通按键 新增的内容
                this.addValue(keyboardName);
            } else if (keyboardName === 'DEL' && this.value.length > 0) {
                // 删除按键
                this.deleteValue(keyboardName);
            } else if (keyboardName === 'BACK') {
                // 切换到车牌前缀键盘
                this.switchKeyboard('carNumberPre');
            } else if (keyboardName === 'ABC') {
                // 切换到ABC键盘
                this.switchKeyboard('ABC');
            } else if (keyboardName === 'SWITCH_URL') {
                // 切换URL大写键盘
                this.switchKeyboard('URL');
            } else if (keyboardName === 'SWITCH_url') {
                // 切换URL小写键盘
                this.switchKeyboard('url');
            }
        }

        // 保存数据到inputs中
        if (this.activeId) this.inputs[this.activeId].value = this.value;

        // 回调内容改变事件
        this.onChange(this.value, this.activeId);
        this.cursorChange(this.cursorIndex || this.value.length - 1, this.activeId);
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
        let index = attributes['keyboard-value-index'];
        if (index) {
            index = index * 1; // 转为整数
        }
        if (index === 0 && this.countClick % 2) {
            // 随机设置index为-1
            index = -1;
        }

        this.cursorIndex = index;
        this.countClick += 1;

        // 获取键盘输入的ID
        const inputId = attributes['keyboard-input-id'];

        // 返回光标位置
        this.cursorChange(this.cursorIndex, inputId);

        // 判断是否切换键盘
        if (inputId && inputId !== this.showParam.selectors) {
            // 切换输入框 切换当前显示的数据
            this.showParam = this.inputs[inputId];
            this.showParam.animation = false; // 不显示动画
            this.value = this.inputs[inputId].value;

            // 移除所有光标
            CxyKeyboard.removeCursor();

            // 切换键盘
            return this.show(this.showParam, true);
        } else {
            // 渲染页面
            return this.setInputValue();
        }
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
            // 延迟500毫秒关闭（UI webview点击延迟400毫秒左右） 避免点击的Dom元素不需要关闭
            CxyKeyboard.handleOtherClickId = setTimeout(() => {
                // 判断是否应该隐藏键盘
                if (this.isShow && this.hideKeyboard) {
                    CxyKeyboard.hide();
                } else {
                    this.hideKeyboard = true;
                }
                CxyKeyboard.handleOtherClickId = undefined;
            }, 500);
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

            // 按钮恢复可点击后 还原关闭标识符（按钮不可点击时还原，在点击过快时会出现键盘被隐藏的状态）
            if (this.canClickBtn) {
                /**
                 * 还原关闭标识符为可关闭   如果不还原，在显示键盘后直接点击空白处则无法关闭键盘
                 * 因为这时候的this.hideKeyboard为false；
                 */
                this.hideKeyboard = true;
            }
        }
    }

    /**
    * 修改输入框的内容以及控制光标
    * @param {object} param 参数
    * @param {boolean} param.showCursor 显示光标
    * @param {string} param.selectors css选择器 选择需要修改的输入框 默认：当前活跃的输入框
    * @param {string} param.value 输入框要显示的内容 默认：this.value
    * @param {string} param.placeholder 无输入时的提示
    * @param {string} param.placeholderColor placeholder的字体颜色，支持css所支持的字符串
    */
    setInputValue(param = {}) {
        // 内容发生变化时 会自动触发此函数
        const {
            showCursor = true,
            selectors = this.showParam.selectors,
            value = this.value,
            placeholder = this.showParam.placeholder,
            placeholderColor = this.showParam.placeholderColor || '#ababab',
        } = param;

        // 判断是否显示光标
        const isShowCursor = showCursor && this.isShow;

        const dom = this.getInputDom(selectors);

        if (dom) {
            const valueArr = value.split('');

            // 当前高亮显示的位置
            let index = this.cursorIndex !== undefined ? this.cursorIndex : this.showParam.cursorIndex || valueArr.length - 1;

            // 光标的样式名称
            let cursorClassName = styles.cursor;
            if (index < 0) {
                cursorClassName += ' ' + styles.leftCursor;
                index = 0; // 不能为负数
            }

            // 输入的内容
            const values = valueArr.map((item, i) =>
                `<span 
                    class="${styles.keyValue + (isShowCursor && i === index ? ' ' + cursorClassName : '')}" 
                    keyboard-value-index="${i}"
                >${item}</span>`)
                .join('');

            // 用P标签包裹输入的内容
            const p = document.createElement('p');
            p.className = styles.input;
            if (values.length > 0) {
                // 存在内容
                p.innerHTML = values;
                p.setAttribute('keyboard-input-id', selectors);
                p.addEventListener('touchstart', (e) => this.handleInput(e));
            } else {
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
     * @param {object} param 返回调用show()时的param参数
     */
    onChange(value, param) {
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
     * @param {string} selectors 包含一个或是多个 CSS 选择器 ，多个则以逗号分隔
     * @returns {element|false} 返回Dom元素，不存在时返回false
     */
    getInputDom(selectors) {
        if (selectors) {
            const dom = document.querySelector(selectors);
            if (dom) return dom;
        }
        return false;
    }

    /**
     * inputs初始化
     * @param {inputArray} inputs placeholder数组
     */
    inputsInit(inputs) {
        if (inputs && inputs.length > 0) {
            inputs.map(item => {
                const { selectors } = item;

                // 保存input的初始参数
                this.inputs[selectors] = Object.assign({}, this.inputs[selectors], item);

                // 初始化placeholder
                const dom = this.getInputDom(selectors);
                if (dom) {
                    this.setInputValue({ showCursor: false, ...item });
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
     * 分派事件
     */
    dispatchEvent(name) {
        const ev = new Event(name, {
            bubbles: 'true',
            cancelable: 'true'
        });
        document.dispatchEvent(ev);
    }

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
        }, 500); // 500毫秒后触发长按事件
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
                try {
                    // 判断是否处于长按状态
                    if (CxyKeyboard.isLongPress) {
                        CxyKeyboard.handleKeyboard();
                    } else {
                        clearInterval(CxyKeyboard.longPressKeyboardFunId);
                    }
                } catch (e) {
                    // 出错时，终止循环切换键盘会用新的Dom元素替换已有Dom元素，所致会导致获取属性失败 出现：TypeError: Cannot read property 'attributes' of null
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
        let { attributes } = target;

        while (attributes) {
            Object.keys(attributes).map(item => {
                const { name, value } = attributes[item];
                attrOjb = Object.assign({ [name]: value }, attrOjb); // 合并对象
                return true
            });
            target = target.parentNode; // 设置target为父元素
            ({ attributes='' } = target); // 获取attributes
        };

        return attrOjb;
    }

    /**
     * 隐藏键盘 静态方法
     */
    static hide() {
        // 隐藏键盘的静态方法会在对象实例化后重新赋值
    }

    /**
     * 添加点击按键时的UI效果
     */
    static addKeyActiveUI(keyboardName) {
        const keyDom = document.querySelector(`[keyboard-key-name="${keyboardName}"] span`);
        if (keyDom) keyDom.className += ' ' + styles.keyActive;
    }

    /**
     * 移除点击按键时的UI效果
     */
    static removeKeyActiveUI() {
        const keysDom = document.querySelectorAll('.' + styles.keyActive);
        const reg = new RegExp(' ' + styles.keyActive, 'g');
        for (let i = 0; i < keysDom.length; i++) {
            keysDom[i].className = keysDom[i].className.replace(reg, '');
        }
    }

    /**
     * 移除光标（避免存在多个输入框时出现多个光标）
     */
    static removeCursor() {
        const cursorsDom = document.querySelectorAll('.' + styles.cursor + ',.' + styles.leftCursor);
        const reg = new RegExp((' ' + styles.cursor + '| ' + styles.leftCursor), 'g');
        for (let i = 0; i < cursorsDom.length; i++) {
            cursorsDom[i].className = cursorsDom[i].className.replace(reg, '');
        }
    }
}

// 静态属性说明

/** 唯一标识符，存在多个实例时，只保存第一个实例的值 */
CxyKeyboard.isOnly = undefined;

/** 长按句柄标识符 */
CxyKeyboard.isLongPress = undefined;

/** 长按键盘的句柄Id */
CxyKeyboard.longPressKeyboardId = undefined;

/** 长按键盘时，重复执行函数的句柄Id */
CxyKeyboard.longPressKeyboardFunId = undefined;

/** 全局触摸事件的句柄Id 用于判断是否应该隐藏键盘 */
CxyKeyboard.handleOtherClickId = undefined;

/** 导出实例，避免多个实例存在多个监听事件以及事件被覆盖等问题 */
module.exports = new CxyKeyboard();
