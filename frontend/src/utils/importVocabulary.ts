import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { bulkInsertCards } from './database';

type ImportCard = {
    word: string;
    partOfSpeech?: string;
    meanings?: string[];
    exampleSentences?: string[];
    pronunciation?: string;
    audioUrl?: string;
};

export async function importVocabularyJson(deckId: string) {
    const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json'],
        copyToCacheDirectory: true,
        multiple: false,
    });

    if (picked.canceled) return { imported: 0 };

    const file = picked.assets[0];
    const text = await FileSystem.readAsStringAsync(file.uri);
    const arr: ImportCard[] = JSON.parse(text);

    // Basic validation + normalize
    const clean = arr
        .filter(x => x?.word && typeof x.word === 'string')
        .map(x => ({
            word: x.word.trim(),
            pronunciation: x.pronunciation ?? '',
            partOfSpeech: x.partOfSpeech ?? '',
            meanings: Array.isArray(x.meanings) ? x.meanings : [],
            exampleSentences: Array.isArray(x.exampleSentences) ? x.exampleSentences : [],
            audioUrl: x.audioUrl ?? '',
            deckId,
        }));

    // Chunk insert to avoid UI freeze
    const CHUNK = 200;
    for (let i = 0; i < clean.length; i += CHUNK) {
        await bulkInsertCards(clean.slice(i, i + CHUNK));
    }

    return { imported: clean.length };
}
