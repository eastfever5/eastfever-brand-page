class App {
    constructor() {
        this.typingTimeout = null;
        this.init();
    }

    async init() {
        // 1. Data Load
        const data = await window.dataLoader.load();
        if (!data) return;

        // 2. i18n Initialization (handled by instance creation, but need updateUI)
        window.efI18n.updateUI();

        // 3. Force Component Rendering if not already done by i18n
        if (window.componentRenderer) {
            console.log('Main: Rendering components...');
            window.componentRenderer.renderMarquee();
            window.componentRenderer.renderServices();
            window.componentRenderer.renderSNS();
        } else {
            console.error('Main: componentRenderer not found!');
        }

        // 4. Event Listeners
        this.setupEventListeners();

        // 4. Visual Effects
        this.startTypingEffect();
    }

    setupEventListeners() {
        const langBtn = document.getElementById('lang-btn');
        const langDropdown = document.getElementById('lang-dropdown');

        if (langBtn) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                langDropdown.classList.toggle('hidden');
            });
        }

        document.querySelectorAll('#lang-dropdown li').forEach(item => {
            item.addEventListener('click', () => {
                const lang = item.getAttribute('data-lang');
                window.efI18n.setLanguage(lang);
                langDropdown.classList.add('hidden');
            });
        });

        document.addEventListener('click', () => {
            if (langDropdown) langDropdown.classList.add('hidden');
        });
    }

    startTypingEffect() {
        const subTextElement = document.getElementById('hero-sub-text');
        if (!subTextElement) return;

        const lang = window.efI18n.getLang();
        const text = window.efI18n.t('hero.subText');
        
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        subTextElement.innerHTML = '';
        
        let i = 0;
        const type = () => {
            if (i < text.length) {
                // Check for <br>
                if (text.substring(i, i + 4) === '<br>') {
                    subTextElement.innerHTML += '<br>';
                    i += 4;
                } 
                // Check for &nbsp;
                else if (text.substring(i, i + 6) === '&nbsp;') {
                    subTextElement.innerHTML += '&nbsp;';
                    i += 6;
                }
                else {
                    subTextElement.innerHTML += text.charAt(i);
                    i++;
                }
                this.typingTimeout = setTimeout(type, 50);
            }
        };
        type();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new App();
});
