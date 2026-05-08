class I18n {
    constructor() {
        this.supportedLangs = ['ko', 'en', 'ja'];
        const queryLang = this.getLanguageFromUrl();
        const savedLang = localStorage.getItem('ef_lang');
        this.lang = queryLang || (this.supportedLangs.includes(savedLang) ? savedLang : 'ko');

        if (queryLang) {
            localStorage.setItem('ef_lang', queryLang);
        }
    }

    setLanguage(lang) {
        if (this.supportedLangs.includes(lang)) {
            this.lang = lang;
            localStorage.setItem('ef_lang', lang);
            this.syncLanguageUrl(lang);
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

    getLanguageFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            const lang = params.get('lang');
            return this.supportedLangs.includes(lang) ? lang : null;
        } catch (e) {
            return null;
        }
    }

    getPageKey() {
        const path = window.location.pathname;
        if (path.includes('privacy.html') || path.includes('/privacy')) return 'privacy';
        if (path.includes('terms.html') || path.includes('/terms')) return 'terms';
        if (path.includes('/about/')) return 'about';
        if (path.includes('blog.html') || path.includes('/blog')) return 'blog';
        if (path.includes('post.html') || path.includes('/post')) return 'post';
        return 'home';
    }

    isKoreanOnlyPage(pageKey = this.getPageKey()) {
        return ['about', 'blog', 'post'].includes(pageKey);
    }

    getSeoLang(pageKey = this.getPageKey()) {
        return this.isKoreanOnlyPage(pageKey) ? 'ko' : this.lang;
    }

    getLocale(lang) {
        const locales = { ko: 'ko_KR', en: 'en_US', ja: 'ja_JP' };
        return locales[lang] || locales.ko;
    }

    getLocalizedValue(value, lang, fallback = '') {
        if (!value) return fallback;
        if (typeof value === 'string') return value;
        return value[lang] || value.ko || fallback;
    }

    getPageUrl(pageKey, lang, data) {
        const baseUrl = ((data.meta && data.meta.baseUrl) || 'https://eastfever.com').replace(/\/$/, '');
        const pagePaths = {
            home: '/',
            privacy: '/privacy.html',
            terms: '/terms.html',
            about: '/about/',
            blog: '/blog.html',
            post: '/post.html'
        };

        let url = `${baseUrl}${pagePaths[pageKey] || '/'}`;

        if (pageKey === 'post') {
            const postId = new URLSearchParams(window.location.search).get('id');
            return postId ? `${url}?id=${encodeURIComponent(postId)}` : url;
        }

        if (!this.isKoreanOnlyPage(pageKey) && lang !== 'ko') {
            url += `?lang=${encodeURIComponent(lang)}`;
        }

        return url;
    }

    getPageSeo(data, pageKey, lang) {
        const meta = data.meta || {};
        const pageMeta = meta.pages && meta.pages[pageKey] ? meta.pages[pageKey] : {};
        const title = this.getLocalizedValue(pageMeta.title, lang, this.getLocalizedValue(meta.title, lang, 'EastFever'));
        const description = this.getLocalizedValue(pageMeta.description, lang, this.getLocalizedValue(meta.description, lang, 'EastFever'));

        return {
            title,
            description,
            image: meta.image || 'https://eastfever.com/assets/og-image-final.webp?v=38',
            locale: this.getLocale(lang),
            siteName: meta.siteName || 'EastFever',
            url: this.getPageUrl(pageKey, lang, data),
            type: pageKey === 'post' ? 'article' : 'website'
        };
    }

    setMeta(kind, key, content) {
        if (!content) return;
        let el = document.querySelector(`meta[${kind}="${key}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(kind, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    setCanonical(url) {
        let el = document.querySelector('link[rel="canonical"]');
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', 'canonical');
            document.head.appendChild(el);
        }
        el.setAttribute('href', url);
    }

    updateAlternateLinks(pageKey, data) {
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());

        const langs = this.isKoreanOnlyPage(pageKey) ? ['ko'] : this.supportedLangs;
        langs.forEach(lang => {
            const link = document.createElement('link');
            link.setAttribute('rel', 'alternate');
            link.setAttribute('hreflang', lang);
            link.setAttribute('href', this.getPageUrl(pageKey, lang, data));
            document.head.appendChild(link);
        });

        if (!this.isKoreanOnlyPage(pageKey)) {
            const xDefault = document.createElement('link');
            xDefault.setAttribute('rel', 'alternate');
            xDefault.setAttribute('hreflang', 'x-default');
            xDefault.setAttribute('href', this.getPageUrl(pageKey, 'ko', data));
            document.head.appendChild(xDefault);
        }
    }

    syncLanguageUrl(lang) {
        if (this.isKoreanOnlyPage()) return;

        try {
            const url = new URL(window.location.href);
            if (lang === 'ko') {
                url.searchParams.delete('lang');
            } else {
                url.searchParams.set('lang', lang);
            }
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        } catch (e) {
            console.warn('Failed to sync language URL:', e);
        }
    }

    updateMetaTags(data) {
        const pageKey = this.getPageKey();
        const seoLang = this.getSeoLang(pageKey);
        const seo = this.getPageSeo(data, pageKey, seoLang);

        document.documentElement.setAttribute('lang', seoLang);
        document.title = seo.title;

        this.setMeta('name', 'description', seo.description);
        this.setMeta('name', 'robots', 'index, follow');
        this.setCanonical(seo.url);

        this.setMeta('property', 'og:type', seo.type);
        this.setMeta('property', 'og:url', seo.url);
        this.setMeta('property', 'og:title', seo.title);
        this.setMeta('property', 'og:description', seo.description);
        this.setMeta('property', 'og:image', seo.image);
        this.setMeta('property', 'og:locale', seo.locale);
        this.setMeta('property', 'og:site_name', seo.siteName);

        this.setMeta('name', 'twitter:card', 'summary_large_image');
        this.setMeta('name', 'twitter:url', seo.url);
        this.setMeta('name', 'twitter:title', seo.title);
        this.setMeta('name', 'twitter:description', seo.description);
        this.setMeta('name', 'twitter:image', seo.image);

        this.updateAlternateLinks(pageKey, data);
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
            this.updateMetaTags(data);
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

            const sections = ['devstories', 'webapps', 'developing', 'games', 'sns', 'contact'];
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
                    if (typeof marked !== 'undefined') legalBody.innerHTML = marked.parse(this.t('privacy'));
                    else console.warn('Markdown library not loaded');
                } else if (isTermsPage) {
                    if (legalTitle) legalTitle.textContent = this.t('common.terms');
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
                window.componentRenderer.renderDevStories();
                window.componentRenderer.renderServices();
                window.componentRenderer.renderSNS();
            }
        } catch (e) { console.error('i18n error in components render:', e); }
    }
}

window.efI18n = new I18n();
