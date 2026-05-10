const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rootDir = path.resolve(__dirname, '../../');
const distDir = path.join(rootDir, 'dist');
const siteData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/data.json'), 'utf8'));

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function readDist(filePath) {
    const fullPath = path.join(distDir, filePath);
    assert(fs.existsSync(fullPath), `Missing dist file: ${filePath}`);
    return fs.readFileSync(fullPath, 'utf8');
}

function parseBlogEntry(file) {
    const markdown = fs.readFileSync(path.join(rootDir, 'src/content/blog', file), 'utf8');
    const match = /^---\s*\n([\s\S]*?)\n---/.exec(markdown);
    assert(match, `${file} is missing frontmatter.`);
    return yaml.load(match[1]) || {};
}

function assertIncludes(value, expected, label) {
    assert(value.includes(expected), `${label} should include: ${expected}`);
}

function assertNotIncludes(value, expected, label) {
    assert(!value.includes(expected), `${label} should not include: ${expected}`);
}

console.log("--- Starting Dist Static HTML Test ---");

try {
    const post26 = parseBlogEntry('026.md');
    const post26Path = `ko/blog/${post26.slug}/index.html`;
    const post26Url = `https://eastfever.com/ko/blog/${post26.slug}/`;

    const koHome = readDist('ko/index.html');
    assertIncludes(koHome, `<title>${siteData.meta.pages.home.title.ko}</title>`, 'Korean home');
    assertIncludes(koHome, '<link rel="canonical" href="https://eastfever.com/ko/">', 'Korean home');
    assertIncludes(koHome, '<link rel="alternate" hreflang="en" href="https://eastfever.com/en/">', 'Korean home');

    const postHtml = readDist(post26Path);
    assertIncludes(postHtml, `<title>${post26.title} - EastFever</title>`, 'Post 26');
    assertIncludes(postHtml, `<meta name="description" content="${post26.summary}">`, 'Post 26');
    assertIncludes(postHtml, `<link rel="canonical" href="${post26Url}">`, 'Post 26');
    assertIncludes(postHtml, '<meta property="og:type" content="article">', 'Post 26');
    assertIncludes(postHtml, 'Draw the Life', 'Post 26');

    const numericPostHtml = readDist('ko/blog/026/index.html');
    assertIncludes(numericPostHtml, '<meta name="robots" content="noindex, follow">', 'Numeric post redirect');
    assertIncludes(numericPostHtml, `<link rel="canonical" href="${post26Url}">`, 'Numeric post redirect');

    const legacyPostHtml = readDist('post.html');
    assertIncludes(legacyPostHtml, '<meta name="robots" content="noindex, follow">', 'Legacy post redirect');
    assertIncludes(legacyPostHtml, `"26":"/ko/blog/${post26.slug}/"`, 'Legacy post redirect');

    assert(fs.existsSync(path.join(distDir, 'ads.txt')), 'ads.txt should be copied to dist.');
    assert(fs.existsSync(path.join(distDir, 'naverb37bc6141b6aa0ce1682ef1c8dd37842.html')), 'Naver verification file should be copied to dist.');
    assert(fs.existsSync(path.join(distDir, '_redirects')), 'Cloudflare _redirects should be copied to dist.');
    assert(fs.existsSync(path.join(distDir, '_routes.json')), 'Cloudflare _routes.json should be copied to dist.');

    const redirects = readDist('_redirects');
    assertIncludes(redirects, '/blog.html /ko/blog/ 301', 'Cloudflare _redirects');
    assertIncludes(redirects, `/ko/blog/026/ /ko/blog/${post26.slug}/ 301`, 'Cloudflare _redirects');
    assertNotIncludes(redirects, '/post.html ', 'Cloudflare _redirects');
    assertNotIncludes(redirects, '/privacy.html ', 'Cloudflare _redirects');
    assertNotIncludes(redirects, '/terms.html ', 'Cloudflare _redirects');

    const robots = readDist('robots.txt');
    assertIncludes(robots, 'Sitemap: https://eastfever.com/sitemap-index.xml', 'robots.txt');

    const sitemap = readDist('sitemap-0.xml');
    assertIncludes(sitemap, `<loc>${post26Url}</loc>`, 'sitemap-0.xml');
    assertNotIncludes(sitemap, '<loc>https://eastfever.com/</loc>', 'sitemap-0.xml');
    assertNotIncludes(sitemap, '<loc>https://eastfever.com/about/</loc>', 'sitemap-0.xml');
    assertNotIncludes(sitemap, '<loc>https://eastfever.com/ko/blog/026/</loc>', 'sitemap-0.xml');

    console.log("Dist Static HTML Test: SUCCESS");
} catch (e) {
    console.error("Dist Static HTML Test: FAILED", e);
    process.exit(1);
}
