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
        const path = window.location.pathname;
        const isKoreanOnlyPage = path.includes('/about/') || path.includes('blog.html') || path.includes('post.html');
        const langEl = document.getElementById('current-lang');
        const langBtn = document.getElementById('lang-btn');
        
        if (langEl && langBtn) {
            if (isKoreanOnlyPage) {
                langEl.textContent = 'Korean Only';
                langBtn.style.pointerEvents = 'none';
                langBtn.style.opacity = '0.7';
                langBtn.title = '이 페이지는 한국어만 지원합니다.';
                const arrow = langBtn.querySelector('.arrow');
                if (arrow) arrow.style.display = 'none';
            } else {
                langEl.textContent = this.getCurrentLangName();
                langBtn.style.pointerEvents = 'auto';
                langBtn.style.opacity = '1';
                langBtn.title = '';
                const arrow = langBtn.querySelector('.arrow');
                if (arrow) arrow.style.display = 'inline-block';
            }
        }

        // Hero
        const heroMain = document.getElementById('hero-main-text');
        if (heroMain) heroMain.textContent = this.t('hero.mainText');
        
        // Hero Sub - Main handles typing effect
        if (window.mainApp) window.mainApp.startTypingEffect();

        // Section Titles
        const sections = ['webapps', 'games', 'sns', 'contact'];
        sections.forEach(s => {
            const el = document.getElementById(`title-${s}`);
            if (el) el.textContent = this.t(`sections.${s}`);
        });

        // Common Buttons
        const privacyBtn = document.getElementById('privacy-btn');
        if (privacyBtn) privacyBtn.textContent = this.t('common.privacy');

        const privacyModalTitle = document.getElementById('privacy-modal-title');
        if (privacyModalTitle) privacyModalTitle.textContent = this.t('common.privacy');

        const modalConfirm = document.getElementById('modal-confirm');
        if (modalConfirm) modalConfirm.textContent = this.t('common.close');

        // Components
        if (window.componentRenderer) {
            window.componentRenderer.renderMarquee();
            window.componentRenderer.renderServices();
            window.componentRenderer.renderSNS();
        }
    }
}

window.efI18n = new I18n();
