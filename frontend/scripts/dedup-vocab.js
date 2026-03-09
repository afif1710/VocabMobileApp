const fs = require('fs');
const path = require('path');

const vocabDir = path.join(__dirname, '..', 'src', 'data', 'vocab');
const files = ['basic.json', 'school.json', 'travel.json'];

// First: deduplicate within each file
for (const file of files) {
    const filePath = path.join(vocabDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const seen = new Set();
    const deduped = data.filter(item => {
        const key = item.word.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    const removed = data.length - deduped.length;
    if (removed > 0) {
        fs.writeFileSync(filePath, JSON.stringify(deduped, null, 4), 'utf8');
        console.log(`${file}: removed ${removed} internal duplicates → ${deduped.length} words`);
    } else {
        console.log(`${file}: no internal duplicates → ${deduped.length} words`);
    }
}

// Then: deduplicate across files (keep in first file that has it, remove from subsequent)
const globalSeen = new Set();
let totalRemoved = 0;

for (const file of files) {
    const filePath = path.join(vocabDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const deduped = data.filter(item => {
        const key = item.word.toLowerCase();
        if (globalSeen.has(key)) { totalRemoved++; return false; }
        globalSeen.add(key);
        return true;
    });
    fs.writeFileSync(filePath, JSON.stringify(deduped, null, 4), 'utf8');
    console.log(`${file}: cross-file dedup → ${deduped.length} unique words`);
}

console.log(`\nTotal cross-file duplicates removed: ${totalRemoved}`);

// Final counts
let grand = 0;
for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(vocabDir, file), 'utf8'));
    console.log(`  ${file}: ${data.length}`);
    grand += data.length;
}
console.log(`\nGrand total: ${grand} unique words across all decks`);
