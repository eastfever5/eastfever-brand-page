const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '../../');
const blogDir = path.join(rootDir, 'src/content/blog');

function readProject(filePath) {
    return fs.readFileSync(path.join(rootDir, filePath), 'utf8');
}

function blogEntries() {
    return fs.readdirSync(blogDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const markdown = fs.readFileSync(path.join(blogDir, file), 'utf8');
            const match = /^---\s*\n([\s\S]*?)\n---/.exec(markdown);
            assert(match, `${file} is missing frontmatter.`);
            const data = yaml.load(match[1]) || {};
            return {
                id: String(data.id),
                paddedId: String(data.id).padStart(3, '0'),
                slug: data.slug
            };
        })
        .sort((a, b) => Number(a.id) - Number(b.id));
}

function redirectLines() {
    return readProject('public/_redirects')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
}

function legacyPostMap() {
    const source = readProject('functions/_legacyPostMap.ts');
    return Object.fromEntries(
        [...source.matchAll(/"(\d+)":\s*"([^"]+)"/g)].map(match => [match[1], match[2]])
    );
}

console.log('--- Starting Cloudflare Redirect Test ---');

try {
    const posts = blogEntries();
    const redirects = new Set(redirectLines());
    const postMap = legacyPostMap();
    const routes = JSON.parse(readProject('public/_routes.json'));

    assert(redirects.has('/blog.html /ko/blog/ 301'), 'Missing /blog.html path redirect.');
    assert(redirects.has('/about /ko/about/ 301'), 'Missing /about path redirect.');
    assert(redirects.has('/about/ /ko/about/ 301'), 'Missing /about/ path redirect.');
    assert(redirects.has('/about/index.html /ko/about/ 301'), 'Missing /about/index.html path redirect.');

    assert(![...redirects].some(line => /^\/\s+/.test(line)), 'Root redirect should stay in Pages Functions because legacy home URLs can carry lang query parameters.');
    assert(![...redirects].some(line => /^\/index\.html\s+/.test(line)), '/index.html redirect should stay in Pages Functions because it can carry lang query parameters.');
    assert(![...redirects].some(line => /^\/post\.html\s+/.test(line)), '/post.html must not be handled by _redirects because it needs id query mapping.');
    assert(![...redirects].some(line => /^\/privacy\.html\s+/.test(line)), '/privacy.html must not be handled by _redirects because it needs lang query mapping.');
    assert(![...redirects].some(line => /^\/terms\.html\s+/.test(line)), '/terms.html must not be handled by _redirects because it needs lang query mapping.');

    for (const post of posts) {
        const target = `/ko/blog/${post.slug}/`;
        assert(redirects.has(`/ko/blog/${post.paddedId}/ ${target} 301`), `Missing numeric blog redirect for ${post.paddedId}.`);
        assert.equal(postMap[post.id], target, `Missing Pages Function post map entry for ${post.id}.`);
    }

    assert.equal(Object.keys(postMap).length, posts.length, 'Pages Function post map should not contain stale entries.');
    assert.deepEqual(routes.include, ['/', '/index.html', '/post.html', '/privacy.html', '/terms.html'], 'Pages Functions should only run on legacy query-sensitive routes.');
    assert.deepEqual(routes.exclude, [], 'Pages Functions route excludes should stay empty.');

    for (const filePath of ['functions/index.ts', 'functions/index.html.ts', 'functions/post.html.ts', 'functions/privacy.html.ts', 'functions/terms.html.ts']) {
        assert(fs.existsSync(path.join(rootDir, filePath)), `Missing Pages Function: ${filePath}`);
    }

    console.log('Cloudflare Redirect Test: SUCCESS');
} catch (e) {
    console.error('Cloudflare Redirect Test: FAILED', e);
    process.exit(1);
}
