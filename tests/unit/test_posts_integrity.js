const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '../../');
const dataPath = path.join(rootDir, 'data/data.json');
const legacyPostsPath = path.join(rootDir, 'data/posts.json');
const blogContentDir = path.join(rootDir, 'src/content/blog');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseMarkdownEntry(filePath) {
    const markdown = fs.readFileSync(filePath, 'utf8');
    const match = /^---\s*\n([\s\S]*?)\n---\s*/.exec(markdown);
    assert(match, `${path.basename(filePath)} is missing frontmatter.`);
    return {
        data: yaml.load(match[1]) || {},
        body: markdown.slice(match[0].length)
    };
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function localAssetPath(ref, contextDir = rootDir) {
    if (!ref || ref.startsWith('mailto:') || ref.startsWith('#')) return null;

    const withoutHash = ref.split('#')[0].split('?')[0];
    if (!withoutHash) return null;

    try {
        const url = new URL(withoutHash);
        if (url.hostname !== 'eastfever.com') return null;
        return path.join(rootDir, decodeURIComponent(url.pathname.replace(/^\//, '')));
    } catch (e) {
        if (withoutHash.startsWith('/')) {
            return path.join(rootDir, withoutHash.replace(/^\//, ''));
        }
        return path.resolve(contextDir, withoutHash);
    }
}

function assertLocalAssetExists(ref, contextDir, label) {
    const assetPath = localAssetPath(ref, contextDir);
    if (!assetPath) return;
    assert(fs.existsSync(assetPath), `${label} references missing asset: ${ref}`);
}

function extractAssetRefs(markdown) {
    const refs = [];
    const patterns = [
        /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
        /<(?:img|source|video)[^>]+(?:src|poster)=["']([^"']+)["'][^>]*>/g,
        /\bimage=["']([^"']+)["']/g
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(markdown)) !== null) {
            refs.push(match[1]);
        }
    }

    return refs;
}

console.log("--- Starting Post & Asset Integrity Test ---");

try {
    const siteData = readJson(dataPath);
    const legacyPosts = readJson(legacyPostsPath).posts;
    const postFiles = fs.readdirSync(blogContentDir).filter(file => /^\d{3}\.md$/.test(file)).sort();

    assert(postFiles.length > 0, 'src/content/blog has no posts.');

    const ids = new Set();
    const slugs = new Set();
    const postsByFile = new Map();

    for (const file of postFiles) {
        const entry = parseMarkdownEntry(path.join(blogContentDir, file));
        const post = entry.data;

        for (const key of ['id', 'slug', 'title', 'summary', 'category', 'date', 'updatedAt', 'thumbnail', 'ogImage', 'sourceType']) {
            assert(post[key] !== undefined && String(post[key]).trim().length > 0, `${file} frontmatter is missing ${key}.`);
        }

        assert(Number.isInteger(post.id), `${file} id should be an integer.`);
        assert(!ids.has(post.id), `Duplicate post id: ${post.id}`);
        ids.add(post.id);

        assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug), `${file} has invalid slug: ${post.slug}`);
        assert(!slugs.has(post.slug), `Duplicate post slug: ${post.slug}`);
        slugs.add(post.slug);

        assert(isValidDate(post.date), `${file} has invalid date: ${post.date}`);
        assert(isValidDate(post.updatedAt), `${file} has invalid updatedAt: ${post.updatedAt}`);
        assert(Array.isArray(post.sourceUrls), `${file} sourceUrls should be an array.`);
        assert(Array.isArray(post.tags), `${file} tags should be an array.`);
        assert(entry.body.trim().length > 0, `${file} has no markdown body.`);
        assert(/^#\s+/m.test(entry.body), `${file} should contain a top-level heading.`);

        assertLocalAssetExists(post.thumbnail, blogContentDir, `${file} thumbnail`);
        assertLocalAssetExists(post.ogImage, blogContentDir, `${file} ogImage`);
        for (const ref of extractAssetRefs(entry.body)) {
            assertLocalAssetExists(ref, blogContentDir, `${file} markdown`);
        }

        postsByFile.set(file, post);
    }

    assert(Array.isArray(legacyPosts), 'data/posts.json should contain a posts array.');
    assert(legacyPosts.length === postFiles.length, 'Legacy post index count should match content collection count.');

    for (const legacyPost of legacyPosts) {
        const post = postsByFile.get(legacyPost.file);
        assert(post, `Legacy post index references missing content file: ${legacyPost.file}`);

        for (const key of ['id', 'slug', 'title', 'summary', 'category', 'date']) {
            assert(
                legacyPost[key] === post[key],
                `Legacy post ${legacyPost.file} ${key} should match content collection.`
            );
        }
    }

    assertLocalAssetExists(siteData.meta && siteData.meta.image, rootDir, 'site meta image');

    for (const service of siteData.services || []) {
        assertLocalAssetExists(service.thumbnail, rootDir, `service ${service.id} thumbnail`);
        for (const image of (service.preview && service.preview.images) || []) {
            assertLocalAssetExists(image, rootDir, `service ${service.id} preview`);
        }
    }

    console.log(`Post & Asset Integrity Test: SUCCESS (${postFiles.length} posts)`);
} catch (e) {
    console.error("Post & Asset Integrity Test: FAILED", e);
    process.exit(1);
}
