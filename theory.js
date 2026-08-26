/**
 * Лад — гармонический слой и доступ Лад+
 * Профессиональный русский язык; ступени — только заглавные римские.
 */
(function (global) {
  const LAD_PLUS_KEY = "lad-plus";
  const SONG_SAVE_KEY = "lad-song-v2";
  const FREE_PATH_LIMIT = 3;

  const GLOSSARY = {
    тоника: "Устойчивый тональный центр лада; точка покоя гармонии.",
    субдоминанта: "Функция IV (и родственных) ступени; уводит от тоники, готовит доминанту или плагальное возвращение.",
    доминанта: "Функция V ступени; создаёт тяготение к тонике и оформляет автентическую каденцию.",
    лад: "Система звуковысотных отношений вокруг тонального центра (ионийский, эолийский, дорийский и др.).",
    каденция: "Завершающий гармонический оборот, закрепляющий или ослабляющий тональный центр.",
    отклонение: "Краткий уход в побочную тональность без полной модуляции.",
    заимствование: "Аккорд из параллельного мажора/минора или иного лада при сохранении центра.",
    голосоведение: "Логика движения голосов между созвучиями; на грифе — малый сдвиг аппликатуры.",
    аппликатура: "Расположение пальцев на грифе (или клавиатуре) для данного созвучия.",
    "тональный центр": "Звук и трезвучие, к которым тяготеет гармоническое движение.",
  };

  /** Поэтический оттенок → ладовая опора (полная глубина). */
  const MOOD_MODE = {
    bright: {
      modeLine: "Ионийский лад · мажорная диатоника",
      modes: ["ионийский", "лидийский"],
      note: "Ясный тональный центр, автентика и плагальность без затемнения.",
    },
    dark: {
      modeLine: "Эолийский / гармонический минор",
      modes: ["эолийский", "гармонический минор", "мелодия минор"],
      note: "Минорный центр; возможны VII натуральная и VII гармоническая (доминанта).",
    },
    tense: {
      modeLine: "Фригийский · доминантовые цепочки · альтерации",
      modes: ["фригийский", "гармонический минор", "сверхдоминантовые обороты"],
      note: "Усиленное тяготение, альтерированные доминанты, острые разрешения.",
    },
    dream: {
      modeLine: "Лидийский / миксолидийский · плавающая модальность",
      modes: ["лидийский", "миксолидийский", "дорийский"],
      note: "Ослабленная функциональность, септаккорды, мягкие каденции.",
    },
    pulse: {
      modeLine: "Дорийский лад · риффовая модальность",
      modes: ["дорийский", "миксолидийский"],
      note: "Устойчивый модальный грув; VI мажорная в миноре даёт «открытый» минор.",
    },
    groovy: {
      modeLine: "Дорийский / миксолидийский · блюзовая диатоника",
      modes: ["дорийский", "миксолидийский", "блюзовый лад"],
      note: "Повтор, рифф, доминантовые краски на I и IV.",
    },
  };

  const EDGE_THEORY = {
    "к тонике": "Доминантовое или автентическое тяготение к тональному центру.",
    спуск: "Нисходящее движение баса / плагальный или фригийский спуск.",
    мягко: "Слабое функциональное трение; медианты и относительные обороты.",
    припев: "Яркий диатонический оборот с узнаваемой каденционной рамкой.",
    острее: "Альтерация, вторичная доминанта или модальное заимствование.",
    пульс: "Модальный рифф; центр держится повтором, а не только каденцией.",
    дымка: "Лидийская / миксолидийская окраска, размытое тяготение.",
    ход: "Гармоническое продвижение относительно избранной тоники.",
  };

  function hasLadPlus() {
    try {
      return localStorage.getItem(LAD_PLUS_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function setLadPlus(on) {
    try {
      if (on) localStorage.setItem(LAD_PLUS_KEY, "1");
      else localStorage.removeItem(LAD_PLUS_KEY);
    } catch (_) {}
  }

  /** Демо-доступ для просмотра Лад+ до кассы. */
  function enableLadPlusPreview() {
    setLadPlus(true);
  }

  function freePathLimit() {
    return FREE_PATH_LIMIT;
  }

  function upperRomans(text) {
    if (!text) return "";
    return String(text)
      .replace(/\b(b?)([ivx]+)\b/gi, (_, flat, rom) => `${flat || ""}${rom.toUpperCase()}`)
      .replace(/–/g, "–");
  }

  function moodModeInfo(moodId) {
    return MOOD_MODE[moodId] || MOOD_MODE.dark;
  }

  function edgeTheory(label) {
    return EDGE_THEORY[label] || EDGE_THEORY["ход"];
  }

  function guessDegrees(pathIdea) {
    const kind = upperRomans(pathIdea?.kind || pathIdea?.family || "");
    const m = kind.match(/([b#]?[IVX]+(?:maj7|m7|m|7|sus4|dim|ø)?(?:[–\-\/][b#]?[IVX]+(?:maj7|m7|m|7|sus4|dim|ø)?)*)/i);
    if (m) return upperRomans(m[1].replace(/-/g, "–").replace(/\//g, "–"));
    const n = (pathIdea?.path || []).length;
    if (n === 3) return "I–IV–V";
    if (n === 4) return "I–V–VI–IV";
    return "I–…";
  }

  function guessFunctions(degrees, moodId) {
    const d = degrees.toUpperCase();
    if (/V/.test(d) && /I/.test(d)) return "Тоника → доминанта (автентическое тяготение)";
    if (/IV/.test(d) && /I/.test(d) && !/V/.test(d)) return "Плагальное движение (субдоминанта → тоника)";
    if (/II/.test(d) && /V/.test(d)) return "Субдоминантовая подготовка → доминанта (оборот II–V)";
    if (moodId === "dark" || moodId === "tense") return "Минорный план с усиленным тяготением";
    if (moodId === "dream" || moodId === "pulse" || moodId === "groovy") return "Модальный план; функция мягче диатоники";
    return "Диатоническое развёртывание вокруг тоники";
  }

  function guessCadence(degrees, pathIdea) {
    const blob = `${degrees} ${pathIdea?.kind || ""} ${pathIdea?.why || ""}`.toLowerCase();
    if (/v7|доминант|каденц|auth/.test(blob) || /V/.test(degrees)) return "Автентическая каденция (V→I) или её подготовка";
    if (/плаг|iv–i|amen|gospel/.test(blob)) return "Плагальная каденция (IV→I)";
    if (/half|половин/.test(blob)) return "Половинная каденция (остановка на доминанте)";
    return "Открытый оборот без жёсткого каденционного закрепления";
  }

  function voiceLeadingNote(pathIdea) {
    if (pathIdea?.fit != null && pathIdea.fit < 3) {
      return "Аппликатуры подобраны с малым сдвигом руки — голосоведение на грифе остаётся связным.";
    }
    return "Следите за общим тоном и ближайшими позициями: так сохраняется связность голосоведения.";
  }

  /**
   * Гармонический паспорт хода.
   * level brief = I–II (всем); full = III (Лад+).
   */
  function buildPassport(pathIdea, opts = {}) {
    const moodId = opts.moodId || "dark";
    const start = opts.start || pathIdea?.path?.[0] || "I";
    const mode = moodModeInfo(moodId);
    const degrees = guessDegrees(pathIdea);
    const functions = guessFunctions(degrees, moodId);
    const cadence = guessCadence(degrees, pathIdea);
    const brief = {
      degrees,
      functions,
      modeLine: mode.modeLine,
      center: `Тональный центр: ${start}`,
      summary:
        pathIdea?.why ||
        `Оборот ${degrees} в ладовой опоре «${mode.modeLine}».`,
    };
    const full = {
      ...brief,
      cadence,
      modes: mode.modes,
      modeNote: mode.note,
      voiceLeading: voiceLeadingNote(pathIdea),
      family: pathIdea?.family || "",
      kind: upperRomans(pathIdea?.kind || ""),
      alternatives:
        "Родственные обороты: замена медианты, плагальный ответ IV–I, вторичная доминанта к V, модальное заимствование bVII / bVI.",
      glossaryHints: ["тоника", "доминанта", "каденция", "лад"],
    };
    return { brief, full };
  }

  function renderPassportHtml(passport, opts = {}) {
    const plus = hasLadPlus();
    const wantFull = opts.forceFull || plus;
    const brief = passport.brief;
    const full = passport.full;
    const showTeaser = !wantFull;

    let html = `
      <section class="theory-passport">
        <p class="theory-kicker">Гармонический паспорт</p>
        <p class="theory-degrees">${escapeHtml(brief.degrees)}</p>
        <p class="theory-line"><strong>Функции.</strong> ${escapeHtml(brief.functions)}</p>
        <p class="theory-line"><strong>Лад.</strong> ${escapeHtml(brief.modeLine)}</p>
        <p class="theory-line">${escapeHtml(brief.center)}</p>
        <p class="theory-summary">${escapeHtml(brief.summary)}</p>`;

    if (wantFull) {
      html += `
        <p class="theory-line"><strong>Каденция.</strong> ${escapeHtml(full.cadence)}</p>
        <p class="theory-line"><strong>Ладовая глубина.</strong> ${escapeHtml(full.modes.join(" · "))}. ${escapeHtml(full.modeNote)}</p>
        <p class="theory-line"><strong>Голосоведение.</strong> ${escapeHtml(full.voiceLeading)}</p>
        <p class="theory-line"><strong>Родственные обороты.</strong> ${escapeHtml(full.alternatives)}</p>`;
    } else if (showTeaser) {
      html += `
        <div class="theory-lock">
          <p>Полный разбор: каденция, ладовая глубина и родственные обороты — в <strong>Лад+</strong>.</p>
          <button type="button" class="btn btn-glow btn-tiny" data-open-lad-plus>Открыть Лад+</button>
        </div>`;
    }

    html += `</section>`;
    return html;
  }

  function renderMoodModeLine(moodId) {
    const m = moodModeInfo(moodId);
    return `<p class="mood-mode-line">${escapeHtml(m.modeLine)}</p>`;
  }

  function renderCenterCard(symbol, moodId) {
    const mode = moodModeInfo(moodId || "bright");
    const isMinor = /m(?!aj)/i.test(symbol) || /dim|ø|m7b5/i.test(symbol);
    const role = isMinor
      ? "Минорный тональный центр (эолийская / гармоническая опора)."
      : "Мажорный тональный центр (ионийская опора).";
    return `
      <section class="theory-passport theory-center">
        <p class="theory-kicker">Тональный центр</p>
        <p class="theory-degrees">${escapeHtml(symbol)}</p>
        <p class="theory-line">${escapeHtml(role)}</p>
        <p class="theory-line"><strong>Лад.</strong> ${escapeHtml(mode.modeLine)}</p>
        <p class="theory-summary">${escapeHtml(mode.note)}</p>
      </section>`;
  }

  function renderLadPlusScreen(opts = {}) {
    const plus = hasLadPlus();
    const variant = opts.variant || "night"; // night | paper
    return `
      <section class="lad-plus-screen ${variant === "paper" ? "is-paper" : ""}">
        <p class="kicker">Лад+</p>
        <h1 class="h1">Расширенный гармонический доступ</h1>
        <p class="hand-note">Полные разборы, сохранение дорожки и выгрузка листа с аппликатурами и ступенями.</p>

        <ul class="lad-plus-list">
          <li>Полный гармонический паспорт хода (каденция, ладовая глубина, родственные обороты)</li>
          <li>Все ходы в режиме «Быстрый» (без лимита в три позиции)</li>
          <li>Сохранение дорожки песни</li>
          <li>Выгрузка PDF: форма, ступени, аппликатуры, гармонический комментарий</li>
          <li>Превью листа уже сейчас выглядит как после оплаты</li>
        </ul>

        <div class="lad-plus-prices">
          <div class="lad-plus-price">
            <p class="label">Лист одной песни</p>
            <p class="sum">99–149 ₽</p>
          </div>
          <div class="lad-plus-price is-main">
            <p class="label">Лад+ навсегда</p>
            <p class="sum">990–1490 ₽</p>
          </div>
        </div>

        <p class="theory-summary">Оплата будет через ЮKassa и СБП. Сейчас можно открыть демо-доступ и увидеть весь функционал.</p>

        <div class="actions">
          ${
            plus
              ? `<button type="button" class="btn btn-primary" data-lad-plus-done>Демо-доступ включён — продолжить</button>
                 <button type="button" class="btn btn-ghost" data-lad-plus-off>Сбросить демо-доступ</button>`
              : `<button type="button" class="btn btn-glow" data-lad-plus-demo>Включить демо-доступ Лад+</button>
                 <button type="button" class="btn btn-primary" data-lad-plus-pay disabled title="Касса будет подключена позже">Оплатить Лад+ (скоро)</button>`
          }
          <button type="button" class="btn btn-ghost" data-lad-plus-back>Назад</button>
        </div>
      </section>`;
  }

  function bindLadPlusScreen(root, hooks = {}) {
    root.querySelector("[data-lad-plus-demo]")?.addEventListener("click", () => {
      enableLadPlusPreview();
      hooks.onChange?.();
    });
    root.querySelector("[data-lad-plus-off]")?.addEventListener("click", () => {
      setLadPlus(false);
      hooks.onChange?.();
    });
    root.querySelector("[data-lad-plus-done]")?.addEventListener("click", () => hooks.onBack?.());
    root.querySelector("[data-lad-plus-back]")?.addEventListener("click", () => hooks.onBack?.());
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function saveSongState(song) {
    if (!hasLadPlus()) return false;
    try {
      localStorage.setItem(SONG_SAVE_KEY, JSON.stringify(song));
      return true;
    } catch (_) {
      return false;
    }
  }

  function loadSongState() {
    try {
      const raw = localStorage.getItem(SONG_SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function passportForPdf(pathIdea, opts) {
    const p = buildPassport(pathIdea, opts);
    const use = hasLadPlus() ? p.full : p.brief;
    return {
      degrees: use.degrees,
      functions: use.functions,
      modeLine: use.modeLine,
      summary: use.summary,
      cadence: use.cadence || "",
      locked: !hasLadPlus(),
    };
  }

  global.LadTheory = {
    GLOSSARY,
    FREE_PATH_LIMIT,
    hasLadPlus,
    setLadPlus,
    enableLadPlusPreview,
    freePathLimit,
    upperRomans,
    moodModeInfo,
    edgeTheory,
    buildPassport,
    renderPassportHtml,
    renderMoodModeLine,
    renderCenterCard,
    renderLadPlusScreen,
    bindLadPlusScreen,
    saveSongState,
    loadSongState,
    passportForPdf,
  };
})(typeof window !== "undefined" ? window : globalThis);
