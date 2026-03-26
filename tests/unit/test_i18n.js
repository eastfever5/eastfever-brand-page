const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

// 프로젝트 루트 경로 설정 (상위 폴더로 이동)
const rootDir = path.resolve(__dirname, '../../');

const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const i18nCode = fs.readFileSync(path.join(rootDir, 'js/i18n.js'), 'utf8');
const dataJson = fs.readFileSync(path.join(rootDir, 'data/data.json'), 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only" });
const { window } = dom;
global.window = window;
global.document = window.document;
global.localStorage = {
    getItem: () => null,
    setItem: () => null
};

// Mock dataLoader
window.dataLoader = { 
    getData: () => JSON.parse(dataJson),
    load: async () => JSON.parse(dataJson)
};

console.log("--- Starting i18n Unit Test ---");

try {
    // i18n 코드 실행
    window.eval(i18nCode);
    
    if (window.efI18n) {
        console.log("i18n Instance created successfully.");
        
        // 언어 변경 테스트
        window.efI18n.setLanguage('en');
        console.log("Language set to 'en' successfully.");
        
        window.efI18n.updateUI();
        console.log("UI updated successfully.");
        
        console.log("i18n Unit Test: SUCCESS");
    } else {
        throw new Error("window.efI18n is not defined after eval.");
    }
} catch (e) {
    console.error("i18n Unit Test: FAILED", e);
    process.exit(1);
}
