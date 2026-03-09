const fs = require('fs');
const path = require('path');

const vocabDir = path.join(__dirname, '..', 'src', 'data', 'vocab');

function getFiles() {
    return fs.readdirSync(vocabDir).filter(f => f.endsWith('.json'));
}

function checkDuplicates() {
    const files = getFiles();
    const wordMap = new Map();
    let hasDuplicates = false;

    console.log("Checking for duplicates...");

    for (const file of files) {
        const filePath = path.join(vocabDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        for (const item of data) {
            if (!item.word) continue;

            const word = item.word.toLowerCase();
            if (wordMap.has(word)) {
                console.log(`Duplicate found: "${word}" in ${file} (previously seen in ${wordMap.get(word)})`);
                hasDuplicates = true;
            } else {
                wordMap.set(word, file);
            }
        }
    }

    if (!hasDuplicates) {
        console.log("No duplicates found across all vocabulary files.");
    }
}

function expandVocabulary() {
    // We'll add some new words to a new or existing category to demonstrate expansion.
    // Add some business or tech vocabulary.
    const techVocab = [
        {
            word: "algorithm",
            partOfSpeech: "noun",
            meanings: ["a process or set of rules to be followed in calculations"],
            exampleSentences: ["The search engine uses a complex algorithm.", "Algorithm optimization is crucial for performance."]
        },
        {
            word: "bandwidth",
            partOfSpeech: "noun",
            meanings: ["the energy or mental capacity required to deal with a situation", "data transfer capacity"],
            exampleSentences: ["I don't have the bandwidth to take on this project right now."]
        },
        {
            word: "deploy",
            partOfSpeech: "verb",
            meanings: ["bring into effective action", "move troops into position"],
            exampleSentences: ["We plan to deploy the new software tonight."]
        },
        {
            word: "refactor",
            partOfSpeech: "verb",
            meanings: ["restructure computer code without changing its external behavior"],
            exampleSentences: ["The developers need to refactor the legacy codebase."]
        },
        {
            word: "scalable",
            partOfSpeech: "adjective",
            meanings: ["able to be changed in size or scale"],
            exampleSentences: ["We need a scalable solution for our database."]
        }
    ];

    const filePath = path.join(vocabDir, 'technology.json');

    let existing = [];
    if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Only add if not duplicate
    let addedCount = 0;
    const existingWords = new Set(existing.map(e => e.word.toLowerCase()));

    for (const item of techVocab) {
        if (!existingWords.has(item.word.toLowerCase())) {
            existing.push(item);
            addedCount++;
        }
    }

    if (addedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
        console.log(`Added ${addedCount} new words to technology.json`);
    } else {
        console.log(`No new words added to technology.json (already exist).`);
    }
}

const args = process.argv.slice(2);
if (args.includes('--check')) {
    checkDuplicates();
} else if (args.includes('--expand')) {
    expandVocabulary();
} else {
    console.log("Usage: node vocab-tool.js [--check] [--expand]");
    console.log("Running both by default...");
    expandVocabulary();
    checkDuplicates();
}
