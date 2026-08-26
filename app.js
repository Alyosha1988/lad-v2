/**
 * Лад — Song Companion v2
 * Комната настроения → аккорд → карта → ход → дорожка
 * Стиль: ночная топография + янтарное свечение.
 */

const V2_MOODS = [
  {
    id: "bright",
    title: "Светлое",
    desc: "ясно. открыто. дыхание",
  },
  {
    id: "dark",
    title: "Тёмное",
    desc: "тише. глубже. внутрь",
  },
  {
    id: "tense",
    title: "Напряжённое",
    desc: "тяга. конфликт. разряд",
  },
  {
    id: "dream",
    title: "Мечтательное",
    desc: "дымка. мягкие края",
  },
  {
    id: "pulse",
    title: "Пульс",
    desc: "ритм. тело. повтор",
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
  screen: "mood", // mood | start | discover | map | path | song | plus | glossary | degrees
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
  mapFocus: null,
  discover: {
    frets: [-1, -1, -1, -1, -1, -1],
    piano: [], // midi numbers
    baseFret: 1,
  },
  returnFromPlus: "mood",
  returnFromGlossary: "mood",
  returnFromDegrees: "mood",
  glossaryQuery: "",
  glossaryFocus: null,
  pdfPreview: false,
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
      (nav === "mood" &&
        (name === "mood" ||
          name === "start" ||
          name === "discover" ||
          name === "plus" ||
          name === "glossary" ||
          name === "degrees")) ||
      (nav === "map" && (name === "map" || name === "path")) ||
      (nav === "song" && name === "song");
    tab.classList.toggle("is-active", active);
  });
  btnBack.hidden = name === "mood";
  document.body.classList.toggle("is-mood-home", name === "mood");
  render();
}

function openLadPlus(fromScreen) {
  state.returnFromPlus = fromScreen || state.screen;
  setScreen("plus");
}

function openGlossary(fromScreen, termId) {
  state.returnFromGlossary = fromScreen || state.screen;
  state.glossaryFocus = termId || null;
  setScreen("glossary");
}

function openDegrees(fromScreen) {
  state.returnFromDegrees = fromScreen || state.screen;
  setScreen("degrees");
}

function goBack() {
  if (state.screen === "plus") setScreen(state.returnFromPlus || "mood");
  else if (state.screen === "glossary") setScreen(state.returnFromGlossary || "mood");
  else if (state.screen === "degrees") {
    const back = state.returnFromDegrees;
    if (back && back !== "degrees" && back !== "start") setScreen(back);
    else if (state.start && state.mood) {
      loadPaths();
      setScreen("map");
    } else setScreen("mood");
  } else if (state.screen === "start") setScreen("mood");
  else if (state.screen === "discover") setScreen("start");
  else if (state.screen === "map") setScreen(state.start ? "start" : "mood");
  else if (state.screen === "path") setScreen("map");
  else if (state.screen === "song") setScreen(state.activePath ? "path" : "map");
  else setScreen("mood");
}

function hasPlus() {
  return typeof LadTheory !== "undefined" && LadTheory.hasLadPlus();
}

function bindTheoryHooks(root) {
  root.querySelectorAll("[data-open-lad-plus]").forEach((btn) => {
    btn.addEventListener("click", () => openLadPlus(state.screen));
  });
  root.querySelectorAll("[data-open-glossary]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openGlossary(state.screen, btn.dataset.termId || null);
    });
  });
  root.querySelectorAll("[data-open-degrees]").forEach((btn) => {
    btn.addEventListener("click", () => openDegrees(state.screen));
  });
  // голос: только через document delegation ниже — не навешиваем здесь
}

/** Единый обработчик голоса: никогда не уводит со ступеней/словаря. */
function bindVoiceDelegation() {
  if (document.__ladVoiceBound) return;
  document.__ladVoiceBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("[data-set-voice], [data-voice]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (typeof LadTheory === "undefined") return;
      const voice = btn.dataset.setVoice || btn.dataset.voice;
      if (voice !== "plain" && voice !== "pro") return;
      LadTheory.setVoice(voice);
      // откладываем перерисовку: иначе на таче «призрачный» click попадает в DOM после replace
      const screen = state.screen;
      requestAnimationFrame(() => {
        if (state.screen !== screen) return;
        if (screen === "degrees") renderDegrees();
        else if (screen === "glossary") renderGlossary();
        else if (screen === "plus") renderLadPlus();
        else render();
      });
    },
    true
  );
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
  else if (state.screen === "discover") renderDiscover();
  else if (state.screen === "map") renderMap();
  else if (state.screen === "path") renderPath();
  else if (state.screen === "song") renderSong();
  else if (state.screen === "plus") renderLadPlus();
  else if (state.screen === "glossary") renderGlossary();
  else if (state.screen === "degrees") renderDegrees();
}

function renderLadPlus() {
  stage.innerHTML =
    typeof LadTheory !== "undefined"
      ? LadTheory.renderLadPlusScreen({ variant: "night" })
      : `<p class="hand-note">Модуль теории не загружен.</p>`;
  if (typeof LadTheory !== "undefined") {
    LadTheory.bindLadPlusScreen(stage, {
      onChange: () => renderLadPlus(),
      onBack: () => setScreen(state.returnFromPlus || "mood"),
    });
  }
}

function renderGlossary() {
  stage.innerHTML =
    typeof LadTheory !== "undefined"
      ? LadTheory.renderGlossaryScreen({
          variant: "night",
          query: state.glossaryQuery || "",
          focusId: state.glossaryFocus,
        })
      : `<p class="hand-note">Словарь не загружен.</p>`;
  if (typeof LadTheory !== "undefined") {
    LadTheory.bindGlossaryScreen(stage, {
      onChange: ({ query }) => {
        state.glossaryQuery = query || "";
        state.glossaryFocus = null;
        renderGlossary();
        const input = document.getElementById("glossaryQuery");
        if (input) {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
        }
      },
      onBack: () => setScreen(state.returnFromGlossary || "mood"),
    });
    bindTheoryHooks(stage);
  }
}

function renderDegrees() {
  const symbol = state.start || "";
  stage.innerHTML =
    typeof LadTheory !== "undefined"
      ? LadTheory.renderDegreesScreen({ variant: "night", symbol })
      : `<p class="hand-note">Раздел ступеней не загружен.</p>`;
  if (typeof LadTheory !== "undefined") {
    LadTheory.bindDegreesScreen(stage, {
      onChange: () => renderDegrees(),
      onBack: () => goBack(),
    });
    bindTheoryHooks(stage);
  }
}

function renderMood() {
  stage.innerHTML = `
    <section class="hero-sketch">
      <div class="hero-copy">
        <h1 class="h1 brand-hero">Лад</h1>
        <p class="eyebrow">музыка в твоём ритме</p>
        <p class="hand">Исследуй связи между аккордами. Собирай гармоничные пути.</p>
      </div>
      <figure class="hero-art">
        <img src="icons/hero_night_landscape.jpg" alt="Ночной пейзаж" />
      </figure>
    </section>

    <p class="section-title">Комната <span>оттенков</span></p>
    <p class="section-hand">выберите оттенок — он задаст ладовую опору карты и дорожки</p>

    <div class="mood-orbit">
      ${V2_MOODS.map(
        (m) => `
        <button type="button" class="mood-card" data-mood="${m.id}">
          <span class="ring"><img src="icons/moods/${m.id}.jpg" alt="" /></span>
          <span class="title">${m.title}</span>
          <span class="desc">${m.desc}</span>
          ${typeof LadTheory !== "undefined" ? LadTheory.renderMoodModeLine(m.id) : ""}
        </button>`
      ).join("")}
    </div>

    <div class="actions" style="margin-top:1rem">
      <button type="button" class="btn btn-ghost" id="openPlusHome">Лад+</button>
      <button type="button" class="btn btn-ghost" data-open-glossary>Словарь</button>
    </div>

    <button type="button" class="ink-banner" id="toSongBanner">
      <span class="mark">✦</span>
      <span>
        <span class="title">Дорожка</span>
        <span class="sub">форма песни и выгрузка листа</span>
      </span>
      <span class="chev">›</span>
    </button>
  `;
  stage.querySelectorAll("[data-mood]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mood = btn.dataset.mood;
      state.start = null;
      state.activePath = null;
      state.mapFocus = null;
      setScreen("start");
    });
  });
  document.getElementById("toSongBanner").addEventListener("click", () => setScreen("song"));
  document.getElementById("openPlusHome")?.addEventListener("click", () => openLadPlus("mood"));
  bindTheoryHooks(stage);
}

function renderStart() {
  const mood = moodById(state.mood);
  const modeLine =
    typeof LadTheory !== "undefined" && state.mood
      ? LadTheory.moodLineForVoice
        ? LadTheory.moodLineForVoice(state.mood)
        : LadTheory.moodModeInfo(state.mood).modeLine
      : "";
  stage.innerHTML = `
    <p class="kicker">${typeof LadTheory !== "undefined" && LadTheory.getVoice() === "plain" ? "Дом гармонии" : "Тональный центр"}</p>
    <h1 class="h1">${mood?.title || ""}</h1>
    ${modeLine ? `<p class="mood-mode-line">${modeLine}</p>` : ""}
    <p class="hand-note">${
      typeof LadTheory !== "undefined" && LadTheory.getVoice() === "plain"
        ? "Выберите аккорд-дом — от него карта будет вести историю."
        : "Выберите тонику — она станет тональным центром карты."
    }</p>
    <div class="chip-row">
      <button type="button" class="chip chip-btn" id="changeMood">${mood?.title || ""} ▾</button>
      <button type="button" class="chip chip-btn" id="openPlusStart">Лад+</button>
      <button type="button" class="chip chip-btn" data-open-glossary>Словарь</button>
    </div>
    <button type="button" class="btn btn-glow btn-block" id="toDiscover">
      Не знаю аккорд — показать на грифе / клавишах
    </button>
    <p class="section-hand" style="margin-top:1rem">или выберите из списка</p>
    <div class="chord-grid">
      ${START_CHORDS.map(
        (c) => `<button type="button" class="chord-pick" data-chord="${c}">${c}</button>`
      ).join("")}
    </div>
  `;
  document.getElementById("changeMood")?.addEventListener("click", () => setScreen("mood"));
  document.getElementById("openPlusStart")?.addEventListener("click", () => openLadPlus("start"));
  bindTheoryHooks(stage);
  document.getElementById("toDiscover")?.addEventListener("click", () => {
    state.discover = {
      frets: typeof emptyGuitarFrets === "function" ? emptyGuitarFrets() : [-1, -1, -1, -1, -1, -1],
      piano: [],
      baseFret: 1,
    };
    setScreen("discover");
  });
  stage.querySelectorAll("[data-chord]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.start = btn.dataset.chord;
      state.mapFocus = null;
      loadPaths();
      setScreen("map");
    });
  });
}

function discoverInstrumentIsPiano() {
  if (typeof getInstrument === "function") return getInstrument() === "piano";
  try {
    return localStorage.getItem("lad-instrument") === "piano";
  } catch (_) {
    return false;
  }
}

function renderDiscoverGuitar(matches) {
  const frets = state.discover.frets;
  const base = state.discover.baseFret || 1;
  const nut = [0, 1, 2, 3, 4].map((rel) => base + rel);
  const stringNames = ["E", "A", "D", "G", "B", "e"];

  const nutRow = frets
    .map((f, s) => {
      const isMute = f < 0;
      const isOpen = f === 0;
      return `<button type="button" class="fb-nut ${isMute ? "is-mute" : ""} ${isOpen ? "is-open" : ""}" data-nut="${s}" aria-label="Струна ${stringNames[s]}: ${isMute ? "приглушена" : isOpen ? "открыта" : "зажата"}">${isMute ? "×" : isOpen ? "○" : "·"}</button>`;
    })
    .join("");

  const grid = nut
    .map((absFret) => {
      const cells = frets
        .map((f, s) => {
          const on = f === absFret;
          return `<button type="button" class="fb-cell ${on ? "is-on" : ""}" data-string="${s}" data-fret="${absFret}" aria-label="Струна ${stringNames[s]}, лад ${absFret}"></button>`;
        })
        .join("");
      return `<div class="fb-row"><span class="fb-fretno">${absFret}</span>${cells}</div>`;
    })
    .join("");

  return `
    <div class="discover-board">
      <div class="fb-toolbar">
        <button type="button" class="chip chip-btn" id="fbPrev" ${base <= 1 ? "disabled" : ""}>← лады</button>
        <span class="fb-window">лады ${base}–${base + 4}</span>
        <button type="button" class="chip chip-btn" id="fbNext" ${base >= 12 ? "disabled" : ""}>лады →</button>
      </div>
      <p class="fb-hint">× / ○ сверху — приглушить или открыть · точка на ладу — зажать</p>
      <div class="fb">
        <div class="fb-row fb-nutrow"><span class="fb-fretno">0</span>${nutRow}</div>
        ${grid}
      </div>
      <div class="fb-strings">${stringNames.map((n) => `<span>${n}</span>`).join("")}</div>
    </div>
    ${renderDiscoverMatches(matches)}
  `;
}

function renderDiscoverPiano(matches) {
  const selected = new Set(state.discover.piano || []);
  // Two octaves C3–B4
  const start = 48;
  const end = 71;
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
  const whites = [];
  for (let m = start; m <= end; m++) if (!isBlack(m)) whites.push(m);

  const whiteHtml = whites
    .map((m) => {
      const on = selected.has(m);
      const name = (typeof PC_NAMES !== "undefined" ? PC_NAMES : [])[m % 12] || "";
      return `<button type="button" class="pk-white ${on ? "is-on" : ""}" data-midi="${m}" aria-label="${name}">${m % 12 === 0 ? name : ""}</button>`;
    })
    .join("");

  const blackHtml = whites
    .map((m, i) => {
      const nb = m + 1;
      if (nb > end || !isBlack(nb)) return `<span class="pk-gap"></span>`;
      const on = selected.has(nb);
      return `<button type="button" class="pk-black ${on ? "is-on" : ""}" data-midi="${nb}" style="left: calc(${i} * var(--pk-w) + var(--pk-w) * 0.68)" aria-label="black"></button>`;
    })
    .join("");

  return `
    <div class="discover-board">
      <p class="fb-hint">Нажми клавиши, которые звучат — можно несколько</p>
      <div class="pk">
        <div class="pk-whites">${whiteHtml}</div>
        <div class="pk-blacks">${blackHtml}</div>
      </div>
    </div>
    ${renderDiscoverMatches(matches)}
  `;
}

function renderDiscoverMatches(matches) {
  if (!matches.length) {
    return `<p class="discover-empty">Поставь хотя бы две ноты — подскажу возможные аккорды</p>`;
  }
  return `
    <p class="section-title">Похоже на</p>
    <div class="discover-matches">
      ${matches
        .map(
          (m, i) => `
        <button type="button" class="discover-hit ${i === 0 ? "is-best" : ""}" data-pick="${m.symbol}">
          <span class="sym">${m.symbol}</span>
          <span class="why">${m.reason || ""}</span>
        </button>`
        )
        .join("")}
    </div>
  `;
}

function renderDiscover() {
  const isPiano = discoverInstrumentIsPiano();
  const matches = isPiano
    ? identifyFromMidis(state.discover.piano || [])
    : identifyFromFrets(state.discover.frets || []);

  stage.innerHTML = `
    <p class="kicker">Узнать аккорд</p>
    <h1 class="h1">${isPiano ? "Клавиши" : "Гриф"}</h1>
    <p class="hand-note">${
      isPiano
        ? "отметь звучащие клавиши — как на рояле"
        : "отметь зажатые и приглушённые струны — как на грифе"
    }</p>
    <div class="chip-row">
      <span class="chip">${isPiano ? "режим: рояль" : "режим: гитара"}</span>
      <button type="button" class="chip chip-btn" id="discoverClear">сбросить</button>
    </div>
    ${isPiano ? renderDiscoverPiano(matches) : renderDiscoverGuitar(matches)}
    <div class="actions">
      <button type="button" class="btn btn-ghost" id="discoverBack">К списку аккордов</button>
    </div>
  `;

  const pick = (symbol) => {
    state.start = symbol;
    state.mapFocus = null;
    loadPaths();
    setScreen("map");
  };

  stage.querySelectorAll("[data-pick]").forEach((btn) => {
    btn.addEventListener("click", () => pick(btn.dataset.pick));
  });

  document.getElementById("discoverBack")?.addEventListener("click", () => setScreen("start"));
  document.getElementById("discoverClear")?.addEventListener("click", () => {
    state.discover.frets = emptyGuitarFrets();
    state.discover.piano = [];
    renderDiscover();
  });

  if (isPiano) {
    stage.querySelectorAll("[data-midi]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const midi = Number(btn.dataset.midi);
        const set = new Set(state.discover.piano || []);
        if (set.has(midi)) set.delete(midi);
        else set.add(midi);
        state.discover.piano = [...set].sort((a, b) => a - b);
        // preview sound
        if (typeof playMidiNotes === "function" && set.has(midi)) {
          try {
            playMidiNotes([midi]);
          } catch (_) {}
        }
        renderDiscover();
      });
    });
  } else {
    document.getElementById("fbPrev")?.addEventListener("click", () => {
      state.discover.baseFret = Math.max(1, (state.discover.baseFret || 1) - 1);
      renderDiscover();
    });
    document.getElementById("fbNext")?.addEventListener("click", () => {
      state.discover.baseFret = Math.min(12, (state.discover.baseFret || 1) + 1);
      renderDiscover();
    });
    stage.querySelectorAll("[data-nut]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = Number(btn.dataset.nut);
        const cur = state.discover.frets[s];
        // cycle: mute → open → mute (if fretted, go open)
        if (cur < 0) state.discover.frets[s] = 0;
        else state.discover.frets[s] = -1;
        renderDiscover();
      });
    });
    stage.querySelectorAll("[data-string][data-fret]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = Number(btn.dataset.string);
        const fret = Number(btn.dataset.fret);
        if (state.discover.frets[s] === fret) state.discover.frets[s] = -1;
        else state.discover.frets[s] = fret;
        // play voicing preview
        if (typeof playVoicing === "function") {
          try {
            playVoicing(state.discover.frets);
          } catch (_) {}
        }
        renderDiscover();
      });
    });
  }
}

const MOOD_FLAVOR = {
  bright: {
    title: "Ионийский свет",
    text: "Открыто и ясно: пути тянутся к доминанте и тёплому возврату домой.",
  },
  dark: {
    title: "Локрийский оттенок",
    text: "Тёмный, меланхоличный, с внутренним движением и тягой к разрешению.",
  },
  tense: {
    title: "Фригийское напряжение",
    text: "Острые грани и тяга вверх — ходы ищут разряд и возврат к тонике.",
  },
  dream: {
    title: "Лидийская дымка",
    text: "Мягкие края и парящие связи — карта ведёт через цвет и подвешенность.",
  },
  pulse: {
    title: "Дорийский пульс",
    text: "Ритм в гармонии: короткие петли, повтор и телесный кач.",
  },
};

function pathEdgeLabel(pathIdea) {
  const blob = `${pathIdea.kind || ""} ${pathIdea.why || ""} ${pathIdea.family || ""}`.toLowerCase();
  if (/каденц|доминант|v7|напряж/.test(blob)) return "к тонике";
  if (/спуск|нисход|пада|fall|andalus/.test(blob)) return "спуск";
  if (/bossa|ii.?v|джаз|септ/.test(blob)) return "мягко";
  if (/припев|pop|i–v–vi|i-v-vi|узнаваем/.test(blob)) return "припев";
  if (/мягк|iii|относительно|лирик/.test(blob)) return "мягко";
  if (/напряж|twist|остр|конфликт/.test(blob)) return "острее";
  if (state.mood === "dark") return "спуск";
  if (state.mood === "tense") return "острее";
  if (state.mood === "pulse") return "пульс";
  if (state.mood === "dream") return "дымка";
  return "ход";
}

function pathDegreeLabel(pathIdea, idx) {
  const kind = pathIdea.kind || "";
  const m = kind.match(/\b(i{1,3}|iv|v|vi{0,2}|b?III|b?VI|b?VII|V7|ii|iii|IV|V|vi)[\w–\-\/]*/i);
  if (m) return m[0].replace(/–/g, "-").slice(0, 8);
  const roman = ["I", "ii", "iii", "IV", "V", "vi", "vii"];
  return roman[idx % roman.length];
}

function buildMapNodes(paths) {
  const nodes = [];
  const seen = new Set();
  paths.forEach((p, pathIdx) => {
    const chord = (p.path && p.path[1]) || (p.path && p.path[0]);
    if (!chord || chord === state.start || seen.has(chord)) return;
    seen.add(chord);
    nodes.push({
      chord,
      degree: pathDegreeLabel(p, nodes.length),
      edge: pathEdgeLabel(p),
      pathIdx,
      path: p,
    });
  });
  return nodes.slice(0, 5);
}

function renderMapGate() {
  const mood = moodById(state.mood);
  stage.innerHTML = `
    <div class="map-hero-copy">
      <h1 class="map-title">Карта лада</h1>
      <p class="map-lead">Исследуй связи между аккордами. Собирай гармоничные пути.</p>
    </div>
    <div class="map-gate night">
      <div class="map-gate-sketch" aria-hidden="true">
        <svg viewBox="0 0 280 180" width="100%" height="180">
          <defs>
            <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#f0a35a" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#f0a35a" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="140" cy="90" r="40" fill="url(#gGlow)"/>
          <circle cx="140" cy="90" r="22" fill="#1a120c" stroke="#f0a35a" stroke-width="2"/>
          <text x="140" y="94" text-anchor="middle" font-size="15" font-family="Georgia,serif" fill="#f7e7d0">${mood ? "·" : "♪"}</text>
          ${[0, 72, 144, 216, 288]
            .map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              const x2 = 140 + Math.cos(a) * 72;
              const y2 = 90 + Math.sin(a) * 55;
              return `<line x1="140" y1="90" x2="${x2}" y2="${y2}" stroke="#f0a35a" stroke-width="1.4" opacity="0.55"/>
                <circle cx="${x2}" cy="${y2}" r="12" fill="#16120f" stroke="#e08a45" stroke-width="1.3"/>`;
            })
            .join("")}
        </svg>
      </div>
      ${
        mood
          ? `
        <button type="button" class="mood-pill" id="gateMood">${mood.title} ▾</button>
        <p class="map-lead soft">Выбери тонику — она станет сердцем карты</p>
        <div class="chord-grid dark-chords">
          ${START_CHORDS.map(
            (c) => `<button type="button" class="chord-pick" data-chord="${c}">${c}</button>`
          ).join("")}
        </div>`
          : `
        <p class="map-lead soft">Сначала выберите настроение в комнате — затем аккорд-дом.</p>
        <div class="actions">
          <button type="button" class="btn btn-glow" id="gateToMood">В комнату</button>
        </div>`
      }
    </div>
  `;
  if (mood) {
    document.getElementById("gateMood")?.addEventListener("click", () => setScreen("mood"));
    stage.querySelectorAll("[data-chord]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.start = btn.dataset.chord;
        loadPaths();
        setScreen("map");
      });
    });
  } else {
    document.getElementById("gateToMood").addEventListener("click", () => setScreen("mood"));
  }
}

function renderNightMapSvg(nodes, start) {
  const n = Math.max(nodes.length, 1);
  const vb = 420;
  const cx = 210;
  const cy = 210;
  const rOuter = 132;
  const rHub = 46;
  const rLabel = rOuter + 36;
  // Prefer mockup-like angles: TL, TR, MR, BR, BL
  const preferred = [-2.4, -0.75, 0.35, 1.35, 2.55];

  const rays = nodes
    .map((node, i) => {
      const angle = preferred[i] ?? -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + Math.cos(angle) * rOuter;
      const y = cy + Math.sin(angle) * rOuter;
      const mx = cx + Math.cos(angle) * (rHub + (rOuter - rHub) * 0.52);
      const my = cy + Math.sin(angle) * (rHub + (rOuter - rHub) * 0.52);
      const tx = mx + Math.cos(angle + Math.PI / 2) * 18;
      const ty = my + Math.sin(angle + Math.PI / 2) * 18;
      return `
        <g class="nmap-ray" data-path-idx="${node.pathIdx}" role="button" tabindex="0" aria-label="${node.chord}">
          <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="nmap-line"/>
          <text x="${tx}" y="${ty}" text-anchor="middle" class="nmap-edge">${node.edge}</text>
          <circle cx="${x}" cy="${y}" r="30" class="nmap-node-glow"/>
          <circle cx="${x}" cy="${y}" r="24" class="nmap-node"/>
          <image href="icons/map_node_landscape.png" x="${x - 10}" y="${y - 14}" width="20" height="20" preserveAspectRatio="xMidYMid slice"/>
          <text x="${x}" y="${y + 14}" text-anchor="middle" class="nmap-chord">${node.chord}</text>
        </g>`;
    })
    .join("");

  return `
    <svg class="nmap-svg" viewBox="0 0 ${vb} ${vb}" role="img" aria-label="Карта лада от ${start}">
      <defs>
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffb061" stop-opacity="0.95"/>
          <stop offset="55%" stop-color="#e07830" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#e07830" stop-opacity="0"/>
        </radialGradient>
        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="70" fill="url(#hubGlow)"/>
      <circle cx="${cx}" cy="${cy}" r="${rHub}" class="nmap-hub" filter="url(#softGlow)"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="nmap-hub-name">${start}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" class="nmap-hub-sub">Тоника</text>
      ${rays}
    </svg>`;
}

function renderMap() {
  if (!state.mood || !state.start) {
    renderMapGate();
    return;
  }
  const mood = moodById(state.mood);
  if (!state.paths.length) loadPaths();
  const paths = state.paths.slice(0, 9);
  const nodes = buildMapNodes(paths);
  const flavor = MOOD_FLAVOR[state.mood] || MOOD_FLAVOR.dark;
  const focus = state.mapFocus != null ? paths[state.mapFocus] : null;
  const modeLine =
    typeof LadTheory !== "undefined"
      ? LadTheory.moodLineForVoice
        ? LadTheory.moodLineForVoice(state.mood)
        : LadTheory.moodModeInfo(state.mood).modeLine
      : "";
  const focusPass =
    focus && typeof LadTheory !== "undefined"
      ? LadTheory.buildPassport(focus, { moodId: state.mood, start: state.start })
      : null;
  const focusEdge = focus
    ? nodes.find((n) => n.pathIdx === state.mapFocus)?.edge
    : null;
  const edgeNote =
    focusEdge && typeof LadTheory !== "undefined" ? LadTheory.edgeTheory(focusEdge) : "";
  const plain = typeof LadTheory !== "undefined" && LadTheory.getVoice() === "plain";
  const focusBlurb = focus
    ? plain
      ? `${focusPass?.brief.degrees || ""} · ${focusPass?.brief.functionsPlain || focus.why}`
      : `${focusPass?.brief.degrees || ""} · ${focusPass?.brief.functions || focus.why}`
    : flavor.text;

  stage.innerHTML = `
    <div class="map-top">
      <div class="map-hero-copy">
        <h1 class="map-title">Карта лада</h1>
        <p class="map-lead">Исследуйте связи между созвучиями. Собирайте гармонические пути.</p>
        ${modeLine ? `<p class="mood-mode-line">${modeLine}</p>` : ""}
      </div>
      <button type="button" class="mood-pill" id="mapMood">${mood?.title || ""} ▾</button>
    </div>
    <div class="chip-row" style="margin:0.55rem 0 0.85rem">
      <span class="chip">дом ${state.start}</span>
      <button type="button" class="chip chip-btn" data-open-glossary>Словарь</button>
      <button type="button" class="chip chip-btn" data-open-lad-plus>Лад+</button>
    </div>
    <button type="button" class="btn btn-glow btn-block" data-open-degrees id="openDegreesMap">
      Ступени от ${state.start}
    </button>

    <div class="nmap-board">
      ${renderNightMapSvg(nodes, state.start)}
    </div>

    <article class="map-info-card">
      <span class="map-info-mark" aria-hidden="true">✦</span>
      <div>
        <h2 class="map-info-title">${
          focus
            ? typeof LadTheory !== "undefined"
              ? LadTheory.upperRomans(focus.kind)
              : focus.kind
            : flavor.title
        }</h2>
        <p class="map-info-text">${focus ? focusBlurb : flavor.text}</p>
        ${edgeNote ? `<p class="nmap-edge-theory">${edgeNote}</p>` : ""}
        ${
          focus && !hasPlus()
            ? `<p class="nmap-edge-theory">Полный разбор каденции и родственных оборотов — в Лад+.</p>`
            : ""
        }
        ${
          !focus
            ? `<p class="map-focus-route soft">Нажмите узел — откроется связь и ход</p>`
            : `<p class="map-focus-route">${focus.path.join(" → ")}</p>`
        }
      </div>
      <button type="button" class="map-info-more" id="mapDetails">${focus ? "К ходу ›" : "Подробнее ›"}</button>
    </article>

    <button type="button" class="btn btn-glow btn-block" id="toSong">
      Собрать в дорожку →
    </button>
    <div class="actions map-bottom-actions">
      <button type="button" class="btn btn-ghost" data-open-lad-plus>Лад+</button>
    </div>
  `;

  bindTheoryHooks(stage);
  const openFocusPath = () => {
    if (state.mapFocus == null) {
      if (nodes[0]) {
        state.mapFocus = nodes[0].pathIdx;
        state.activePath = paths[nodes[0].pathIdx];
        setScreen("path");
      }
      return;
    }
    state.activePath = paths[state.mapFocus];
    if (state.activePath) setScreen("path");
  };

  stage.querySelectorAll("[data-path-idx]").forEach((el) => {
    const activate = () => {
      const idx = Number(el.dataset.pathIdx);
      if (state.mapFocus === idx) {
        state.activePath = paths[idx];
        if (state.activePath) setScreen("path");
        return;
      }
      state.mapFocus = idx;
      renderMap();
    };
    el.addEventListener("click", activate);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  // highlight selected
  if (state.mapFocus != null) {
    stage.querySelectorAll(`[data-path-idx="${state.mapFocus}"]`).forEach((el) => {
      el.classList.add("is-active");
    });
  }

  document.getElementById("mapMood").addEventListener("click", () => setScreen("mood"));
  document.getElementById("mapDetails").addEventListener("click", openFocusPath);
  document.getElementById("toSong").addEventListener("click", () => {
    if (state.mapFocus != null && paths[state.mapFocus]) {
      state.activePath = paths[state.mapFocus];
    }
    setScreen("song");
  });

  // double-click / second tap on active goes to path — add "open" on info more already
}

function renderPath() {
  const p = state.activePath;
  if (!p) {
    setScreen("map");
    return;
  }
  const mood = moodById(state.mood);
  const passport =
    typeof LadTheory !== "undefined"
      ? LadTheory.buildPassport(p, { moodId: state.mood, start: state.start })
      : null;
  const passportHtml = passport ? LadTheory.renderPassportHtml(passport) : "";
  const kindLabel =
    typeof LadTheory !== "undefined" ? LadTheory.upperRomans(p.kind || "") : p.kind || "";

  stage.innerHTML = `
    <p class="kicker">Гармонический ход</p>
    <h1 class="h1">${p.path.join(" → ")}</h1>
    <p class="hand-note">${p.family} · ${kindLabel}</p>
    <div class="chip-row">
      <span class="chip">${mood?.title}</span>
      <span class="chip">${state.start}</span>
      <button type="button" class="chip chip-btn" data-open-glossary>Словарь</button>
      <button type="button" class="chip chip-btn" data-open-lad-plus>Лад+</button>
    </div>
    <div class="actions" style="margin:0.55rem 0 0.85rem">
      <button type="button" class="btn btn-glow" data-open-degrees>Ступени от ${state.start}</button>
    </div>
    ${passportHtml}
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
    <div class="actions">
      <button type="button" class="btn btn-glow btn-block" id="pathToSong">
        Собрать в дорожку →
      </button>
    </div>
  `;
  bindTheoryHooks(stage);
  stage.querySelectorAll("[data-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.song[btn.dataset.slot] = {
        path: [...p.path],
        kind: p.kind,
        family: p.family,
        why: p.why,
        mood: state.mood,
        start: state.start,
      };
      if (hasPlus() && typeof LadTheory !== "undefined") {
        LadTheory.saveSongState(state.song);
      }
      setScreen("song");
    });
  });
  document.getElementById("anotherPath").addEventListener("click", () => setScreen("map"));
  document.getElementById("pathToSong").addEventListener("click", () => setScreen("song"));
}

function applySongState(saved) {
  if (!saved || typeof saved !== "object") return false;
  let loaded = false;
  SONG_SLOTS.forEach((s) => {
    if (saved[s.id]?.path?.length) {
      state.song[s.id] = saved[s.id];
      loaded = true;
    }
  });
  if (!loaded) return false;
  const first = SONG_SLOTS.map((s) => state.song[s.id]).find(Boolean);
  if (first) {
    if (first.mood) state.mood = first.mood;
    if (first.start) state.start = first.start;
  }
  return true;
}

function restoreSavedSong() {
  if (!hasPlus() || typeof LadTheory === "undefined") return false;
  if (!LadTheory.hasSavedSong()) return false;
  return applySongState(LadTheory.loadSongState());
}

function currentSongIsEmpty() {
  return !SONG_SLOTS.some((s) => state.song[s.id]?.path?.length);
}

function renderSong() {
  const mood = moodById(state.mood);
  const filled = SONG_SLOTS.filter((s) => state.song[s.id]);
  const plus = hasPlus();
  const previewHtml =
    state.pdfPreview && filled.length ? renderPdfPreviewBlock(filled) : "";
  const hasDeviceSave =
    typeof LadTheory !== "undefined" && LadTheory.hasSavedSong && LadTheory.hasSavedSong();
  const showLoadBanner = plus && hasDeviceSave && currentSongIsEmpty();

  stage.innerHTML = `
    <p class="kicker">Дорожка песни</p>
    <h1 class="h1">Соберите форму</h1>
    <p class="hand-note">Аппликатуры и прослушивание в частях формы · инструмент сверху</p>
    <div class="chip-row">
      ${mood ? `<span class="chip">${mood.title}</span>` : ""}
      ${state.start ? `<span class="chip">центр ${state.start}</span>` : ""}
      <span class="chip">${filled.length} / ${SONG_SLOTS.length}</span>
      ${state.start ? `<button type="button" class="chip chip-btn" data-open-degrees>Ступени</button>` : ""}
      <button type="button" class="chip chip-btn" data-open-glossary>Словарь</button>
      <button type="button" class="chip chip-btn" data-open-lad-plus>Лад+</button>
    </div>
    ${
      showLoadBanner
        ? `<div class="song-saved-banner" id="songSavedBanner">
            <p>На этом устройстве есть сохранённая дорожка.</p>
            <button type="button" class="btn btn-glow btn-tiny" id="loadSavedSong">Открыть сохранённую</button>
          </div>`
        : hasDeviceSave && plus
          ? `<p class="song-saved-note">Есть копия на устройстве · вкладка «Дорожка»</p>`
          : ""
    }
    <div class="song-list">
      ${SONG_SLOTS.map((slot) => {
        const item = state.song[slot.id];
        if (!item) {
          return `
            <div class="song-part is-empty">
              <p class="label">${slot.title}</p>
              <p class="route">пока пусто</p>
              <p class="meta">выберите ход на карте и направьте в эту часть формы</p>
            </div>`;
        }
        const moodTitle = moodById(item.mood)?.title || "";
        const pass =
          typeof LadTheory !== "undefined"
            ? LadTheory.buildPassport(item, { moodId: item.mood, start: item.start }).brief
            : null;
        return `
          <div class="song-part">
            <p class="label">${slot.title}</p>
            <p class="route">${item.path.join(" → ")}</p>
            <p class="meta">${moodTitle} · ${item.family}${pass ? ` · ${pass.degrees}` : ""}</p>
            ${renderPathDiagrams(item.path)}
            <div class="actions">
              <button type="button" class="btn btn-ghost" data-open-slot="${slot.id}">Открыть ход</button>
              <button type="button" class="btn btn-ghost" data-clear-slot="${slot.id}">Убрать</button>
            </div>
          </div>`;
      }).join("")}
    </div>
    ${previewHtml}
    <p class="song-save-status" id="songSaveStatus" hidden></p>
    <div class="actions">
      <button type="button" class="btn btn-glow" id="exportPdf" ${filled.length ? "" : "disabled"}>
        ${plus ? "Выгрузить PDF" : "Показать лист (как после оплаты)"}
      </button>
      ${
        plus
          ? `<button type="button" class="btn btn-primary" id="saveSong">Сохранить дорожку</button>`
          : `<button type="button" class="btn btn-primary" data-open-lad-plus>Сохранение — в Лад+</button>`
      }
      ${
        plus && hasDeviceSave && !currentSongIsEmpty()
          ? `<button type="button" class="btn btn-ghost" id="reloadSavedSong">Вернуть сохранённую</button>`
          : ""
      }
      <button type="button" class="btn btn-ghost" id="toMap">К карте</button>
      <button type="button" class="btn btn-ghost" id="resetSong">Очистить</button>
    </div>
  `;
  bindTheoryHooks(stage);

  const flashSaveStatus = (text) => {
    const el = document.getElementById("songSaveStatus");
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
  };

  const loadFromDevice = () => {
    if (restoreSavedSong()) {
      state.pdfPreview = false;
      renderSong();
      flashSaveStatus("Сохранённая дорожка открыта во вкладке «Дорожка».");
    }
  };

  document.getElementById("loadSavedSong")?.addEventListener("click", loadFromDevice);
  document.getElementById("reloadSavedSong")?.addEventListener("click", loadFromDevice);

  stage.querySelectorAll("[data-clear-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.song[btn.dataset.clearSlot] = null;
      state.pdfPreview = false;
      renderSong();
    });
  });
  stage.querySelectorAll("[data-open-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = state.song[btn.dataset.openSlot];
      if (!item) return;
      state.activePath = { path: item.path, kind: item.kind, family: item.family, why: item.why || "" };
      state.mood = item.mood;
      state.start = item.start;
      state.pdfPreview = false;
      setScreen("path");
    });
  });
  document.getElementById("toMap").addEventListener("click", () => {
    state.pdfPreview = false;
    if (!state.start) setScreen("mood");
    else {
      loadPaths();
      setScreen("map");
    }
  });
  document.getElementById("resetSong").addEventListener("click", () => {
    SONG_SLOTS.forEach((s) => (state.song[s.id] = null));
    state.pdfPreview = false;
    renderSong();
  });
  document.getElementById("saveSong")?.addEventListener("click", () => {
    if (!filled.length) {
      flashSaveStatus("Сначала добавьте хотя бы один ход в форму.");
      return;
    }
    if (typeof LadTheory !== "undefined" && LadTheory.saveSongState(state.song)) {
      flashSaveStatus(
        "Сохранено на этом устройстве. Откройте вкладку «Дорожка» — дорожка подтянется здесь же в браузере."
      );
      // refresh banner/note without wiping status: re-render then restore message
      const msg =
        "Сохранено на этом устройстве. Откройте вкладку «Дорожка» — дорожка подтянется здесь же в браузере.";
      renderSong();
      const el = document.getElementById("songSaveStatus");
      if (el) {
        el.hidden = false;
        el.textContent = msg;
      }
    } else {
      flashSaveStatus("Не удалось сохранить. Нужен Лад+ и хотя бы одна заполненная часть.");
    }
  });
  document.getElementById("exportPdf")?.addEventListener("click", () => {
    if (plus && typeof exportSongToPdf === "function") {
      exportSongToPdf();
      return;
    }
    state.pdfPreview = true;
    renderSong();
    document.getElementById("pdfPreview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("exportPdfReal")?.addEventListener("click", () => {
    if (plus && typeof exportSongToPdf === "function") exportSongToPdf();
    else openLadPlus("song");
  });
  document.getElementById("closePdfPreview")?.addEventListener("click", () => {
    state.pdfPreview = false;
    renderSong();
  });
}

function renderPdfPreviewBlock(filledSlots) {
  const lines = filledSlots
    .map((slot) => {
      const item = state.song[slot.id];
      const pass =
        typeof LadTheory !== "undefined"
          ? LadTheory.passportForPdf(item, { moodId: item.mood, start: item.start })
          : { degrees: "", functions: "", modeLine: "", summary: "" };
      return `
        <h3>${slot.title}</h3>
        <p><strong>${item.path.join(" → ")}</strong></p>
        <p>Ступени: ${pass.degrees || "—"}</p>
        <p>${pass.functions || ""}</p>
        <p>${pass.modeLine || ""}</p>
        <p>${pass.summary || item.why || ""}</p>
        ${pass.cadence ? `<p>Каденция: ${pass.cadence}</p>` : ""}
        <p>Аппликатуры — на листе под каждым созвучием (как в рабочей выгрузке).</p>`;
    })
    .join("");

  const plus = hasPlus();
  return `
    <div class="pdf-preview-frame" id="pdfPreview">
      <h3>Лист песни — вид как после оплаты</h3>
      <p>Лад · дорожка · гармонический комментарий · аппликатуры</p>
      ${lines}
      <div class="pdf-preview-actions actions">
        ${
          plus
            ? `<button type="button" class="btn btn-glow" id="exportPdfReal">Скачать PDF</button>`
            : `<button type="button" class="btn btn-glow" data-open-lad-plus>Скачивание и сохранение — в Лад+</button>`
        }
        <button type="button" class="btn btn-ghost" id="closePdfPreview">Закрыть предпросмотр</button>
      </div>
    </div>`;
}

btnBack.addEventListener("click", goBack);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const nav = tab.dataset.nav;
    if (nav === "mood") setScreen("mood");
    else if (nav === "map") {
      // Always land on the map page (gate if mood/start missing)
      if (state.mood && state.start) loadPaths();
      setScreen("map");
    } else if (nav === "song") setScreen("song");
  });
});

document.querySelectorAll("[data-instrument]").forEach((btn) => {
  btn.addEventListener("click", () => {
    // audio.js handles sound; refresh fingerings for guitar/piano
    setTimeout(() => {
      if (state.screen === "path") renderPath();
      else if (state.screen === "discover") renderDiscover();
      else if (state.screen === "degrees") renderDegrees();
      else if (state.screen === "song") {
        if (typeof refreshAllPathDiagrams === "function") refreshAllPathDiagrams();
        else renderSong();
      }
    }, 0);
  });
});

restoreSavedSong();
bindVoiceDelegation();
setScreen("mood");
