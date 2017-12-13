const styles = require('./index.scss');

// document.documentElement.addEventListener('touchstart', function () {
//     // 处理IOS在点击时 css的伪类:active无效
// });

class CxyKeyboard {

    /**
     * 构造函数
     * @param {object} params 
     * {
     * domId: '', // 节点的domId 默认：cxyKeyboard
     * }
     */
    constructor(params = {}) {
        const { domId, value } = params;
        this.keys = this.defaultKeys();
        this.domId = domId || 'cxyKeyboard';
        this.value = value || ''; // 键盘输入的内容
        this.excludeValue = ['BACK', 'DEL', 'ABC']; // 非输入内容 过滤返回键、删除键、键盘切换键
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
            ele.addEventListener('touchstart', (e) => this.handleCLick(e));
            document.body.appendChild(ele);
            return ele;
        }
    }

    /**
     * 获取Dom节点
     */
    getDom() {
        return document.getElementById(this.domId);
    }

    /**
     * 显示键盘
     * @param {object} param 参数
     * {
     * @param {string} type 键盘的类型 ABC：字母数据键盘；carNumberPre：车牌前缀键盘
     * @param {boolean} ani 显示动画 默认：true
     * @param {string} value 已经输入的内容 
     * }
     */
    show(param = {}) {
        let { type, value, animation = true } = param
        if (!this.keys[type]) {
            // 键盘类型不存在
            type = 'ABC';
        }
        if (value) {
            // 设置默认已经输入的值
            this.value = value;
        }
        return this.createEle(this.domId, 'div', `
                <div class="${styles.keyboard}">
                    <div class="${styles.keys + (animation ? ' ' + styles.showKeys : '')}">
                        ${this.keys[type] && this.keys[type].map(item => `
                            <span keyboard-name="${item.name}" class="${styles.key + ' ' + (item.className || '')}">${item.value || ''}</span>
                        `).join('')}
                    </div>
                    <div class="${styles.bg}" keyboard-hide="1"></div>
                </div>
            `)
    }

    /**
     * 隐藏键盘
     */
    hide() {
        this.value = ''; // 清空内容
        const dom = this.getDom();
        if (dom) {
            dom.className += ' ' + styles.hideKeys; // 隐藏动画
            setTimeout(() => dom.remove(), 300); // 延迟300毫秒删除键盘 等待动画结束
        }
    }

    /**
     * 键盘点击事件
     * @param {element} e 点击的element对象
     */
    handleCLick(e) {
        window.t = e.target.attributes;
        const { attributes } = e.target;
        let hideKeyboard = false; // 隐藏键盘
        let isClickKeyboard = false; // 当前操作是点击键盘

        Object.keys(attributes).map((item, i) => {
            const { name, value } = attributes[item];

            switch (name) {
                // 隐藏键盘
                case 'keyboard-hide':
                    hideKeyboard = true;
                    break;

                // 获取点击的按钮
                case 'keyboard-name':
                    isClickKeyboard = true;
                    if (this.excludeValue.indexOf(value) === -1) {
                        this.value += value; // 保存新增的内容
                    } else if (value === 'BACK') {
                        // 切换键盘
                        this.show({ type: 'carNumberPre', animation: false });
                    } else if (value === 'ABC') {
                        // 切换键盘
                        this.show({ type: 'ABC', animation: false });
                    } else if (value === 'DEL' && this.value.length > 0) {
                        this.value = this.value.slice(0, this.value.length - 1)
                    }
                    break;

                default:

            }
        })

        if (isClickKeyboard) {
            this.onChange(this.value);
        }

        if (hideKeyboard) {
            this.hide();
        }
    }

    /**
     * 键盘输入的内容发生变化
     * @param {string} value 内容
     */
    onChange(value) {
        // 内容发生变化时 会自动触发此函数
    }
}

module.exports = CxyKeyboard;
