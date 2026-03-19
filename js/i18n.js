class I18n {
    constructor() {
        this.lang = localStorage.getItem('ef_lang') || 'ko';
        this.supportedLangs = ['ko', 'en', 'ja'];
    }

    setLanguage(lang) {
        if (this.supportedLangs.includes(lang)) {
            this.lang = lang;
            localStorage.setItem('ef_lang', lang);
            this.updateUI();
        }
    }

    getLang() {
        return this.lang;
    }

    getCurrentLangName() {
        const names = { ko: '한국어', en: 'English', ja: '日本語' };
        return names[this.lang];
    }

    t(key) {
        const data = window.dataLoader.getData();
        if (!data) return '';

        // Handle nested keys like 'hero.mainText'
        const keys = key.split('.');
        let value = data;
        for (const k of keys) {
            value = value[k];
            if (!value) break;
        }

        if (value && typeof value === 'object' && value[this.lang]) {
            return value[this.lang];
        } else if (typeof value === 'string') {
            return value;
        }
        
        return key;
    }

    updateUI() {
        const data = window.dataLoader.getData();
        if (!data) return;

        // Meta tags
        document.title = this.t('meta.title');
        document.querySelector('meta[name="description"]').setAttribute('content', this.t('meta.description'));

        // OG tags (Update for client consistency, though static crawl uses default)
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', this.t('meta.title'));
        
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', this.t('meta.description'));

        const ogLocale = document.querySelector('meta[property="og:locale"]');
        if (ogLocale) ogLocale.setAttribute('content', this.lang === 'ko' ? 'ko_KR' : (this.lang === 'ja' ? 'ja_JP' : 'en_US'));

        // Header
        document.getElementById('current-lang').textContent = this.getCurrentLangName();

        // Hero
        document.getElementById('hero-main-text').textContent = this.t('hero.mainText');
        
        // Hero Sub - Main handles typing effect
        if (window.mainApp) window.mainApp.startTypingEffect();
        


        // Section Titles
        document.getElementById('title-webapps').textContent = this.t('sections.webapps');
        document.getElementById('title-games').textContent = this.t('sections.games');
        document.getElementById('title-sns').textContent = this.t('sections.sns');
        document.getElementById('title-contact').textContent = this.t('sections.contact');

        // Common Buttons
        document.getElementById('privacy-btn').textContent = this.t('common.privacy');
        document.getElementById('privacy-modal-title').textContent = this.t('common.privacy');
        document.getElementById('modal-confirm').textContent = this.t('common.close');

        // Components
        if (window.componentRenderer) {
            window.componentRenderer.renderMarquee();
            window.componentRenderer.renderServices();
            window.componentRenderer.renderSNS();
        }
    }
}

window.efI18n = new I18n();
