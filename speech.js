const fs = require('fs');
const maxWords = 100;
let maxSentences = 6;
let dictionary = {};
const utterance = [];
let sentenceCount = 0;
const offset = process.argv[3] === 'true';
const endSentenceMarkers = ['.', '?', '!'];
const endSentenceRegex = /\.|\?|\!/;
console.log(offset);

function indexDictionary() {
	fs.readFile(`./${ process.argv[4] }/grams/${ process.argv[2] }${ offset ? '-offset' : '' }.txt`, 'utf8', (err, data) => {
		if (err) {
			throw new Error(err);
		}

		dictionary = JSON.parse(data);
		sentenceCount = 0;
		let currWord = null;

		while (sentenceCount < maxSentences) {
			const next = generateNextWord(currWord);
			utterance.push(offset ? next.split(' ')[next.split(' ').length - (Number(process.argv[2]) - 1)] : next);
			currWord = next;
			if (next.search(endSentenceRegex) > -1) {
				sentenceCount++;
			}
			if (utterance.length >= maxWords) {
				maxSentences = sentenceCount + 1;
				if (utterance.length >= maxWords * 2) {
					break;
				}
			}
		}

		const out = utterance.join(' ');
		const firstSenIndex = Math.max(out.search(endSentenceRegex), 0);
		const lastSenIndex = Math.max(out.lastIndexOf('.'), out.lastIndexOf('?'), out.lastIndexOf('!'), 0);
		if (firstSenIndex === lastSenIndex) {
			console.log(out);
		} else {
			console.log(`${ out.substring(firstSenIndex > 0 ? firstSenIndex + 2 : firstSenIndex, lastSenIndex) }.`);
		}
	});
}

function generateNextWord(seedWord) {
	// first word of an utterance
	if (!seedWord) {
		const topLevel = [];
		const words = Object.keys(dictionary);
		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			for (let j = 0; j < dictionary[word].count; j++) {
				topLevel.push(word);
			}
		}
		const randomIndex = Math.floor(Math.random() * topLevel.length);
		return topLevel[randomIndex];
	}

	// if the utterance had a previous word
	// console.log(seedWord);
	const nextWords = Object.keys(dictionary[seedWord].next);
	const nextArr = [];
	for (let i = 0; i < nextWords.length; i++) {
		const word = nextWords[i];
		for (let j = 0; j < dictionary[seedWord].next[word]; j++) {
			nextArr.push(word);
		}
	}
	const randomIndex = Math.floor(Math.random() * nextArr.length);
	return nextArr[randomIndex];
}

indexDictionary();