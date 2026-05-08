class ComponentRenderer {
    constructor() {
        this.devStoryList = document.getElementById('devstory-list');
        this.webappList = document.getElementById('webapp-list');
        this.developingList = document.getElementById('developing-list');
        this.gameList = document.getElementById('game-list');
        this.snsList = document.getElementById('sns-list');
        this.marqueeBar = document.getElementById('marquee-bar');
        this.postsCache = null;
        this.postsPromise = null;
        this.postMediaCache = new Map();
        this.postMediaPromises = new Map();
        this.devStoryRenderId = 0;
    }

    renderMarquee() {
        if (!this.marqueeBar) return;
        const data = window.dataLoader.getData();
        const lang = window.efI18n.getLang();
        const keywords = data.keywords[lang] || [];
        
        this.marqueeBar.innerHTML = '';
        
        // Create a single set of keywords
        const createSet = () => {
            const div = document.createElement('div');
            div.className = 'marquee-content';
            keywords.forEach(keyword => {
                const span = document.createElement('span');
                span.className = 'keyword-tag';
                span.textContent = keyword;
                div.appendChild(span);
            });
            return div;
        };

        // Inject three sets for seamless loop and wide screen coverage
        this.marqueeBar.appendChild(createSet());
        this.marqueeBar.appendChild(createSet());
        this.marqueeBar.appendChild(createSet());
    }

    async loadPosts() {
        if (this.postsCache) return this.postsCache;

        if (!this.postsPromise) {
            this.postsPromise = fetch('data/posts.json')
                .then(response => {
                    if (!response.ok) throw new Error(`Posts request failed: ${response.status}`);
                    return response.json();
                })
                .then(data => data.posts || []);
        }

        this.postsCache = await this.postsPromise;
        return this.postsCache;
    }

    async loadPostMedia(post) {
        if (!post.file) return null;
        if (this.postMediaCache.has(post.file)) return this.postMediaCache.get(post.file);

        if (!this.postMediaPromises.has(post.file)) {
            const mediaPromise = fetch(`posts/${post.file}`)
                .then(response => {
                    if (!response.ok) throw new Error(`Post request failed: ${response.status}`);
                    return response.text();
                })
                .then(markdown => this.extractPostThumbnail(markdown, post.file))
                .catch(error => {
                    console.error(`Error loading dev story media for ${post.file}:`, error);
                    return null;
                });

            this.postMediaPromises.set(post.file, mediaPromise);
        }

        const media = await this.postMediaPromises.get(post.file);
        this.postMediaCache.set(post.file, media);
        return media;
    }

    extractPostThumbnail(markdown, postFile) {
        const frontmatter = this.extractFrontmatter(markdown);
        const frontmatterThumbnail = frontmatter.thumbnail;
        if (frontmatterThumbnail) {
            return {
                type: 'image',
                src: this.resolvePostMediaPath(frontmatterThumbnail, postFile),
                alt: ''
            };
        }

        const content = this.stripPostChrome(markdown);
        const markerThumbnail = this.extractMarkedThumbnail(content, postFile);
        if (markerThumbnail) return markerThumbnail;

        return this.extractFirstMedia(content, postFile);
    }

    extractFrontmatter(markdown) {
        const match = /^---\s*\n([\s\S]*?)\n---/.exec(markdown);
        if (!match) return {};

        return match[1].split(/\r?\n/).reduce((data, line) => {
            const field = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
            if (!field) return data;

            const key = field[1].trim();
            let value = field[2].trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            data[key] = value;
            return data;
        }, {});
    }

    stripPostChrome(markdown) {
        return markdown
            .replace(/^---[\s\S]*?---/, '')
            .replace(/^(\s*#\s+[^\r\n]*)/, '')
            .trim();
    }

    extractMarkedThumbnail(content, postFile) {
        const markerIndex = content.indexOf('<!-- thumbnail -->');
        if (markerIndex === -1) return null;

        const markedContent = content.slice(markerIndex + '<!-- thumbnail -->'.length);
        return this.extractFirstMedia(markedContent, postFile, { imagesOnly: true });
    }

    extractFirstMedia(content, postFile, options = {}) {
        const mediaPatterns = [
            {
                type: 'image',
                regex: /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/i,
                srcIndex: 2,
                altIndex: 1
            },
            {
                type: 'image',
                regex: /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
                srcIndex: 1
            },
            {
                type: 'video',
                regex: /<video[^>]+src=["']([^"']+)["'][^>]*>/i,
                srcIndex: 1
            },
            {
                type: 'video',
                regex: /<source[^>]+src=["']([^"']+)["'][^>]*>/i,
                srcIndex: 1
            },
            {
                type: 'video',
                regex: /\[[^\]]*\]\(([^)\s]+\.(?:mp4|webm|mov|m4v))(?:\s+"[^"]*")?\)/i,
                srcIndex: 1
            }
        ];

        const allowedPatterns = options.imagesOnly
            ? mediaPatterns.filter(pattern => pattern.type === 'image')
            : mediaPatterns;

        const matches = allowedPatterns
            .map(pattern => {
                const match = pattern.regex.exec(content);
                if (!match) return null;

                return {
                    type: pattern.type,
                    src: this.resolvePostMediaPath(match[pattern.srcIndex], postFile),
                    alt: pattern.altIndex ? match[pattern.altIndex] : '',
                    index: match.index
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.index - b.index);

        return matches[0] || null;
    }

    resolvePostMediaPath(src, postFile) {
        if (/^(?:https?:)?\/\//.test(src) || src.startsWith('/')) return src;

        const postDir = postFile.split('/').slice(0, -1).join('/');
        if (!postDir) return `posts/${src}`;

        return `posts/${postDir}/${src}`;
    }

    async renderDevStories() {
        if (!this.devStoryList) return;

        const renderId = ++this.devStoryRenderId;
        this.devStoryList.innerHTML = '';

        try {
            const posts = await this.loadPosts();
            if (renderId !== this.devStoryRenderId) return;

            const latestPosts = posts
                .slice()
                .sort((a, b) => {
                    const dateDiff = new Date(b.date) - new Date(a.date);
                    if (dateDiff !== 0) return dateDiff;
                    return Number(b.id) - Number(a.id);
                })
                .slice(0, 2);

            const fragment = document.createDocumentFragment();
            const postsWithMedia = await Promise.all(latestPosts.map(async post => ({
                ...post,
                media: await this.loadPostMedia(post)
            })));

            if (renderId !== this.devStoryRenderId) return;

            postsWithMedia.forEach(post => {
                fragment.appendChild(this.createDevStoryCard(post));
            });
            this.devStoryList.appendChild(fragment);
        } catch (error) {
            console.error('Error rendering latest dev stories:', error);
        }
    }

    createDevStoryCard(post) {
        const card = document.createElement('a');
        card.href = `post.html?id=${post.id}`;
        card.className = 'devstory-card';
        card.dataset.id = post.id;

        if (post.media) {
            card.appendChild(this.createDevStoryMedia(post));
        }

        const body = document.createElement('div');
        body.className = 'devstory-card-body';

        const meta = document.createElement('div');
        meta.className = 'devstory-card-meta';

        const category = document.createElement('span');
        category.className = 'devstory-category';
        category.textContent = post.category;

        const date = document.createElement('span');
        date.className = 'devstory-date';
        date.textContent = post.date;

        meta.appendChild(category);
        meta.appendChild(date);

        const title = document.createElement('h3');
        title.className = 'devstory-title';
        title.textContent = post.title;

        const summary = document.createElement('p');
        summary.className = 'devstory-summary';
        summary.textContent = post.summary;

        const cta = document.createElement('span');
        cta.className = 'devstory-cta';
        cta.textContent = window.efI18n.t('common.readStory');

        body.appendChild(meta);
        body.appendChild(title);
        body.appendChild(summary);
        body.appendChild(cta);
        card.appendChild(body);

        return card;
    }

    createDevStoryMedia(post) {
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'devstory-media';

        if (post.media.type === 'video') {
            const video = document.createElement('video');
            video.src = post.media.src;
            video.muted = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.setAttribute('aria-label', post.title);
            mediaWrap.appendChild(video);
            return mediaWrap;
        }

        const image = document.createElement('img');
        image.src = post.media.src;
        image.alt = post.media.alt || post.title;
        image.loading = 'lazy';
        mediaWrap.appendChild(image);

        return mediaWrap;
    }

    renderServices() {
        if (!this.webappList || !this.gameList) return;
        const data = window.dataLoader.getData();
        const lang = window.efI18n.getLang();
        
        this.webappList.innerHTML = '';
        if (this.developingList) this.developingList.innerHTML = '';
        this.gameList.innerHTML = '';

        data.services.forEach(service => {
            const card = this.createServiceCard(service, lang);
            if (service.type === 'webapp') {
                this.webappList.appendChild(card);
            } else if (service.type === 'developing' && this.developingList) {
                this.developingList.appendChild(card);
            } else if (service.type === 'game') {
                this.gameList.appendChild(card);
            }
        });
    }

    createServiceCard(service, lang) {
        const div = document.createElement('div');
        div.className = 'service-card';
        
        let typeLabel = '';
        if (service.type === 'webapp') {
            typeLabel = window.efI18n.t('sections.webapps') || 'Web App';
        } else if (service.type === 'developing') {
            typeLabel = window.efI18n.t('sections.developing') || 'In Development';
        } else {
            typeLabel = window.efI18n.t('sections.games') || 'Game';
        }
        
        const statusLabel = window.efI18n.t(`common.${service.status}`) || service.status;
        const hasVisitUrl = service.url && service.url !== '#';
        const hasPreview = service.preview && Array.isArray(service.preview.images);
        let isDevelopingButton = false;
        let opensPreview = false;
        let visitLabel = window.efI18n.t('common.visit') || 'Visit';
        let buttonAttr = `href="${service.url}" target="_blank" rel="noopener"`;

        if (service.type === 'developing' && !hasVisitUrl) {
            isDevelopingButton = true;
            opensPreview = hasPreview;
            visitLabel = opensPreview
                ? (window.efI18n.t('common.developmentPreview') || 'View Dev Preview')
                : (window.efI18n.t('common.developing') || 'In Development');
            buttonAttr = `href="#"`;
        }

        div.innerHTML = `
            <div class="thumb-container">
                <img src="${service.thumbnail}?v=19" alt="${service.name[lang]}" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-tags">
                        <span class="badge badge-type">${typeLabel}</span>
                        ${service.type !== 'developing' ? `<span class="badge badge-status">${statusLabel}</span>` : ''}
                    </div>
                </div>
                <h3 class="service-name">${service.name[lang]}</h3>
                <p class="service-desc">${service.description[lang]}</p>
                <a ${buttonAttr} data-id="${service.id}" class="visit-btn ${isDevelopingButton ? 'developing' : ''}">${visitLabel}</a>
            </div>
        `;

        if (opensPreview) {
            const previewButton = div.querySelector('.visit-btn');
            if (previewButton) {
                previewButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (window.modalManager && typeof window.modalManager.openServicePreview === 'function') {
                        window.modalManager.openServicePreview(service, lang);
                    }
                });
            }
        } else if (service.type === 'developing' && !hasVisitUrl) {
            const developingButton = div.querySelector('.visit-btn');
            if (developingButton) {
                developingButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    const devMsg = window.efI18n.t('common.dev_msg') || 'Coming Soon';
                    if (window.modalManager) {
                        window.modalManager.open(typeLabel, devMsg, 'developing');
                    }
                });
            }
        }

        return div;
    }

    renderSNS() {
        if (!this.snsList) return;
        const data = window.dataLoader.getData();
        
        this.snsList.innerHTML = '';
        data.sns.forEach(sns => {
            const card = document.createElement('a');
            card.href = sns.url;
            card.target = '_blank';
            card.className = 'sns-card';
            card.innerHTML = `
                <span class="sns-icon">${sns.icon}</span>
                <span class="sns-label">${sns.label}</span>
            `;
            this.snsList.appendChild(card);
        });
    }
}

window.componentRenderer = new ComponentRenderer();
