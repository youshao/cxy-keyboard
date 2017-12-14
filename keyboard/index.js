const styles = require('./index.scss');

class CxyKeyboard {

    /**
     * 构造函数
     * @param {object} params 
     * {
     * @param {string} domId dom节点的Id 默认：cxyKeyboard
     * @param {array} placeholders placeholder数组 结构：{domId:输入框的domId,placeholder,placeholderColor}
     * }
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

        // 点击输入框的次数
        this.countClick = 0;

        // 隐藏键盘
        this.hideKeyboard = true;

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
     */
    addKeys(obj) {
        if (obj && Object.keys(obj).length === 1) {
            // 检测对象是否存在 以及对象是否合法 
            const key = Object.keys(obj)[0];
            this.keys[key] = obj[key]; // 覆盖或是新增键盘
        } else {
            console.error('传入的参数有误：' + JSON.stringify(obj));
        }
    }

    /**
     * 创建dom节点，并且写入内容，如果dom节点以及存在，则修改内容
     * @param {string} id dom节点的ID
     * @param {string} type dom节点的类型
     * @param {string} html 写入dom节点的内容
     * @return domObject 返回dom节点
     */
    createEle(id, type, html) {
        const dom = document.getElementById(id);
        if (dom) {
            // dom节点已经存在
            dom.innerHTML = html;
            return dom;
        } else {
            const ele = document.createElement(type);
            ele.id = id; // 设置id
            ele.innerHTML = html; // 写入内容
            // 监听点击事件
            ele.addEventListener('touchstart', (e) => this.handleClick(e));
            if (document.body) {
                document.body.appendChild(ele);
            } else {
                setTimeout(() => document.body.appendChild(ele), 100); // 延迟 等待body加载完毕
            };
            return ele;
        }
    }

    /**
     * 显示键盘
     * @param {object} param 参数
     * {
     * @param {string} domId 输入节点的ID（不支持<input/>或<textarea/>等输入标签，因为这些标签会调起系统键盘）
     * @param {string} type 键盘的类型 ABC：字母数据键盘；carNumberPre：车牌前缀键盘
     * @param {boolean} ani 显示动画 默认：true 
     * @param {string} value 已经输入的内容
     * @param {string} backgroundColor 蒙层背景色 不传时 不显示背景 支持css所支持的数值 例如（rgba(0,0,0,1)、#FFF)
     * @param {string} placeholder 该提示会在输入字段为空时显示
     * @param {string} placeholderColor placeholder的颜色
     * }
     * @param {boolean} isSwitch 切换键盘标识符，非切换键盘时，如果键盘已经存在，则不重新渲染页面
     */
    show(param = {}, isSwitch = false) {
        // 阻止全局的点击关闭事件
        this.hideKeyboard = false;

        // 处于显示状态时并且不是切换键盘，则不重新渲染
        if (this.isShow && !isSwitch) {
            return false;
        }

        const { domId, type = 'ABC', value = '', animation = true, backgroundColor,
            cursorIndex } = param;

        // 保存传递过来的参数 后续的切换键盘、写入输入等操作需要用到
        this.showParam = param;

        // 设置默认已经输入的值
        this.value = value;

        // 键盘显示标识符
        this.isShow = true;

        // 设置内容和光标的位置
        this.setInputValue(); // 显示光标

        return this.createEle(this.domId, 'div', `
                <div class="${styles.keyboard}">
                    <div class="${styles.keys + (animation ? ' ' + styles.showKeys : '')}">
                        ${this.keys[type] && this.keys[type].map(item => `
                            <div keyboard-name="${item.name}" class="${styles.keyItem}">
                                <span class="${styles.key + ' ' + (item.className || '')}">${item.value || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${ backgroundColor ? `<div class="${styles.bg}" keyboard-hide="1" style="background:${backgroundColor}" ></div>` : ''}
                </div>
            `)
    }

    /**
     * 隐藏键盘
     */
    hide() {
        // 隐藏光标
        this.setInputValue({ showCursor: false });

        const dom = this.getKeyboardDom();
        if (dom) {
            dom.className += ' ' + styles.hideKeys; // 隐藏动画
            setTimeout(() => dom.remove(), 300); // 延迟300毫秒删除键盘 等待动画结束
        }

        // 重置
        this.reset();
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
     * 键盘点击事件
     * @param {element} e 点击的element对象
     */
    handleClick(e) {
        e.preventDefault();

        // 不允许隐藏键盘
        this.hideKeyboard = false;

        // 获取所有参数
        const attributes = CxyKeyboard.getAllAttr(e);

        Object.keys(attributes).map((item, i) => {
            const value = attributes[item];
            switch (item) {
                // 隐藏键盘
                case 'keyboard-hide':
                    this.hideKeyboard = true;
                    break;

                // 获取点击的按钮
                case 'keyboard-name':
                    if (this.excludeValue.indexOf(value) === -1) {
                        // 普通按键 新增的内容
                        this.addValue(value);
                    } else if (value === 'DEL' && this.value.length > 0) {
                        // 删除按键
                        this.deleteValue(value);
                    } else if (value === 'BACK') {
                        // 切换键盘
                        this.switchKeyboard('carNumberPre');
                    } else if (value === 'ABC') {
                        // 切换键盘
                        this.switchKeyboard('ABC');
                    }
                    break;

                default:
                // 哈哈哈，没有考虑到这种情况了吧？
            }
        })

        // 回调内容改变事件
        this.onChange(this.value);
        this.cursorChange(this.cursorIndex || this.value.length - 1);
        this.setInputValue();
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
     * 输入框点击事件
     * @param {element} e 点击的element对象
     */
    handleInput(e) {
        if (this.isShow) e.preventDefault();

        // 不允许隐藏键盘
        this.hideKeyboard = false;

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
     * 页面其他dom节点的点击事件
     * @param {element} e 点击的element对象
     */
    handleOtherClick(e) {
        // 判断是否应该隐藏键盘
        if (this.hideKeyboard) {
            CxyKeyboard.hide();
        } else {
            this.hideKeyboard = true;
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
                    class="${styles.keyValueItem + (isShowCursor && i === index ? ' ' + cursorClassName : '')}" 
                    keyboard-index="${i}"
                >${item}</span>`)
                .join('');

            // 用P标签包裹输入的内容
            const p = document.createElement('p');
            p.className = styles.keyValueBox;
            if (values.length > 0) {
                // 存在内容
                p.innerHTML = values;
                p.addEventListener('touchstart', (e) => this.handleInput(e));
            } else {
                const { placeholder, placeholderColor = '#ccc' } = this.showParam;
                p.innerHTML = placeholder
                    ? `
                    <span 
                        class="${styles.keyValueItem + (isShowCursor ? ' ' + styles.cursor + ' ' + styles.leftCursor : '')}" 
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
     * 获取键盘的Dom节点
     */
    getKeyboardDom() {
        return document.getElementById(this.domId);
    }

    /**
     * 获取输入框的节点 节点不存在时返回false
     */
    getInputDom(domId) {
        if (!domId) {
            // dom节点不存在时 尝试从this.showParam中取
            ({ domId } = this.showParam);
        }
        if (domId) {
            const dom = document.querySelector(domId);
            if (dom) return dom;
        }
        return false;
    }

    /**
     * 初始placeholders
     */
    placeholdersInit(placeholders) {
        console.log('placeholders:', placeholders)
        if (placeholders && placeholders.length > 0) {
            placeholders.map(item => {
                console.log(item)
                const { domId, placeholder, placeholderColor = '#ccc' } = item;
                const dom = this.getInputDom(domId);
                if (dom) {
                    const p = document.createElement('p');
                    p.className = styles.keyValueBox;
                    p.innerHTML = placeholder
                        ? `
                        <span 
                            class="${styles.keyValueItem}" 
                            style="color:${placeholderColor}"
                            >${placeholder}</span>`
                        : '';
                    dom.innerHTML = ''; // 清空内容
                    dom.appendChild(p); // 显示输入的内容
                }
                console.log("dom:", dom)
                return dom;
            })
        }
    }

    /**
     * 其他JS操作
     */
    other() {
        document.documentElement.addEventListener('touchstart', e => this.handleOtherClick(e));

        // 重写静态隐藏键盘的方法 多个实例时，取第一个实例
        CxyKeyboard.hide = () => this.hide();
    }

    /**
     * 获取当前节点以及所有父节点的attribute
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

module.exports = CxyKeyboard;
