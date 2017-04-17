const fs = require('fs');
const minLength = 1;
const n = Number(process.argv[2] || minLength);
const offset = process.argv[3] === 'true';
const corpusName = process.argv[4];

if (!corpusName) {
  throw new Error('must pass in a corpus!');
}

if (n < minLength) {
  throw new Error(`Cannot generate n-grams of length ${ n }. Pass in a value of at least ${ minLength }.`);
}

const corpus = fs.readFileSync(`./${ corpusName }/in.txt`, 'utf8').replace(/(\s)+/g, ' ').replace(/\"|_|\b(\d+):(\d+)\b/g, '').split(/\s+/);
console.log(offset);

// generate n-grams
let grams = new Array(offset ? corpus.length - 1 : Math.floor(corpus.length / n));
for (let i = 0; i < grams.length; i++) {
  const gram = new Array(n);
  for (let j = 0; j < gram.length; j++) {
    gram[j] = corpus[offset ? i + j : i * n + j];
  }
  grams[i] = gram.join(' ');
}

const gramsNums = {};
for (let i = 0; i < grams.length; i++) {
  if (!gramsNums[grams[i]]) {
    gramsNums[grams[i]] = 1;
  } else {
    gramsNums[grams[i]]++;
  }
}

// index n-grams
let gramsAndCounts = {};
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

function getRareGrams() {
  const rareGrams = [];
  const allGrams = Object.keys(gramsAndCounts);
  for (let i = 0; i < allGrams.length; i++) {
    if (gramsAndCounts[allGrams[i]].count < 2) {
      rareGrams.push(allGrams[i]);
    }
  }
  console.log(rareGrams.length);
  return rareGrams;
}

function filterOutRareGrams(callback) {
  const rareGrams = getRareGrams();

  const rareCount = rareGrams.length;
  if (rareCount === 0) {
    callback();
    return;
  }

  // create a new object to swap in for gramsAndCounts.
  const gramsAndCountsNoRare = {};
  // for every item in gramsAndCounts,
  const gramsAndCountsOrig = Object.keys(gramsAndCounts);
  for (let i = 0; i < gramsAndCountsOrig.length; i++) {
    // if it is not in rareGrams,
    // add it to the new object as-is.
    const gram = gramsAndCountsOrig[i];
    if (rareGrams.indexOf(gram) < 0) {
      gramsAndCountsNoRare[gram] = gramsAndCounts[gram];
    }
  }
  // swap this new object in for gramsAndCounts.
  gramsAndCounts = gramsAndCountsNoRare;

  // for every item in gramsAndCounts,
  const gramsAndCountsAll = Object.keys(gramsAndCounts);
  for (let i = 0; i < gramsAndCountsAll.length; i++) {
    const gram = gramsAndCountsAll[i];
    const gramAndCounts = gramsAndCounts[gram];
    // create a new object to swap in for this one.
    const gramRebuild = {
      count: 0,
      next: {},
    };
    // for every 'next' gram it has,
    const gramNextAll = Object.keys(gramAndCounts.next);
    for (let j = 0; j < gramNextAll.length; j++) {
      const gramNext = gramNextAll[j];
      // console.log(gramsAndCountsAll.indexOf(gramNext));
      // if that gram exists in gramsAndCounts,
      if (gramsAndCountsAll.indexOf(gramNext) > -1) {
        // add that gram and its frequency to the new object,
        // and increment the count of that object by its frequency.
        gramRebuild.next[gramNext] = gramAndCounts.next[gramNext];
        gramRebuild.count += gramAndCounts.next[gramNext];
      }
    }

    // add this item, with its 'next' object, to new obj.
    gramsAndCounts[gram] = gramRebuild;
  }
  filterOutRareGrams(callback);
}

// filter out grams that occur too rarely
filterOutRareGrams(() => {
  const fileName = `./${ corpusName }/grams/${ n }${ offset ? '-offset' : '' }.txt`;
  fs.open(fileName, 'w+', (err) => {
    if (err) {
      throw new Error(err);
    }

    fs.writeFile(fileName, JSON.stringify(gramsAndCounts), 'utf8', () => {
      console.log('done');
    });
  });
});