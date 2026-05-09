const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const dataPath = path.join(rootDir, 'data/data.json');
const postsPath = path.join(rootDir, 'data/posts.json');
const postsDir = path.join(rootDir, 'posts');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseFrontmatter(markdown) {
    const match = /^---\s*\n([\s\S]*?)\n---/.exec(markdown);
    if (!match) return null;

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
    const postData = readJson(postsPath);
    const posts = postData.posts;

    assert(Array.isArray(posts), 'data/posts.json should contain a posts array.');
    assert(posts.length > 0, 'data/posts.json has no posts.');

    const ids = new Set();
    const files = new Set();

    for (const post of posts) {
        assert(Number.isInteger(post.id), `Post id should be an integer: ${JSON.stringify(post)}`);
        assert(!ids.has(post.id), `Duplicate post id: ${post.id}`);
        ids.add(post.id);

        for (const key of ['title', 'summary', 'category', 'date', 'file']) {
            assert(typeof post[key] === 'string' && post[key].trim().length > 0, `Post ${post.id} is missing ${key}.`);
        }

        assert(isValidDate(post.date), `Post ${post.id} has invalid date: ${post.date}`);
        assert(/^\d{3}\.md$/.test(post.file), `Post ${post.id} file should use 000.md format: ${post.file}`);
        assert(!files.has(post.file), `Duplicate post file: ${post.file}`);
        files.add(post.file);

        const postPath = path.join(postsDir, post.file);
        assert(fs.existsSync(postPath), `Post ${post.id} markdown file is missing: ${post.file}`);

        const markdown = fs.readFileSync(postPath, 'utf8');
        const frontmatter = parseFrontmatter(markdown);
        assert(frontmatter, `${post.file} is missing frontmatter.`);

        for (const key of ['title', 'date', 'category', 'summary']) {
            assert(typeof frontmatter[key] === 'string' && frontmatter[key].trim().length > 0, `${post.file} frontmatter is missing ${key}.`);
        }

        assert(isValidDate(frontmatter.date), `${post.file} frontmatter has invalid date: ${frontmatter.date}`);

        for (const ref of extractAssetRefs(markdown)) {
            assertLocalAssetExists(ref, postsDir, `${post.file} markdown`);
        }
    }

    assertLocalAssetExists(siteData.meta && siteData.meta.image, rootDir, 'site meta image');

    for (const service of siteData.services || []) {
        assertLocalAssetExists(service.thumbnail, rootDir, `service ${service.id} thumbnail`);
        for (const image of (service.preview && service.preview.images) || []) {
            assertLocalAssetExists(image, rootDir, `service ${service.id} preview`);
        }
    }

    console.log(`Post & Asset Integrity Test: SUCCESS (${posts.length} posts)`);
} catch (e) {
    console.error("Post & Asset Integrity Test: FAILED", e);
    process.exit(1);
}
