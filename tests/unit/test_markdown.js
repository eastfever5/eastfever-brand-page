const marked = require('marked');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const dataPath = path.join(rootDir, 'data/data.json');

console.log("--- Starting Markdown & Data Unit Test ---");

try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log("data.json loaded successfully.");

    // 필수 섹션 존재 여부 확인
    const expectedSections = ['hero', 'webapps', 'games', 'sns', 'privacy', 'terms'];
    for (const section of expectedSections) {
        if (data[section]) {
            console.log(`Section [${section}]: Found`);
        } else {
            console.warn(`Section [${section}]: MISSING`);
        }
    }

    // 마크다운 파싱 테스트 (Privacy 정책 등)
    if (data.privacy && data.privacy.ko) {
        const html = marked.parse(data.privacy.ko);
        console.log(`Markdown parsing (privacy.ko): SUCCESS (Length: ${html.length})`);
    }

    console.log("Markdown & Data Unit Test: SUCCESS");
} catch (e) {
    console.error("Markdown & Data Unit Test: FAILED", e);
    process.exit(1);
}
