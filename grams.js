const fs = require('fs');
const minLength = 1;
const n = Number(process.argv[2] || minLength);

if (n < minLength) {
  throw new Error(`Cannot generate n-grams of length ${ n }. Pass in a value of at least ${ minLength }.`);
}

const corpus = fs.readFileSync('./quijote.txt', 'utf8').replace(/\s+/g, ' ').replace(/\"/g, '').split(' ');

// generate n-grams
const grams = new Array(Math.floor(corpus.length / n));
for (let i = 0; i < grams.length; i++) {
  const gram = new Array(n);
  for (let j = 0; j < gram.length; j++) {
    gram[j] = corpus[(i * n) + j];
  }
  grams[i] = gram.join(' ');
}

// index n-grams
const gramsAndCounts = {};
for (let i = 0; i < grams.length; i++) {
  const currGram = grams[i];
  if (!gramsAndCounts[currGram]) {
    gramsAndCounts[currGram] = {
      count: 0,
      next: {},
    };
  }
}

// go over list again and create "next" grams
for (let i = 0; i < grams.length - 1; i++) {
  const currGram = grams[i];
  const nextGram = grams[i + 1];
  const currGramAndCounts = gramsAndCounts[currGram];
  if (currGramAndCounts.next[nextGram]) {
    currGramAndCounts.next[nextGram]++;
    currGramAndCounts.count++;
  } else if (gramsAndCounts[nextGram]) {
    currGramAndCounts.next[nextGram] = 1;
    currGramAndCounts.count++;
  }
}

const fileName = `./grams/${ n }.txt`;
fs.open(fileName, 'w+', (err) => {
  if (err) {
    throw new Error(err);
  }

  fs.writeFile(fileName, JSON.stringify(gramsAndCounts), 'utf8', () => {
    console.log('done');
  });
});