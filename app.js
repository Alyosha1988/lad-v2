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
  mapFocus: null,
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
  document.body.classList.toggle("is-mood-home", name === "mood");
  render();
}

function goBack() {
  if (state.screen === "start") setScreen("mood");
  else if (state.screen === "map") setScreen(state.start ? "start" : "mood");
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
    <section class="hero-sketch">
      <div class="hero-copy">
        <h1 class="h1 brand-hero">Лад</h1>
        <p class="eyebrow">музыка в твоём ритме</p>
        <p class="hand">Исследуй связи между аккордами. Собирай гармоничные пути.</p>
      </div>
      <figure class="hero-art">
        <img src="icons/map_topo_night.jpg" alt="" />
      </figure>
    </section>

    <p class="section-title">Моя <span>Mood-Room</span></p>
    <p class="section-hand">выбери оттенок — он окрасит карту и дорожку</p>

    <div class="mood-orbit">
      ${V2_MOODS.map(
        (m) => `
        <button type="button" class="mood-card" data-mood="${m.id}">
          <span class="ring"><img src="icons/moods/${m.id}.jpg" alt="" /></span>
          <span class="title">${m.title}</span>
          <span class="desc">${m.desc}</span>
        </button>`
      ).join("")}
    </div>

    <button type="button" class="ink-banner" id="toSongBanner">
      <span class="mark">✦</span>
      <span>
        <span class="title">Твой Лад</span>
        <span class="sub">ходы, плейлисты и заметки</span>
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
}

function renderStart() {
  const mood = moodById(state.mood);
  stage.innerHTML = `
    <p class="kicker">Точка входа</p>
    <h1 class="h1">${mood?.title || ""}</h1>
    <p class="hand-note">выбери тонику — она станет сердцем карты</p>
    <div class="chip-row">
      <button type="button" class="chip chip-btn" id="changeMood">${mood?.title || ""} ▾</button>
    </div>
    <div class="chord-grid">
      ${START_CHORDS.map(
        (c) => `<button type="button" class="chord-pick" data-chord="${c}">${c}</button>`
      ).join("")}
    </div>
  `;
  document.getElementById("changeMood")?.addEventListener("click", () => setScreen("mood"));
  stage.querySelectorAll("[data-chord]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.start = btn.dataset.chord;
      state.mapFocus = null;
      loadPaths();
      setScreen("map");
    });
  });
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
  if (/каденц|доминант|v7|напряж/.test(blob)) return "напряжение к тонике";
  if (/спуск|нисход|пада|fall|andalus/.test(blob)) return "спуск";
  if (/bossa|ii.?v|джаз|септ/.test(blob)) return "мягкое движение";
  if (/припев|pop|i–v–vi|i-v-vi|узнаваем/.test(blob)) return "припевный свет";
  if (/мягк|iii|относительно|лирик/.test(blob)) return "мягкое движение";
  if (/напряж|twist|остр|конфликт/.test(blob)) return "напряжение";
  if (state.mood === "dark") return "спуск";
  if (state.mood === "tense") return "напряжение";
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
          <text x="140" y="94" text-anchor="middle" font-size="14" font-family="Georgia,serif" fill="#f7e7d0">${mood ? "·" : "?"}</text>
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
        <p class="map-lead soft">Сначала выбери настроение — карта окрасит связи.</p>
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
  const vb = 380;
  const cx = 190;
  const cy = 195;
  const rOuter = 128;
  const rHub = 48;
  // Prefer mockup-like angles: TL, TR, MR, BR, BL
  const preferred = [-2.4, -0.75, 0.35, 1.35, 2.55];

  const rays = nodes
    .map((node, i) => {
      const angle = preferred[i] ?? -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + Math.cos(angle) * rOuter;
      const y = cy + Math.sin(angle) * rOuter;
      const mx = cx + Math.cos(angle) * (rHub + (rOuter - rHub) * 0.48);
      const my = cy + Math.sin(angle) * (rHub + (rOuter - rHub) * 0.48);
      const tx = mx + Math.cos(angle + Math.PI / 2) * 10;
      const ty = my + Math.sin(angle + Math.PI / 2) * 10;
      return `
        <g class="nmap-ray" data-path-idx="${node.pathIdx}" role="button" tabindex="0" aria-label="${node.chord}">
          <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="nmap-line"/>
          <text x="${tx}" y="${ty}" text-anchor="middle" class="nmap-edge">${node.edge}</text>
          <circle cx="${x}" cy="${y}" r="30" class="nmap-node-glow"/>
          <circle cx="${x}" cy="${y}" r="24" class="nmap-node"/>
          <image href="icons/map_node_landscape.png" x="${x - 11}" y="${y - 18}" width="22" height="22" preserveAspectRatio="xMidYMid slice"/>
          <text x="${x}" y="${y + 12}" text-anchor="middle" class="nmap-chord">${node.chord}</text>
          <text x="${x}" y="${y + 38}" text-anchor="middle" class="nmap-deg">${node.degree}</text>
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

  stage.innerHTML = `
    <div class="map-top">
      <div class="map-hero-copy">
        <h1 class="map-title">Карта лада</h1>
        <p class="map-lead">Исследуй связи между аккордами. Собирай гармоничные пути.</p>
      </div>
      <button type="button" class="mood-pill" id="mapMood">${mood?.title || ""} ▾</button>
    </div>

    <div class="nmap-board">
      ${renderNightMapSvg(nodes, state.start)}
    </div>

    <article class="map-info-card">
      <span class="map-info-mark" aria-hidden="true">✦</span>
      <div>
        <h2 class="map-info-title">${focus ? focus.kind : flavor.title}</h2>
        <p class="map-info-text">${focus ? focus.why : flavor.text}</p>
      </div>
      <button type="button" class="map-info-more" id="mapDetails">${focus ? "К ходу ›" : "Подробнее ›"}</button>
    </article>

    <button type="button" class="btn btn-glow btn-block" id="toSong">
      <span aria-hidden="true">✦</span> Собрать в дорожку <span aria-hidden="true">→</span>
    </button>

    ${
      focus
        ? `<p class="map-focus-route">${focus.path.join(" → ")}</p>`
        : `<p class="map-focus-route soft">Нажми узел — откроется связь и ход</p>`
    }
  `;

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
  stage.innerHTML = `
    <p class="kicker">Ход</p>
    <h1 class="h1">${p.path.join(" → ")}</h1>
    <p class="hand-note">${p.family} · ${p.kind}</p>
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
    <div class="actions">
      <button type="button" class="btn btn-glow btn-block" id="pathToSong">
        <span aria-hidden="true">✦</span> Собрать в дорожку <span aria-hidden="true">→</span>
      </button>
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
  document.getElementById("pathToSong").addEventListener("click", () => setScreen("song"));
}

function renderSong() {
  const mood = moodById(state.mood);
  const filled = SONG_SLOTS.filter((s) => state.song[s.id]);
  stage.innerHTML = `
    <p class="kicker">Дорожка песни</p>
    <h1 class="h1">Соберите форму</h1>
    <p class="hand-note">аппликатуры и ▶ прямо в частях · инструмент сверху</p>
    <div class="chip-row">
      ${mood ? `<span class="chip">${mood.title}</span>` : ""}
      ${state.start ? `<span class="chip">старт ${state.start}</span>` : ""}
      <span class="chip">${filled.length} / ${SONG_SLOTS.length}</span>
    </div>
    <div class="song-list">
      ${SONG_SLOTS.map((slot) => {
        const item = state.song[slot.id];
        if (!item) {
          return `
            <div class="song-part is-empty">
              <p class="label">${slot.title}</p>
              <p class="route">пока пусто</p>
              <p class="meta">выбери ход на карте и отправь сюда</p>
            </div>`;
        }
        const moodTitle = moodById(item.mood)?.title || "";
        return `
          <div class="song-part">
            <p class="label">${slot.title}</p>
            <p class="route">${item.path.join(" → ")}</p>
            <p class="meta">${moodTitle} · ${item.family}</p>
            ${renderPathDiagrams(item.path)}
            <div class="actions">
              <button type="button" class="btn btn-ghost" data-open-slot="${slot.id}">Открыть ход</button>
              <button type="button" class="btn btn-ghost" data-clear-slot="${slot.id}">Убрать</button>
            </div>
          </div>`;
      }).join("")}
    </div>
    <div class="actions">
      <button type="button" class="btn btn-glow" id="exportPdf" ${filled.length ? "" : "disabled"}>
        Выгрузить PDF
      </button>
      <button type="button" class="btn btn-primary" id="toMap">К карте</button>
      <button type="button" class="btn btn-ghost" id="resetSong">Очистить</button>
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
  document.getElementById("exportPdf")?.addEventListener("click", () => {
    if (typeof exportSongToPdf === "function") exportSongToPdf();
  });
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
      else if (state.screen === "song") {
        if (typeof refreshAllPathDiagrams === "function") refreshAllPathDiagrams();
        else renderSong();
      }
    }, 0);
  });
});

setScreen("mood");
