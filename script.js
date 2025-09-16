// 汇率转换计算器 JavaScript
class CurrencyConverter {
    constructor() {
        this.apiUrl = 'https://api.frankfurter.app/latest';
        this.rates = {};
        this.lastUpdate = null;
        this.baseCurrency = 'CNY';
        
        // 货币信息
        this.currencyNames = {
            'USD': '美元',
            'EUR': '欧元',
            'JPY': '日元',
            'GBP': '英镑',
            'CNY': '人民币',
            'CAD': '加拿大元',
            'AUD': '澳大利亚元',
            'CHF': '瑞士法郎',
            'HKD': '港币',
            'SGD': '新加坡元'
        };
        
        this.init();
    }
    
    async init() {
        // 初始化时获取汇率数据
        await this.fetchRates();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始转换
        this.convertCurrency();
    }
    
    bindEvents() {
        // 输入框变化时自动转换
        document.getElementById('amount').addEventListener('input', () => {
            this.convertCurrency();
        });
        
        // 货币选择变化时自动转换
        document.getElementById('fromCurrency').addEventListener('change', () => {
            this.convertCurrency();
        });
        
        document.getElementById('toCurrency').addEventListener('change', () => {
            this.convertCurrency();
        });
        
        // 回车键转换
        document.getElementById('amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.convertCurrency();
            }
        });
    }
    
    async fetchRates(base = 'USD') {
        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiUrl}?base=${base}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.rates = data.rates;
            this.rates[base] = 1.0; // 基础货币汇率为1
            this.lastUpdate = new Date().toLocaleString('zh-CN');
            
            this.updateUI();
            this.displayRatesTable();
            
        } catch (error) {
            console.error('获取汇率数据失败:', error);
            this.showError('获取汇率数据失败，请检查网络连接');
        } finally {
            this.showLoading(false);
        }
    }
    
    convertCurrency() {
        const amount = parseFloat(document.getElementById('amount').value);
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        
        if (!amount || amount <= 0) {
            document.getElementById('resultSection').style.display = 'none';
            return;
        }
        
        if (!this.rates || Object.keys(this.rates).length === 0) {
            this.showError('汇率数据未加载，请刷新页面');
            return;
        }
        
        try {
            const result = this.calculateExchange(amount, fromCurrency, toCurrency);
            this.displayResult(amount, fromCurrency, result, toCurrency);
        } catch (error) {
            console.error('转换计算错误:', error);
            this.showError('转换计算失败');
        }
    }
    
    calculateExchange(amount, fromCurrency, toCurrency) {
        // 如果源货币和目标货币相同
        if (fromCurrency === toCurrency) {
            return amount;
        }
        
        // 通过USD作为中介货币进行转换
        let result;
        
        if (fromCurrency === 'USD') {
            result = amount * (this.rates[toCurrency] || 1);
        } else if (toCurrency === 'USD') {
            result = amount / (this.rates[fromCurrency] || 1);
        } else {
            // 先转换为USD，再转换为目标货币
            const usdAmount = amount / (this.rates[fromCurrency] || 1);
            result = usdAmount * (this.rates[toCurrency] || 1);
        }
        
        return result;
    }
    
    displayResult(amount, fromCurrency, result, toCurrency) {
        const resultSection = document.getElementById('resultSection');
        const resultAmount = document.getElementById('resultAmount');
        const exchangeRate = document.getElementById('exchangeRate');
        
        const fromName = this.currencyNames[fromCurrency] || fromCurrency;
        const toName = this.currencyNames[toCurrency] || toCurrency;
        
        resultAmount.textContent = `${result.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        })} ${toCurrency}`;
        
        const rate = result / amount;
        exchangeRate.textContent = `汇率: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        
        resultSection.style.display = 'block';
    }
    
    displayRatesTable() {
        const ratesGrid = document.getElementById('ratesGrid');
        ratesGrid.innerHTML = '';
        
        const majorCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];
        
        majorCurrencies.forEach(currency => {
            if (currency !== this.baseCurrency && this.rates[currency]) {
                const rateItem = document.createElement('div');
                rateItem.className = 'rate-item';
                
                const rate = this.calculateExchange(1, this.baseCurrency, currency);
                
                rateItem.innerHTML = `
                    <div class="rate-pair">${this.baseCurrency}/${currency}</div>
                    <div class="rate-value">${rate.toFixed(4)}</div>
                `;
                
                ratesGrid.appendChild(rateItem);
            }
        });
    }
    
    updateUI() {
        document.getElementById('updateTime').textContent = `数据更新时间: ${this.lastUpdate}`;
    }
    
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }
    
    showError(message) {
        alert(`❌ ${message}`);
    }
}

// 全局函数
function swapCurrencies() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    
    // 触发转换
    if (window.converter) {
        window.converter.convertCurrency();
    }
}

function convertCurrency() {
    if (window.converter) {
        window.converter.convertCurrency();
    }
}

function refreshRates() {
    if (window.converter) {
        window.converter.fetchRates();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.converter = new CurrencyConverter();
});

// 添加一些实用功能
document.addEventListener('DOMContentLoaded', () => {
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R 刷新汇率
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshRates();
        }
        
        // Ctrl/Cmd + S 交换货币
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            swapCurrencies();
        }
    });
    
    // 添加触摸支持
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        // 向上滑动刷新
        if (diff > 50) {
            refreshRates();
        }
    });
});