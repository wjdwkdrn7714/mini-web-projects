const STARTER_WORDS = [
  '사과', '나비', '구름', '바다', '하늘', '고양이', '지구', '자유', '우산', '기린',
  '토끼', '여우', '달빛', '별빛', '무지개', '커피', '피아노', '노트북', '북극곰',
];

const BEST_KEY = 'word-chain-best-v1';

const el = {
  score: document.getElementById('score'),
  combo: document.getElementById('combo'),
  best: document.getElementById('best'),
  timerBar: document.getElementById('timerBar'),
  currentWord: document.getElementById('currentWord'),
  wordChain: document.getElementById('wordChain'),
  wordForm: document.getElementById('wordForm'),
  wordInput: document.getElementById('wordInput'),
  submitBtn: document.getElementById('submitBtn'),
  message: document.getElementById('message'),
  startBtn: document.getElementById('startBtn'),
};

const TIME_LIMIT = 15000;

let state = {
  playing: false,
  score: 0,
  combo: 0,
  used: [],
  lastWord: '',
  best: parseInt(localStorage.getItem(BEST_KEY) || '0', 10),
};

el.best.textContent = state.best;

let timerStart = 0;
let timerRAF = null;

function startTimer() {
  timerStart = performance.now();
  cancelAnimationFrame(timerRAF);
  step();
}

function step() {
  const elapsed = performance.now() - timerStart;
  const remaining = Math.max(TIME_LIMIT - elapsed, 0);
  const pct = (remaining / TIME_LIMIT) * 100;
  el.timerBar.style.width = `${pct}%`;
  el.timerBar.style.background = pct < 30 ? 'var(--bad)' : 'var(--accent)';

  if (remaining <= 0) {
    endGame('시간 초과! 게임 종료');
    return;
  }
  timerRAF = requestAnimationFrame(step);
}

function stopTimer() {
  cancelAnimationFrame(timerRAF);
}

function setMessage(text, type) {
  el.message.textContent = text;
  el.message.className = 'message' + (type ? ` ${type}` : '');
}

function renderChain() {
  el.wordChain.innerHTML = '';
  state.used.forEach((w) => {
    const span = document.createElement('span');
    span.textContent = w;
    el.wordChain.appendChild(span);
  });
}

function renderCurrent() {
  const last = state.lastWord;
  if (!last) {
    el.currentWord.textContent = '단어를 입력해 시작하세요';
    return;
  }
  const lastChar = last[last.length - 1];
  el.currentWord.innerHTML = `${last.slice(0, -1)}<span class="highlight">${lastChar}</span> 로 시작하는 단어는?`;
}

function startGame() {
  state = {
    playing: true,
    score: 0,
    combo: 0,
    used: [],
    lastWord: '',
    best: state.best,
  };
  const seed = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
  state.used.push(seed);
  state.lastWord = seed;

  el.score.textContent = '0';
  el.combo.textContent = '0x';
  el.wordInput.disabled = false;
  el.submitBtn.disabled = false;
  el.wordInput.value = '';
  el.wordInput.focus();
  el.startBtn.textContent = '게임 진행 중...';
  el.startBtn.disabled = true;
  setMessage('');
  renderChain();
  renderCurrent();
  startTimer();
}

function endGame(reason) {
  state.playing = false;
  stopTimer();
  el.wordInput.disabled = true;
  el.submitBtn.disabled = true;
  el.timerBar.style.width = '0%';
  el.startBtn.textContent = '다시 시작';
  el.startBtn.disabled = false;
  setMessage(reason, 'bad');

  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(BEST_KEY, String(state.best));
    el.best.textContent = state.best;
    setMessage(`${reason} — 신기록! 🎉`, 'bad');
  }
}

function validate(word) {
  if (!word || word.length < 2) return '두 글자 이상 입력해주세요';
  if (!/^[가-힣]+$/.test(word)) return '한글 단어만 입력할 수 있어요';
  if (state.used.includes(word)) return '이미 사용한 단어예요';
  const lastChar = state.lastWord[state.lastWord.length - 1];
  if (word[0] !== lastChar) return `'${lastChar}'(으)로 시작해야 해요`;
  return null;
}

el.wordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.playing) return;
  const word = el.wordInput.value.trim();
  const error = validate(word);

  if (error) {
    setMessage(error, 'bad');
    el.wordInput.value = '';
    return;
  }

  state.used.push(word);
  state.lastWord = word;
  state.combo += 1;
  state.score += 10 * state.combo;

  el.score.textContent = state.score;
  el.combo.textContent = `${state.combo}x`;
  setMessage('성공! 👍', 'good');
  el.wordInput.value = '';
  renderChain();
  renderCurrent();
  startTimer();
});

el.startBtn.addEventListener('click', startGame);
