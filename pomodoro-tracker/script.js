const STORAGE_KEY = 'pomodoro-tracker-state-v1';

const modeConfig = {
  focus: { minutes: 25, label: '집중 시간', color: '#e2543b' },
  short: { minutes: 5, label: '짧은 휴식', color: '#4a9d8e' },
  long: { minutes: 15, label: '긴 휴식', color: '#4472c4' },
};

const el = {
  modeTabs: document.querySelectorAll('.mode-tab'),
  timeLabel: document.getElementById('timeLabel'),
  modeLabel: document.getElementById('modeLabel'),
  ring: document.querySelector('.progress-ring__fg'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  todoForm: document.getElementById('todoForm'),
  todoInput: document.getElementById('todoInput'),
  todoList: document.getElementById('todoList'),
  statSessions: document.getElementById('statSessions'),
  statFocusTime: document.getElementById('statFocusTime'),
  statStreak: document.getElementById('statStreak'),
};

const CIRC = 2 * Math.PI * 100;
el.ring.style.strokeDasharray = `${CIRC}`;

let state = loadState();
let currentMode = 'focus';
let totalSeconds = modeConfig.focus.minutes * 60;
let remaining = totalSeconds;
let intervalId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    todos: [],
    sessions: 0,
    focusMinutes: 0,
    streak: 0,
    lastSessionDate: null,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr() {
  return new Date().toDateString();
}

function renderStats() {
  el.statSessions.textContent = state.sessions;
  el.statFocusTime.textContent = `${state.focusMinutes}분`;
  el.statStreak.textContent = state.lastSessionDate === todayStr() ? state.streak : 0;
}

function renderTodos() {
  el.todoList.innerHTML = '';
  if (state.todos.length === 0) {
    const li = document.createElement('li');
    li.className = 'todo-empty';
    li.textContent = '할 일을 추가해보세요';
    el.todoList.appendChild(li);
    return;
  }
  state.todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    const check = document.createElement('button');
    check.className = 'icon-btn';
    check.textContent = todo.done ? '✅' : '⬜';
    check.onclick = () => {
      state.todos[idx].done = !state.todos[idx].done;
      saveState();
      renderTodos();
    };

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const del = document.createElement('button');
    del.className = 'icon-btn';
    del.textContent = '🗑️';
    del.onclick = () => {
      state.todos.splice(idx, 1);
      saveState();
      renderTodos();
    };

    li.append(check, text, del);
    el.todoList.appendChild(li);
  });
}

el.todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = el.todoInput.value.trim();
  if (!text) return;
  state.todos.push({ text, done: false });
  el.todoInput.value = '';
  saveState();
  renderTodos();
});

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) {}
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateDisplay() {
  el.timeLabel.textContent = formatTime(remaining);
  const progress = remaining / totalSeconds;
  el.ring.style.strokeDashoffset = `${CIRC * (1 - progress)}`;
}

function switchMode(mode) {
  currentMode = mode;
  const cfg = modeConfig[mode];
  totalSeconds = cfg.minutes * 60;
  remaining = totalSeconds;
  el.modeLabel.textContent = cfg.label;
  el.ring.style.stroke = cfg.color;
  el.modeTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
  updateDisplay();
  stopTimer(false);
}

el.modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode));
});

function tick() {
  remaining -= 1;
  if (remaining <= 0) {
    completeSession();
    return;
  }
  updateDisplay();
}

function completeSession() {
  stopTimer(false);
  remaining = 0;
  updateDisplay();
  playDing();

  if (currentMode === 'focus') {
    state.sessions += 1;
    state.focusMinutes += modeConfig.focus.minutes;
    if (state.lastSessionDate === todayStr()) {
      state.streak += 1;
    } else {
      state.streak = 1;
      state.lastSessionDate = todayStr();
    }
    saveState();
    renderStats();
  }

  setTimeout(() => {
    alert(currentMode === 'focus' ? '집중 세션 완료! 잘하셨어요 🎉' : '휴식 종료! 다시 집중해볼까요?');
    switchMode(currentMode === 'focus' ? 'short' : 'focus');
  }, 100);
}

function startTimer() {
  if (intervalId) return;
  intervalId = setInterval(tick, 1000);
  el.startBtn.disabled = true;
  el.pauseBtn.disabled = false;
}

function stopTimer(updateButtons = true) {
  clearInterval(intervalId);
  intervalId = null;
  if (updateButtons) {
    el.startBtn.disabled = false;
    el.pauseBtn.disabled = true;
  } else {
    el.startBtn.disabled = false;
    el.pauseBtn.disabled = true;
  }
}

el.startBtn.addEventListener('click', startTimer);
el.pauseBtn.addEventListener('click', () => stopTimer());
el.resetBtn.addEventListener('click', () => switchMode(currentMode));

switchMode('focus');
renderTodos();
renderStats();
