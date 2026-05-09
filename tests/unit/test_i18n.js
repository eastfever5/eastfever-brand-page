const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

// 프로젝트 루트 경로 설정 (상위 폴더로 이동)
const rootDir = path.resolve(__dirname, '../../');

const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const i18nCode = fs.readFileSync(path.join(rootDir, 'js/i18n.js'), 'utf8');
const dataJson = fs.readFileSync(path.join(rootDir, 'data/data.json'), 'utf8');
const expectedData = JSON.parse(dataJson);

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function createWindow(url) {
    const dom = new JSDOM(html, { runScripts: "outside-only", url });
    const { window } = dom;

    global.window = window;
    global.document = window.document;
    global.localStorage = {
        getItem: () => null,
        setItem: () => null
    };

    window.dataLoader = {
        getData: () => JSON.parse(dataJson),
        load: async () => JSON.parse(dataJson)
    };

    window.eval(i18nCode);
    return window;
}

function metaContent(window, selector) {
    const el = window.document.querySelector(selector);
    return el && el.getAttribute('content');
}

function linkHref(window, selector) {
    const el = window.document.querySelector(selector);
    return el && el.getAttribute('href');
}

function assertHomeLanguage(window, lang, expectedUrl) {
    const pageMeta = expectedData.meta.pages.home;
    const expectedTitle = pageMeta.title[lang];
    const expectedDescription = pageMeta.description[lang];

    assert(window.document.title === expectedTitle, `Unexpected ${lang} title: ${window.document.title}`);
    assert(window.document.documentElement.lang === lang, `Unexpected ${lang} html lang: ${window.document.documentElement.lang}`);
    assert(metaContent(window, 'meta[name="description"]') === expectedDescription, `${lang} meta description was not applied.`);
    assert(metaContent(window, 'meta[property="og:title"]') === expectedTitle, `${lang} og:title was not applied.`);
    assert(metaContent(window, 'meta[property="og:description"]') === expectedDescription, `${lang} og:description was not applied.`);
    assert(metaContent(window, 'meta[property="og:locale"]') === window.efI18n.getLocale(lang), `${lang} og:locale was not applied.`);
    assert(linkHref(window, 'link[rel="canonical"]') === expectedUrl, `Unexpected ${lang} canonical href.`);
    assert(linkHref(window, `link[rel="alternate"][hreflang="${lang}"]`) === expectedUrl, `Unexpected ${lang} hreflang href.`);
    assert(linkHref(window, 'link[rel="alternate"][hreflang="x-default"]') === 'https://eastfever.com/', 'Unexpected x-default hreflang href.');
}

console.log("--- Starting i18n Unit Test ---");

try {
    const homeWindow = createWindow('https://eastfever.com/');
    assert(homeWindow.efI18n, 'window.efI18n is not defined after eval.');

    homeWindow.efI18n.updateUI();
    assertHomeLanguage(homeWindow, 'ko', 'https://eastfever.com/');

    homeWindow.efI18n.setLanguage('en');
    assertHomeLanguage(homeWindow, 'en', 'https://eastfever.com/?lang=en');

    homeWindow.efI18n.setLanguage('ja');
    assertHomeLanguage(homeWindow, 'ja', 'https://eastfever.com/?lang=ja');

    const aboutWindow = createWindow('https://eastfever.com/about/?lang=en');
    aboutWindow.efI18n.setLanguage('en');
    aboutWindow.efI18n.updateUI();

    assert(aboutWindow.document.documentElement.lang === 'ko', 'Korean-only about page should keep ko html lang.');
    assert(aboutWindow.document.title === expectedData.meta.pages.about.title.ko, 'About title should use Korean SEO metadata.');
    assert(linkHref(aboutWindow, 'link[rel="canonical"]') === 'https://eastfever.com/about/', 'About canonical should stay Korean-only.');
    assert(linkHref(aboutWindow, 'link[rel="alternate"][hreflang="ko"]') === 'https://eastfever.com/about/', 'About hreflang should contain only Korean URL.');
    assert(!linkHref(aboutWindow, 'link[rel="alternate"][hreflang="en"]'), 'About page should not expose English hreflang.');

    console.log("i18n Unit Test: SUCCESS");
} catch (e) {
    console.error("i18n Unit Test: FAILED", e);
    process.exit(1);
}
