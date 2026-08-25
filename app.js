/**
 * Лад — Song Companion v2
 * Комната настроения → аккорд → карта → ход → дорожка
 * Стиль: бумага и уголь. Пульс = бывший groove.
 */

const V2_MOODS = [
  {
    id: "bright",
    title: "Светлое",
    desc: "Открыто, ясно, как окно нараспашку",
  },
  {
    id: "dark",
    title: "Тёмное",
    desc: "Тише, глубже, внутрь себя",
  },
  {
    id: "tense",
    title: "Напряжённое",
    desc: "Тяга, конфликт, хочется разрешения",
  },
  {
    id: "dream",
    title: "Мечтательное",
    desc: "Плавающее, мягкие края, дымка",
  },
  {
    id: "pulse",
    title: "Пульс",
    desc: "Тело, ритм, повтор — чтобы качало",
    catalogMood: "groovy",
  },
];

const SONG_SLOTS = [
  { id: "intro", title: "Интро" },
  { id: "verse", title: "Куплет" },
  { id: "chorus", title: "Припев" },
  { id: "bridge", title: "Бридж" },
];

const state = {
  screen: "mood", // mood | start | map | path | song
  mood: null,
  start: null,
  paths: [],
  activePath: null,
  song: {
    intro: null,
    verse: null,
    chorus: null,
    bridge: null,
  },
};

const stage = document.getElementById("stage");
const btnBack = document.getElementById("btnBack");

function moodById(id) {
  return V2_MOODS.find((m) => m.id === id);
}

function catalogMoodId(moodId) {
  const m = moodById(moodId);
  return m?.catalogMood || moodId;
}

function setScreen(name) {
  state.screen = name;
  document.querySelectorAll(".tab").forEach((tab) => {
    const nav = tab.dataset.nav;
    const active =
      (nav === "mood" && (name === "mood" || name === "start")) ||
      (nav === "map" && (name === "map" || name === "path")) ||
      (nav === "song" && name === "song");
    tab.classList.toggle("is-active", active);
  });
  btnBack.hidden = name === "mood";
  render();
}

function goBack() {
  if (state.screen === "start") setScreen("mood");
  else if (state.screen === "map") setScreen("start");
  else if (state.screen === "path") setScreen("map");
  else if (state.screen === "song") setScreen(state.activePath ? "path" : "map");
  else setScreen("mood");
}

function loadPaths() {
  if (!state.mood || !state.start) {
    state.paths = [];
    return;
  }
  const answers = {
    start: state.start,
    mood: catalogMoodId(state.mood),
    move: state.mood === "pulse" ? "lift" : state.mood === "tense" ? "twist" : state.mood === "dark" ? "fall" : "home",
    part: "verse",
    style: "all",
  };
  const { ideas } = progressionsFor(answers);
  const short = ideas.filter((p) => p.path.length <= 6);
  state.paths = (short.length >= 5 ? short : ideas).slice(0, 9);
}

function render() {
  if (state.screen === "mood") renderMood();
  else if (state.screen === "start") renderStart();
  else if (state.screen === "map") renderMap();
  else if (state.screen === "path") renderPath();
  else if (state.screen === "song") renderSong();
}

function renderMood() {
  stage.innerHTML = `
    <p class="kicker">Комната настроения</p>
    <h1 class="h1">С какой погоды начинается песня?</h1>
    <p class="lead">Выберите чувство — оно окрасит карту ходов и дорожку.</p>
    <div class="mood-grid">
      ${V2_MOODS.map(
        (m) => `
        <button type="button" class="mood-card" data-mood="${m.id}">
          <span class="title">${m.title}</span>
          <span class="desc">${m.desc}</span>
          <span class="sketch" aria-hidden="true"></span>
        </button>`
      ).join("")}
    </div>
  `;
  stage.querySelectorAll("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mood = btn.dataset.mood;
      state.start = null;
      state.activePath = null;
      setScreen("start");
    });
  });
}

function renderStart() {
  const mood = moodById(state.mood);
  stage.innerHTML = `
    <p class="kicker">Вход в комнату</p>
    <h1 class="h1">${mood?.title || ""}</h1>
    <p class="lead">С какого аккорда войти?</p>
    <div class="chip-row"><span class="chip">${mood?.title}</span></div>
    <div class="chord-grid">
      ${START_CHORDS.map(
        (c) => `<button type="button" class="chord-pick" data-chord="${c}">${c}</button>`
      ).join("")}
    </div>
  `;
  stage.querySelectorAll("[data-chord]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.start = btn.dataset.chord;
      loadPaths();
      setScreen("map");
    });
  });
}

function renderMap() {
  const mood = moodById(state.mood);
  if (!state.paths.length) loadPaths();
  stage.innerHTML = `
    <p class="kicker">Карта лада</p>
    <h1 class="h1">Куда можно пойти от ${state.start}</h1>
    <p class="lead">Выберите луч — откроется удобная последовательность аппликатур.</p>
    <div class="chip-row">
      <span class="chip">${mood?.title}</span>
      <span class="chip">${state.start}</span>
    </div>
    <div class="map-wrap">
      <div class="map-center">
        <div>
          <div class="name">${state.start}</div>
          <div class="sub">старт</div>
        </div>
      </div>
      <div class="path-list">
        ${state.paths
          .map(
            (p, i) => `
          <button type="button" class="path-card" data-path-idx="${i}">
            <p class="kind">${p.family} · ${p.kind}</p>
            <p class="route">${p.path.join(" → ")}</p>
            <p class="why">${p.why}</p>
          </button>`
          )
          .join("")}
      </div>
    </div>
    <div class="actions">
      <button type="button" class="btn btn-ghost" id="toSong">К дорожке песни</button>
    </div>
  `;
  stage.querySelectorAll("[data-path-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activePath = state.paths[Number(btn.dataset.pathIdx)];
      setScreen("path");
    });
  });
  document.getElementById("toSong").addEventListener("click", () => setScreen("song"));
}

function renderPath() {
  const p = state.activePath;
  if (!p) {
    setScreen("map");
    return;
  }
  const mood = moodById(state.mood);
  stage.innerHTML = `
    <p class="kicker">Ход</p>
    <h1 class="h1">${p.path.join(" → ")}</h1>
    <p class="lead">${p.family} · ${p.kind}</p>
    <div class="chip-row">
      <span class="chip">${mood?.title}</span>
      <span class="chip">${state.start}</span>
    </div>
    <div class="panel">
      ${renderPathDiagrams(p.path)}
      <p class="result-why">${p.why}</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-slot="verse">В куплет</button>
        <button type="button" class="btn btn-primary" data-slot="chorus">В припев</button>
        <button type="button" class="btn btn-ghost" data-slot="intro">В интро</button>
        <button type="button" class="btn btn-ghost" data-slot="bridge">В бридж</button>
        <button type="button" class="btn btn-ghost" id="anotherPath">Другой ход</button>
      </div>
    </div>
  `;
  stage.querySelectorAll("[data-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.song[btn.dataset.slot] = {
        path: [...p.path],
        kind: p.kind,
        family: p.family,
        mood: state.mood,
        start: state.start,
      };
      setScreen("song");
    });
  });
  document.getElementById("anotherPath").addEventListener("click", () => setScreen("map"));
}

function renderSong() {
  const mood = moodById(state.mood);
  const filled = SONG_SLOTS.filter((s) => state.song[s.id]);
  stage.innerHTML = `
    <p class="kicker">Дорожка песни</p>
    <h1 class="h1">Соберите форму</h1>
    <p class="lead">Кладите ходы в части песни. Потом можно слушать и менять.</p>
    <div class="chip-row">
      ${mood ? `<span class="chip">${mood.title}</span>` : ""}
      ${state.start ? `<span class="chip">старт ${state.start}</span>` : ""}
      <span class="chip">${filled.length} / ${SONG_SLOTS.length} частей</span>
    </div>
    <div class="song-list">
      ${SONG_SLOTS.map((slot) => {
        const item = state.song[slot.id];
        if (!item) {
          return `
            <div class="song-part is-empty">
              <p class="label">${slot.title}</p>
              <p class="route">Пока пусто</p>
              <p class="meta">Выберите ход на карте и отправьте сюда</p>
            </div>`;
        }
        const moodTitle = moodById(item.mood)?.title || "";
        return `
          <div class="song-part">
            <p class="label">${slot.title}</p>
            <p class="route">${item.path.join(" → ")}</p>
            <p class="meta">${moodTitle} · ${item.family}</p>
            <div class="actions">
              <button type="button" class="btn btn-ghost" data-open-slot="${slot.id}">Открыть ход</button>
              <button type="button" class="btn btn-ghost" data-clear-slot="${slot.id}">Убрать</button>
            </div>
          </div>`;
      }).join("")}
    </div>
    <div class="actions">
      <button type="button" class="btn btn-primary" id="toMap">К карте за новым ходом</button>
      <button type="button" class="btn btn-ghost" id="resetSong">Очистить дорожку</button>
    </div>
  `;
  stage.querySelectorAll("[data-clear-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.song[btn.dataset.clearSlot] = null;
      renderSong();
    });
  });
  stage.querySelectorAll("[data-open-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.song[btn.dataset.openSlot];
      if (!item) return;
      state.activePath = { path: item.path, kind: item.kind, family: item.family, why: "" };
      state.mood = item.mood;
      state.start = item.start;
      setScreen("path");
    });
  });
  document.getElementById("toMap").addEventListener("click", () => {
    if (!state.start) setScreen("mood");
    else {
      loadPaths();
      setScreen("map");
    }
  });
  document.getElementById("resetSong").addEventListener("click", () => {
    SONG_SLOTS.forEach((s) => (state.song[s.id] = null));
    renderSong();
  });
}

btnBack.addEventListener("click", goBack);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const nav = tab.dataset.nav;
    if (nav === "mood") setScreen("mood");
    else if (nav === "map") {
      if (!state.mood) setScreen("mood");
      else if (!state.start) setScreen("start");
      else {
        loadPaths();
        setScreen("map");
      }
    } else if (nav === "song") setScreen("song");
  });
});

document.querySelectorAll("[data-instrument]").forEach((btn) => {
  btn.addEventListener("click", () => {
    // audio.js handles sound; refresh path diagrams for guitar/piano
    setTimeout(() => {
      if (state.screen === "path") renderPath();
    }, 0);
  });
});

setScreen("mood");
