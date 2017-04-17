const app = require('http').createServer(createCallback);
const io = require('socket.io')(app);
const fs = require('fs');
const config = require('./config.json');

app.listen(1337);

function createCallback(req, res) {
  fs.readFile(__dirname + '/index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('ITSA BROKE');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', (socket) => {
  console.log('connected');
  socket.emit('connection', config);

  socket.on('submit', (data) => {
    console.log(data);
    indexDictionary(data.corpus, data.grams, (out) => {
      console.log(out);
      socket.emit('next', out);
    });
  });
});

const maxWords = 100;
let maxSentences = 6;
let dictionary = {};
let utterance = [];
let sentenceCount = 0;
const endSentenceMarkers = ['.', '?', '!'];
const endSentenceRegex = /(?!(Mr|Mrs))(\.|\?|\!)/;

function indexDictionary(corpus, grams, callback) {
  dictionary = {};
  utterance = [];
  fs.readFile(`./${ corpus }/grams/${ grams }.txt`, 'utf8', (err, data) => {
    if (err) {
      throw new Error(err);
    }

    const offset = grams.indexOf('offset') > -1;

    dictionary = JSON.parse(data);
    sentenceCount = 0;
    let currWord = null;

    while (sentenceCount < maxSentences) {
      const next = generateNextWord(currWord);
      utterance.push(offset ? next.split(' ')[next.split(' ').length - (Number(grams.split('-')[0]) - 1)] : next);
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
      if (firstSenIndex === 0) {
        callback(out);
      } else {
        callback(`${ out.substring(0, lastSenIndex) }.`);
      }
    } else {
      callback(`${ out.substring(firstSenIndex > 0 ? firstSenIndex + 2 : firstSenIndex, lastSenIndex) }.`);
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