function evaluateGuess(secret, guess) {
  const secretArr = secret.split('');
  const guessArr  = guess.split('');

  // Position = right digit, right place (old bulls)
  let position = 0;
  for (let i = 0; i < 4; i++) {
    if (guessArr[i] === secretArr[i]) position++;
  }

  // Hit = how many digits in guess exist anywhere in secret (total overlap count)
  let hit = 0;
  const secretCount = {};
  const guessCount  = {};
  for (let i = 0; i < 4; i++) {
    secretCount[secretArr[i]] = (secretCount[secretArr[i]] || 0) + 1;
    guessCount[guessArr[i]]   = (guessCount[guessArr[i]]   || 0) + 1;
  }
  for (const digit of Object.keys(guessCount)) {
    if (secretCount[digit]) {
      hit += Math.min(guessCount[digit], secretCount[digit]);
    }
  }

  return { hit, position };
}

function isValidCode(code) {
  return /^\d{4}$/.test(code);
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateRandomCode() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

module.exports = { evaluateGuess, isValidCode, generateRoomCode, generateRandomCode };