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

    // Global Language Selector Logic
    initLangSelector() {
        const langBtn = document.getElementById('lang-btn');
        const langDropdown = document.getElementById('lang-dropdown');
        if (!langBtn || !langDropdown) return;

        // Clone and replace to avoid multiple listeners
        const newBtn = langBtn.cloneNode(true);
        langBtn.parentNode.replaceChild(newBtn, langBtn);

        newBtn.addEventListener('click', (e) => {
            if (newBtn.style.pointerEvents === 'none') return;
            e.stopPropagation();
            langDropdown.classList.toggle('hidden');
        });

        const items = langDropdown.querySelectorAll('li');
        items.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', () => {
                const lang = newItem.getAttribute('data-lang');
                this.setLanguage(lang);
                langDropdown.classList.add('hidden');
            });
        });

        document.addEventListener('click', () => {
            langDropdown.classList.add('hidden');
        });
    }

    updateUI() {
        const data = window.dataLoader.getData();
        if (!data) return;

        // 1. Meta tags
        try {
            document.title = this.t('meta.title');
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', this.t('meta.description'));

            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', this.t('meta.title'));
            
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', this.t('meta.description'));

            const ogLocale = document.querySelector('meta[property="og:locale"]');
            if (ogLocale) ogLocale.setAttribute('content', this.lang === 'ko' ? 'ko_KR' : (this.lang === 'ja' ? 'ja_JP' : 'en_US'));

            // Twitter Cards update
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle) twitterTitle.setAttribute('content', this.t('meta.title'));
            
            const twitterDesc = document.querySelector('meta[name="twitter:description"]');
            if (twitterDesc) twitterDesc.setAttribute('content', this.t('meta.description'));
        } catch (e) { console.error('i18n error in meta tags:', e); }

        // 2. Language Selector & Header
        try {
            const path = window.location.pathname;
            const isKoreanOnlyPage = path.includes('/about/') || path.includes('/blog') || path.includes('/post');
                
            const langEl = document.getElementById('current-lang');
            const langBtn = document.getElementById('lang-btn');
            const langDropdown = document.getElementById('lang-dropdown');
            
            if (langEl && langBtn) {
                if (isKoreanOnlyPage) {
                    langEl.textContent = 'Korean Only';
                    langBtn.style.pointerEvents = 'none';
                    langBtn.style.opacity = '0.7';
                    langBtn.title = '이 페이지는 한국어만 지원합니다.';
                    const arrow = langBtn.querySelector('.arrow');
                    if (arrow) arrow.style.display = 'none';
                    
                    if (langDropdown) {
                        langDropdown.style.display = 'none';
                        langDropdown.classList.add('hidden');
                    }
                } else {
                    langEl.textContent = this.getCurrentLangName();
                    langBtn.style.pointerEvents = 'auto';
                    langBtn.style.opacity = '1';
                    langBtn.title = '';
                    const arrow = langBtn.querySelector('.arrow');
                    if (arrow) arrow.style.display = 'inline-block';
                    
                    if (langDropdown) {
                        langDropdown.style.display = '';
                    }
                    this.initLangSelector();
                }
            }
        } catch (e) { console.error('i18n error in language selector:', e); }

        // 3. Navigation
        try {
            const navHome = document.getElementById('nav-home');
            if (navHome) navHome.textContent = this.t('nav.home');
            const navAbout = document.getElementById('nav-about');
            if (navAbout) navAbout.textContent = this.t('nav.about');
            const navBlog = document.getElementById('nav-blog');
            if (navBlog) navBlog.textContent = this.t('nav.blog');
        } catch (e) { console.error('i18n error in navigation:', e); }

        // 4. Hero and Sections
        try {
            const heroMain = document.getElementById('hero-main-text');
            if (heroMain) heroMain.innerHTML = this.t('hero.mainText');

            if (window.mainApp) window.mainApp.startTypingEffect();

            const sections = ['webapps', 'games', 'sns', 'contact'];
            sections.forEach(s => {
                const el = document.getElementById(`title-${s}`);
                if (el) el.textContent = this.t(`sections.${s}`);
            });
        } catch (e) { console.error('i18n error in hero/sections:', e); }

        // 5. Common Buttons and Footer Links
        try {
            const privacyBtn = document.getElementById('privacy-btn');
            if (privacyBtn) privacyBtn.textContent = this.t('common.privacy');
            const privacyModalTitle = document.getElementById('privacy-modal-title');
            if (privacyModalTitle) privacyModalTitle.textContent = this.t('common.privacy');
            const modalConfirm = document.getElementById('modal-confirm');
            if (modalConfirm) modalConfirm.textContent = this.t('common.close');

            const footerTerms = document.getElementById('footer-terms');
            if (footerTerms) footerTerms.textContent = this.t('common.terms');
            const footerPrivacy = document.getElementById('footer-privacy');
            if (footerPrivacy) footerPrivacy.textContent = this.t('common.privacy');
        } catch (e) { console.error('i18n error in common buttons:', e); }

        // 6. Legal Content (Privacy, Terms, Modal)
        try {
            const legalTitle = document.getElementById('legal-title');
            const legalBody = document.getElementById('legal-body');
            const path = window.location.pathname;
            
            if (legalBody) {
                // Ensure text update regardless of markdown renderer
                const isPrivacyPage = path.includes('privacy.html') || path.includes('/privacy');
                const isTermsPage = path.includes('terms.html') || path.includes('/terms');
                
                if (isPrivacyPage) {
                    if (legalTitle) legalTitle.textContent = this.t('common.privacy');
                    document.title = `${this.t('common.privacy')} - EastFever`;
                    if (typeof marked !== 'undefined') legalBody.innerHTML = marked.parse(this.t('privacy'));
                    else console.warn('Markdown library not loaded');
                } else if (isTermsPage) {
                    if (legalTitle) legalTitle.textContent = this.t('common.terms');
                    document.title = `${this.t('common.terms')} - EastFever`;
                    if (typeof marked !== 'undefined') legalBody.innerHTML = marked.parse(this.t('terms'));
                    else console.warn('Markdown library not loaded');
                }
            }

            // Sync modal content if exists
            const modalBody = document.getElementById('privacy-content');
            if (modalBody) {
                const privacyText = this.t('privacy');
                if (typeof marked !== 'undefined') {
                    modalBody.innerHTML = marked.parse(privacyText);
                } else {
                    modalBody.innerHTML = privacyText.replace(/### (.*)/g, '<h3>$1</h3>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/\n/g, '<br>');
                }
            }
        } catch (e) { console.error('i18n error in legal content rendering:', e); }

        // 7. Components
        try {
            if (window.componentRenderer) {
                window.componentRenderer.renderMarquee();
                window.componentRenderer.renderServices();
                window.componentRenderer.renderSNS();
            }
        } catch (e) { console.error('i18n error in components render:', e); }
    }
}

window.efI18n = new I18n();
