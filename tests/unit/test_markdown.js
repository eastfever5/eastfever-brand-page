const marked = require('marked');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const dataPath = path.join(rootDir, 'data/data.json');
const aboutPath = path.join(rootDir, 'src/content/pages/about.ko.md');
const postsDir = path.join(rootDir, 'src/content/blog');

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function stripFrontmatter(markdown) {
    return markdown.replace(/^---[\s\S]*?---/, '').trim();
}

console.log("--- Starting Markdown & Data Unit Test ---");

try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log("data.json loaded successfully.");

    const expectedSections = ['meta', 'hero', 'keywords', 'sections', 'services', 'sns', 'nav', 'common', 'privacy', 'terms'];
    for (const section of expectedSections) {
        assert(data[section], `Section [${section}] is missing.`);
        console.log(`Section [${section}]: Found`);
    }

    for (const lang of ['ko', 'en', 'ja']) {
        for (const page of ['privacy', 'terms']) {
            assert(typeof data[page][lang] === 'string' && data[page][lang].trim().length > 0, `${page}.${lang} markdown is empty.`);
            const html = marked.parse(data[page][lang]);
            assert(/<h[1-6]/.test(html), `${page}.${lang} markdown did not render headings.`);
            assert(!html.includes('<script'), `${page}.${lang} markdown rendered a script tag.`);
            console.log(`Markdown parsing (${page}.${lang}): SUCCESS (Length: ${html.length})`);
        }
    }

    const aboutMarkdown = fs.readFileSync(aboutPath, 'utf8');
    const aboutHtml = marked.parse(stripFrontmatter(aboutMarkdown));
    assert(aboutHtml.includes('이스트피버'), 'About markdown did not render expected content.');
    console.log(`Markdown parsing (src/content/pages/about.ko.md): SUCCESS (Length: ${aboutHtml.length})`);

    const postFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    assert(postFiles.length > 0, 'No markdown posts found.');

    for (const file of postFiles) {
        const markdown = fs.readFileSync(path.join(postsDir, file), 'utf8');
        const body = stripFrontmatter(markdown);
        assert(body.length > 0, `${file} has no markdown body.`);
        assert(/^#\s+/m.test(body), `${file} should contain a top-level heading.`);

        const html = marked.parse(body);
        assert(html.includes('<h1'), `${file} markdown did not render an h1.`);
    }

    console.log(`Markdown parsing (src/content/blog/*.md): SUCCESS (${postFiles.length} posts)`);
    console.log("Markdown & Data Unit Test: SUCCESS");
} catch (e) {
    console.error("Markdown & Data Unit Test: FAILED", e);
    process.exit(1);
}
