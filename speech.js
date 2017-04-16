const fs = require('fs');
const maxWords = 20;
let dictionary = {};
const utterance = [];

function indexDictionary() {
	fs.readFile(`./grams/${ process.argv[2] }.txt`, 'utf8', (err, data) => {
		if (err) {
			throw new Error(err);
		}

		dictionary = JSON.parse(data);
		while (utterance.length < maxWords) {
			utterance.push(generateNextWord(utterance.length > 0 ? utterance[utterance.length - 1] : null));
		}

		console.log(utterance.join(' '));
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