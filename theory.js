/**
 * Лад — гармонический слой и доступ Лад+
 * Профессиональный русский язык; ступени — только заглавные римские.
 */
(function (global) {
  const LAD_PLUS_KEY = "lad-plus";
  const SONG_SAVE_KEY = "lad-song-v2";
  const FREE_PATH_LIMIT = 3;


  const VOICE_KEY = "lad-voice"; // plain | pro

  /** Словарь: term, plain (для новичка), pro (как у музыкантов). */
  const GLOSSARY_ENTRIES = [
    {
      id: "tonica",
      term: "Тоника",
      aliases: ["тональный центр", "дом"],
      plain: "Аккорд «дома» — куда гармония хочет вернуться, чтобы фраза ощущалась законченной.",
      pro: "Устойчивый тональный центр лада; точка покоя гармонического движения.",
    },
    {
      id: "dominant",
      term: "Доминанта",
      aliases: ["V", "пятая ступень"],
      plain: "Аккорд, который «тянет» обратно к дому. После него хочется услышать тонику.",
      pro: "Функция V ступени; создаёт тяготение к тонике и оформляет автентическую каденцию.",
    },
    {
      id: "subdominant",
      term: "Субдоминанта",
      aliases: ["IV", "четвёртая ступень"],
      plain: "Шаг в сторону от дома: уводит вглубь фразы, часто готовит возврат или доминанту.",
      pro: "Функция IV (и родственных) ступени; уводит от тоники, готовит доминанту или плагальное возвращение.",
    },
    {
      id: "lad",
      term: "Лад",
      aliases: ["модальность", "mode"],
      plain: "«Характер» звукоряда вокруг выбранного центра — светлый, тёмный, острый, дымчатый.",
      pro: "Система звуковысотных отношений вокруг тонального центра (ионийский, эолийский, дорийский и др.).",
    },
    {
      id: "step",
      term: "Ступень",
      aliases: ["римские цифры", "I", "V"],
      plain: "Место аккорда относительно дома. I — дом, IV — шаг в сторону, V — тяга назад.",
      pro: "Порядковый номер звука/аккорда в ладу; в Лад обозначается заглавными римскими цифрами.",
    },
    {
      id: "flat-degree",
      term: "b перед ступенью",
      aliases: ["bVII", "bIII", "bVI", "бемоль", "flat", "♭"],
      plain: "Буква b = бемоль: ступень взята на полтона ниже обычной. Пример: при доме Dm аккорд C — это bVII (не «обычная» VII от D-мажора).",
      pro: "Префикс b (♭) означает понижение ступени на полутон относительно мажорной диатоники от тоники; типичны bVII, bVI, bIII в миноре и в заимствованиях.",
    },
    {
      id: "cadence",
      term: "Каденция",
      aliases: ["каденц", "завершение"],
      plain: "Финал хода — как точка или многоточие в конце предложения.",
      pro: "Завершающий гармонический оборот, закрепляющий или ослабляющий тональный центр.",
    },
    {
      id: "auth",
      term: "Автентическая каденция",
      aliases: ["V→I", "автентика"],
      plain: "Сильное «вопрос → ответ»: напряжение доминанты разрешается в дом.",
      pro: "Каденция V→I (или её подготовка); наиболее устойчивое закрепление тоники.",
    },
    {
      id: "plagal",
      term: "Плагальная каденция",
      aliases: ["IV→I", "amen", "плагальность"],
      plain: "Мягкое возвращение домой без острого рывка — как «аминь» в госпеле.",
      pro: "Каденция IV→I; плагальное закрепление тоники без доминантового тяготения.",
    },
    {
      id: "voice",
      term: "Голосоведение",
      aliases: ["связь аккордов", "малый сдвиг"],
      plain: "Насколько удобно перейти пальцами с аккорда на аккорд: мало лишних прыжков — ход «поётся» сам.",
      pro: "Логика движения голосов между созвучиями; на грифе — малый сдвиг аппликатуры.",
    },
    {
      id: "fingering",
      term: "Аппликатура",
      aliases: ["расстановка пальцев", "griф", "форма"],
      plain: "Как именно лечь рукой на гриф или клавиши, чтобы взять созвучие.",
      pro: "Расположение пальцев на грифе (или клавиатуре) для данного созвучия.",
    },
    {
      id: "triad",
      term: "Трезвучие",
      aliases: ["аккорд из трёх"],
      plain: "Базовое созвучие из трёх звуков — «скелет» большинства песенных аккордов.",
      pro: "Созвучие из трёх тонов (прима, терция, квинта); основа терцовой гармонии.",
    },
    {
      id: "seventh",
      term: "Септаккорд",
      aliases: ["септ", "7", "maj7", "m7"],
      plain: "Аккорд с «добавленным» четвёртым звуком — звучит сочнее, джазовее или блюзовее.",
      pro: "Четырёхзвучие с септимой; расширяет функцию трезвучия (доминантсептаккорд, maj7, m7 и др.).",
    },
    {
      id: "borrow",
      term: "Заимствование",
      aliases: ["bVII", "bVI", "parallel"],
      plain: "Аккорд «из соседней краски» — чуть неожиданный поворот при том же доме.",
      pro: "Аккорд из параллельного мажора/минора или иного лада при сохранении центра.",
    },
    {
      id: "modulation",
      term: "Модуляция",
      aliases: ["смена тональности", "отклонение"],
      plain: "Переезд в другой «дом». Короткий визит — отклонение; полный переезд — модуляция.",
      pro: "Смена тонального центра. Отклонение — краткий уход без закрепления новой тоники.",
    },
    {
      id: "ionian",
      term: "Ионийский",
      aliases: ["мажор", "ionian"],
      plain: "Светлый знакомый мажор — ясно, открыто, «как в поп-песне».",
      pro: "Натуральный мажорный лад; диатоника с устойчивой автентикой и плагальностью.",
    },
    {
      id: "aeolian",
      term: "Эолийский",
      aliases: ["натуральный минор", "aeolian"],
      plain: "Натуральный минор — тише и замкнутее, без обязательной «острой» доминанты.",
      pro: "Натуральный минорный лад; VII ступень натуральная, без гармонического повышения.",
    },
    {
      id: "dorian",
      term: "Дорийский",
      aliases: ["dorian"],
      plain: "Минор с «открытым» оттенком — часто для грува, риффа, соула.",
      pro: "Минорный лад с мажорной VI; типичная опора модального грува.",
    },
    {
      id: "phrygian",
      term: "Фригийский",
      aliases: ["phrygian"],
      plain: "Острый, «испанский» или напряжённый минорный оттенок.",
      pro: "Минорный лад с малой II; сильное фригийское тяготение и острые краски.",
    },
    {
      id: "lydian",
      term: "Лидийский",
      aliases: ["lydian"],
      plain: "Светлый мажор с лёгкой «парящей» странностью — мечтательность, дымка.",
      pro: "Мажорный лад с повышенной IV; ослабленная субдоминанта, парящая модальность.",
    },
    {
      id: "mixo",
      term: "Миксолидийский",
      aliases: ["mixolydian", "доминантный лад"],
      plain: "Мажор с мягкой «блюзовой» тенью — хорошо для рока и риффов.",
      pro: "Мажорный лад с малой VII; доминантовая окраска на тонике.",
    },
    {
      id: "alter",
      term: "Альтерация",
      aliases: ["alt", "альтерированный"],
      plain: "Звук чуть «сдвинули» вверх или вниз — появляется острота и желание разрешиться.",
      pro: "Хроматическое изменение ступени; усиливает тяготение или краску аккорда.",
    },
    {
      id: "mediant",
      term: "Медианта",
      aliases: ["III", "VI", "относительный"],
      plain: "Сосед дома «через родство» — мягкий поворот без жёсткого напряжения.",
      pro: "III или VI ступень; медиантовые отношения часто дают лирический оборот.",
    },
    {
      id: "riff",
      term: "Рифф",
      aliases: ["повтор", "петля"],
      plain: "Короткая узнаваемая петля аккордов или фигур, которая держит пульс песни.",
      pro: "Остинатный гармонический или мелодический оборот; опора модального грува.",
    },
    {
      id: "barre",
      term: "Барре",
      aliases: ["barre", "зажим"],
      plain: "Один палец зажимает несколько струн сразу — так берутся «переносные» формы.",
      pro: "Приём: указательный палец закрывает лад на нескольких струнах; основа барре-форм.",
    },
    {
      id: "progression",
      term: "Ход / последовательность",
      aliases: ["прогрессия", "оборот", "path"],
      plain: "Цепочка аккордов, которая ведёт фразу: откуда вышли → куда пришли.",
      pro: "Гармоническая последовательность (progressions); оборот относительно избранной тоники.",
    },
    {
      id: "function",
      term: "Функция",
      aliases: ["функциональность"],
      plain: "Роль аккорда в истории фразы: дом, шаг в сторону или тяга назад.",
      pro: "Гармоническая роль созвучия (тоника / субдоминанта / доминанта и производные).",
    },
  ];

  // обратная совместимость со старым плоским словарём
  const GLOSSARY = Object.fromEntries(
    GLOSSARY_ENTRIES.map((e) => [e.term.toLowerCase(), e.pro])
  );

  function getVoice() {
    try {
      const v = localStorage.getItem(VOICE_KEY);
      // A+D: по умолчанию — простыми словами
      return v === "pro" ? "pro" : "plain";
    } catch (_) {
      return "plain";
    }
  }

  function setVoice(voice) {
    try {
      localStorage.setItem(VOICE_KEY, voice === "plain" ? "plain" : "pro");
    } catch (_) {}
  }

  function findGlossaryEntry(query) {
    if (!query) return null;
    const q = String(query).trim().toLowerCase();
    return (
      GLOSSARY_ENTRIES.find(
        (e) =>
          e.term.toLowerCase() === q ||
          e.id === q ||
          (e.aliases || []).some((a) => a.toLowerCase() === q)
      ) ||
      GLOSSARY_ENTRIES.find(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          (e.aliases || []).some((a) => a.toLowerCase().includes(q))
      ) ||
      null
    );
  }

  function glossaryText(entry, voice) {
    if (!entry) return "";
    const mode = voice || getVoice();
    return mode === "plain" ? entry.plain : entry.pro;
  }

  function filterGlossary(query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return GLOSSARY_ENTRIES.slice();
    return GLOSSARY_ENTRIES.filter((e) => {
      const bag = [e.term, e.plain, e.pro, ...(e.aliases || [])].join(" ").toLowerCase();
      return bag.includes(q);
    });
  }

  function renderGlossaryScreen(opts = {}) {
    const voice = getVoice();
    const q = opts.query || "";
    const list = filterGlossary(q);
    const variant = opts.variant || "night";
    const focus = opts.focusId ? findGlossaryEntry(opts.focusId) : null;
    return `
      <section class="glossary-screen ${variant === "paper" ? "is-paper" : ""}">
        <p class="kicker">Словарь</p>
        <h1 class="h1">Слова гармонии</h1>
        <p class="hand-note">По умолчанию — простыми словами: зачем ход работает. Теория — в карточках и по тапу. Можно включить голос музыканта.</p>

        <div class="voice-toggle" role="group" aria-label="Голос комментариев">
          <button type="button" class="chip chip-btn ${voice === "plain" ? "is-on" : ""}" data-voice="plain">Простыми словами</button>
          <button type="button" class="chip chip-btn ${voice === "pro" ? "is-on" : ""}" data-voice="pro">Как у музыкантов</button>
        </div>

        <label class="glossary-search">
          <span class="sr-only">Поиск</span>
          <input type="search" id="glossaryQuery" placeholder="Найти: тоника, лад, каденция…" value="${escapeHtml(q)}" />
        </label>

        ${
          focus
            ? `<article class="glossary-card is-focus" data-term-id="${focus.id}">
                <h2>${escapeHtml(focus.term)}</h2>
                <p class="glossary-plain"><strong>Простыми словами.</strong> ${escapeHtml(focus.plain)}</p>
                <p class="glossary-pro"><strong>Как у музыкантов.</strong> ${escapeHtml(focus.pro)}</p>
              </article>`
            : ""
        }

        <div class="glossary-list">
          ${list
            .map(
              (e) => `
            <article class="glossary-card" data-term-id="${e.id}">
              <h2>${escapeHtml(e.term)}</h2>
              <p>${escapeHtml(glossaryText(e, voice))}</p>
              ${
                e.aliases?.length
                  ? `<p class="glossary-aliases">${escapeHtml(e.aliases.join(" · "))}</p>`
                  : ""
              }
            </article>`
            )
            .join("")}
        </div>

        <div class="actions">
          <button type="button" class="btn btn-ghost" data-glossary-back>Назад</button>
        </div>
      </section>`;
  }

  function bindGlossaryScreen(root, hooks = {}) {
    root.querySelectorAll("[data-voice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setVoice(btn.dataset.voice);
        hooks.onChange?.({ voice: getVoice(), query: root.querySelector("#glossaryQuery")?.value || "" });
      });
    });
    const input = root.querySelector("#glossaryQuery");
    let timer = null;
    input?.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        hooks.onChange?.({ voice: getVoice(), query: input.value || "" });
      }, 160);
    });
    root.querySelector("[data-glossary-back]")?.addEventListener("click", () => hooks.onBack?.());
  }

  function renderGlossaryLink(label = "Словарь") {
    return `<button type="button" class="btn btn-ghost btn-tiny" data-open-glossary>${escapeHtml(label)}</button>`;
  }

  function linkifyTheoryTerms(text) {
    // подсветка известных терминов как кнопок словаря
    let out = escapeHtml(text);
    const terms = GLOSSARY_ENTRIES.map((e) => e.term).sort((a, b) => b.length - a.length);
    for (const term of terms) {
      const re = new RegExp(`(?<![\\wа-яА-ЯёЁ])(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")})(?![\\wа-яА-ЯёЁ])`, "gi");
      out = out.replace(re, `<button type="button" class="term-link" data-open-glossary data-term-id="${findGlossaryEntry(term)?.id || ""}">$1</button>`);
    }
    return out;
  }

  /** Поэтический оттенок → ладовая опора (полная глубина). */
  const MOOD_MODE = {
    bright: {
      modeLine: "Ионийский лад · мажорная диатоника",
      plainLine: "Светло и открыто — знакомый мажорный воздух",
      modes: ["ионийский", "лидийский"],
      note: "Ясный тональный центр, автентика и плагальность без затемнения.",
      plainNote: "Фраза звучит ясно: легко услышать, где дом, и спокойно к нему вернуться.",
    },
    dark: {
      modeLine: "Эолийский / гармонический минор",
      plainLine: "Тише и глубже — минорное дыхание",
      modes: ["эолийский", "гармонический минор", "мелодия минор"],
      note: "Минорный центр; возможны VII натуральная и VII гармоническая (доминанта).",
      plainNote: "Звучит камернее: больше тени, возврат домой может быть мягким или более острым.",
    },
    tense: {
      modeLine: "Фригийский · доминантовые цепочки · альтерации",
      plainLine: "Острее и напряжённее — хочется разряда",
      modes: ["фригийский", "гармонический минор", "сверхдоминантовые обороты"],
      note: "Усиленное тяготение, альтерированные доминанты, острые разрешения.",
      plainNote: "Внутри хода есть конфликт: ухо ждёт, когда напряжение отпустит.",
    },
    dream: {
      modeLine: "Лидийский / миксолидийский · плавающая модальность",
      plainLine: "Дымка и мягкие края — меньше «обязан вернуться»",
      modes: ["лидийский", "миксолидийский", "дорийский"],
      note: "Ослабленная функциональность, септаккорды, мягкие каденции.",
      plainNote: "Края смазаны: красиво висеть в краске, не торопя финал.",
    },
    pulse: {
      modeLine: "Дорийский лад · риффовая модальность",
      plainLine: "Пульс и повтор — тело держит петлю",
      modes: ["дорийский", "миксолидийский"],
      note: "Устойчивый модальный грув; VI мажорная в миноре даёт «открытый» минор.",
      plainNote: "Работает повтором: короткая петля сама держит форму, как рифф.",
    },
    groovy: {
      modeLine: "Дорийский / миксолидийский · блюзовая диатоника",
      plainLine: "Грув и блюзовая тень — повтор важнее правил",
      modes: ["дорийский", "миксолидийский", "блюзовый лад"],
      note: "Повтор, рифф, доминантовые краски на I и IV.",
      plainNote: "Тело и повтор важнее «правильной» каденции: ход качается.",
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

  const EDGE_PLAIN = {
    "к тонике": "Тянет обратно к дому — после этого звена фраза хочет закончиться.",
    спуск: "Движение вниз, мягче и внутрь — энергия спадает.",
    мягко: "Поворот без резкого рывка — скорее родство, чем конфликт.",
    припев: "Узнаваемая яркая петля — то, что хочется повторить голосом.",
    острее: "Появляется трение: ухо ждёт разрешения.",
    пульс: "Держится повтором и телом, а не только финальной точкой.",
    дымка: "Края мягкие: можно побыть в краске, не спеша домой.",
    ход: "Просто следующий шаг истории относительно выбранного дома.",
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
      .replace(/[–—−]/g, "-")
      .replace(/\b(b|#)?([ivx]+)\b/gi, (_, accidental, rom) => `${accidental || ""}${rom.toUpperCase()}`)
      .replace(/-/g, "–");
  }

  function extractDegreeSequence(text) {
    if (!text) return "";
    const normalized = upperRomans(text);
    const re =
      /[b#]?[IVX]+(?:maj7|m7|m|7|sus4|dim|ø|alt)?(?:\s*[–\/]\s*[b#]?[IVX]+(?:maj7|m7|m|7|sus4|dim|ø|alt)?){1,11}/g;
    const matches = normalized.match(re) || [];
    if (!matches.length) return "";
    return matches.sort((a, b) => b.length - a.length)[0].replace(/\s+/g, "");
  }

  function moodModeInfo(moodId) {
    return MOOD_MODE[moodId] || MOOD_MODE.dark;
  }

  function moodLineForVoice(moodId, voice) {
    const m = moodModeInfo(moodId);
    const v = voice || getVoice();
    return v === "plain" ? m.plainLine || m.modeLine : m.modeLine;
  }

  function moodNoteForVoice(moodId, voice) {
    const m = moodModeInfo(moodId);
    const v = voice || getVoice();
    return v === "plain" ? m.plainNote || m.note : m.note;
  }

  function edgeTheory(label, voice) {
    const v = voice || getVoice();
    if (v === "plain") return EDGE_PLAIN[label] || EDGE_PLAIN["ход"];
    return EDGE_THEORY[label] || EDGE_THEORY["ход"];
  }

  function guessDegrees(pathIdea) {
    const blob = [pathIdea?.kind, pathIdea?.why, pathIdea?.family].filter(Boolean).join(" · ");
    const fromText = extractDegreeSequence(blob);
    if (fromText) return fromText;
    const n = (pathIdea?.path || []).length;
    if (n === 3) return "I–IV–V";
    if (n === 4) return "I–V–VI–IV";
    if (n >= 5) return "I–…";
    return "I";
  }

  function guessFunctions(degrees, moodId) {
    const d = degrees.toUpperCase();
    if (/V/.test(d) && /I/.test(d)) {
      return {
        pro: "Тоника → доминанта (автентическое тяготение)",
        plain: "В ходе есть тяга назад к дому — поэтому фраза звучит собранно.",
      };
    }
    if (/IV/.test(d) && /I/.test(d) && !/V/.test(d)) {
      return {
        pro: "Плагальное движение (субдоминанта → тоника)",
        plain: "Мягкий шаг в сторону и возврат домой — без острого рывка.",
      };
    }
    if (/II/.test(d) && /V/.test(d)) {
      return {
        pro: "Субдоминантовая подготовка → доминанта (оборот II–V)",
        plain: "Сначала подготовка, потом тяга к дому — классический «разгон» к ответу.",
      };
    }
    if (moodId === "dark" || moodId === "tense") {
      return {
        pro: "Минорный план с усиленным тяготением",
        plain: "Минорная история: напряжение сильнее, возврат домой заметнее.",
      };
    }
    if (moodId === "dream" || moodId === "pulse" || moodId === "groovy") {
      return {
        pro: "Модальный план; функция мягче диатоники",
        plain: "Держится настроением и повтором сильнее, чем жёсткой «тягой».",
      };
    }
    return {
      pro: "Диатоническое развёртывание вокруг тоники",
      plain: "Движение вокруг дома без резких поворотов — ход читается легко.",
    };
  }

  function guessCadence(degrees, pathIdea) {
    const blob = `${degrees} ${pathIdea?.kind || ""} ${pathIdea?.why || ""}`.toLowerCase();
    if (/v7|доминант|каденц|auth/.test(blob) || /V/.test(degrees)) {
      return {
        pro: "Автентическая каденция (V→I) или её подготовка",
        plain: "Финал как «вопрос → ответ»: после напряжения хочется услышать дом.",
      };
    }
    if (/плаг|iv–i|amen|gospel/.test(blob)) {
      return {
        pro: "Плагальная каденция (IV→I)",
        plain: "Мягкое «аминь»: возврат домой без резкого толчка.",
      };
    }
    if (/half|половин/.test(blob)) {
      return {
        pro: "Половинная каденция (остановка на доминанте)",
        plain: "Остановка на полуслове: фраза зависла перед ответом.",
      };
    }
    return {
      pro: "Открытый оборот без жёсткого каденционного закрепления",
      plain: "Конец открытый: можно продолжать или повторить петлю.",
    };
  }

  function voiceLeadingNote(pathIdea) {
    if (pathIdea?.fit != null && pathIdea.fit < 3) {
      return {
        pro: "Аппликатуры подобраны с малым сдвигом руки — голосоведение на грифе остаётся связным.",
        plain: "По грифу идти удобно: пальцы почти не прыгают — ход «поётся» сам.",
      };
    }
    return {
      pro: "Следите за общим тоном и ближайшими позициями: так сохраняется связность голосоведения.",
      plain: "Ищите общие звуки и соседние формы — так переход между аккордами ощущается цельным.",
    };
  }

  function plainWhySummary(pathIdea, degrees, moodId) {
    const why = String(pathIdea?.why || "").trim();
    if (why) {
      // оставляем авторский why, но без давления терминами — upperRomans уже нормализует ступени
      return upperRomans(why);
    }
    const mood = moodModeInfo(moodId).plainLine || "в выбранном настроении";
    return `Ход ${degrees} работает в настроении «${mood}»: ухо считывает путь относительно дома.`;
  }

  /**
   * Гармонический паспорт хода.
   * A = голос plain/pro; D = в plain говорим «почему работает», теория — в словаре.
   */
  function buildPassport(pathIdea, opts = {}) {
    const moodId = opts.moodId || "dark";
    const start = opts.start || pathIdea?.path?.[0] || "I";
    const mode = moodModeInfo(moodId);
    const degrees = guessDegrees(pathIdea);
    const functions = guessFunctions(degrees, moodId);
    const cadence = guessCadence(degrees, pathIdea);
    const leading = voiceLeadingNote(pathIdea);
    const brief = {
      degrees,
      functions: functions.pro,
      functionsPlain: functions.plain,
      modeLine: mode.modeLine,
      modeLinePlain: mode.plainLine || mode.modeLine,
      center: start,
      summary: upperRomans(pathIdea?.why || `Оборот ${degrees} в ладовой опоре «${mode.modeLine}».`),
      summaryPlain: plainWhySummary(pathIdea, degrees, moodId),
    };
    const full = {
      ...brief,
      cadence: cadence.pro,
      cadencePlain: cadence.plain,
      modes: mode.modes,
      modeNote: mode.note,
      modeNotePlain: mode.plainNote || mode.note,
      voiceLeading: leading.pro,
      voiceLeadingPlain: leading.plain,
      family: pathIdea?.family || "",
      kind: upperRomans(pathIdea?.kind || ""),
      alternatives:
        "Родственные обороты: замена медианты, плагальный ответ IV–I, вторичная доминанта к V, модальное заимствование bVII / bVI.",
      alternativesPlain:
        "Что ещё попробовать: мягкий соседний поворот, спокойный возврат домой, более острый «толчок» к ответу, аккорд из соседней краски.",
      glossaryHints: ["тоника", "доминанта", "каденция", "лад"],
    };
    return { brief, full };
  }

  function renderVoiceToggleMini() {
    const voice = getVoice();
    return `
      <div class="voice-toggle voice-toggle--mini" role="group" aria-label="Голос комментариев">
        <button type="button" class="chip chip-btn ${voice === "plain" ? "is-on" : ""}" data-set-voice="plain">Простыми словами</button>
        <button type="button" class="chip chip-btn ${voice === "pro" ? "is-on" : ""}" data-set-voice="pro">Как у музыкантов</button>
      </div>`;
  }

  function renderPassportHtml(passport, opts = {}) {
    const plus = hasLadPlus();
    const wantFull = opts.forceFull || plus;
    const brief = passport.brief;
    const full = passport.full;
    const showTeaser = !wantFull;
    const degreesOk = brief.degrees && brief.degrees.includes("–");
    const plain = getVoice() === "plain";

    const title = plain ? "Почему этот ход работает" : "Гармонический паспорт";
    const functionsText = plain ? brief.functionsPlain || brief.functions : brief.functions;
    const modeText = plain ? brief.modeLinePlain || brief.modeLine : brief.modeLine;
    const summaryText = plain ? brief.summaryPlain || brief.summary : brief.summary;

    let html = `
      <section class="theory-passport ${plain ? "is-plain" : "is-pro"}">
        <div class="theory-passport-head">
          <p class="theory-kicker">${escapeHtml(title)}</p>
          ${renderGlossaryLink("Словарь")}
        </div>
        ${renderVoiceToggleMini()}
        ${
          degreesOk
            ? `<p class="theory-degrees">${escapeHtml(brief.degrees)}</p>`
            : `<p class="theory-degrees theory-degrees--soft">${escapeHtml(brief.degrees || "—")}</p>`
        }
        ${
          plain
            ? `<p class="theory-plain-hint">Римские цифры — адреса относительно дома (I). Буква b перед цифрой — бемоль (на полтона ниже). Незнакомое слово — в словарь.</p>`
            : ""
        }
        <p class="theory-line"><span class="theory-label">${
          plain ? "Почему" : "Функции"
        }</span>${plain ? escapeHtml(functionsText) : linkifyTheoryTerms(functionsText)}</p>
        <p class="theory-line"><span class="theory-label">${
          plain ? "Настроение" : "Лад"
        }</span>${plain ? escapeHtml(modeText) : linkifyTheoryTerms(modeText)}</p>
        <p class="theory-line"><span class="theory-label">${
          plain ? "Дом" : "Центр"
        }</span>${escapeHtml(brief.center)}</p>
        <p class="theory-summary">${
          plain ? escapeHtml(summaryText) : linkifyTheoryTerms(summaryText)
        }</p>`;

    if (wantFull) {
      if (plain) {
        html += `
        <p class="theory-line"><span class="theory-label">Финал</span>${escapeHtml(
          full.cadencePlain || full.cadence
        )}</p>
        <p class="theory-line"><span class="theory-label">Ощущение краски</span>${escapeHtml(
          full.modeNotePlain || full.modeNote
        )}</p>
        <p class="theory-line"><span class="theory-label">По грифу</span>${escapeHtml(
          full.voiceLeadingPlain || full.voiceLeading
        )}</p>
        <p class="theory-line"><span class="theory-label">Что ещё попробовать</span>${escapeHtml(
          full.alternativesPlain || full.alternatives
        )}</p>`;
      } else {
        html += `
        <p class="theory-line"><span class="theory-label">Каденция</span>${linkifyTheoryTerms(full.cadence)}</p>
        <p class="theory-line"><span class="theory-label">Ладовая глубина</span>${linkifyTheoryTerms(
          full.modes.join(" · ")
        )}. ${linkifyTheoryTerms(full.modeNote)}</p>
        <p class="theory-line"><span class="theory-label">Голосоведение</span>${linkifyTheoryTerms(
          full.voiceLeading
        )}</p>
        <p class="theory-line"><span class="theory-label">Родственные обороты</span>${linkifyTheoryTerms(
          full.alternatives
        )}</p>`;
      }
    } else if (showTeaser) {
      html += `
        <div class="theory-lock">
          <p>${
            plain
              ? "Больше подробностей: финал хода, ощущение краски и соседние варианты — в <strong>Лад+</strong>."
              : "Полный разбор: каденция, ладовая глубина и родственные обороты — в <strong>Лад+</strong>."
          }</p>
          <button type="button" class="btn btn-glow btn-tiny" data-open-lad-plus>Открыть Лад+</button>
        </div>`;
    }

    html += `</section>`;
    return html;
  }

  function renderMoodModeLine(moodId) {
    return `<p class="mood-mode-line">${escapeHtml(moodLineForVoice(moodId))}</p>`;
  }

  function renderCenterCard(symbol, moodId) {
    const plain = getVoice() === "plain";
    const isMinor = /m(?!aj)/i.test(symbol) || /dim|ø|m7b5/i.test(symbol);
    const role = plain
      ? isMinor
        ? "Это ваш дом в минорной краске — тише и глубже."
        : "Это ваш дом в мажорной краске — светлее и открытее."
      : isMinor
        ? "Минорный тональный центр (эолийская / гармоническая опора)."
        : "Мажорный тональный центр (ионийская опора).";
    return `
      <section class="theory-passport theory-center ${plain ? "is-plain" : "is-pro"}">
        <div class="theory-passport-head">
          <p class="theory-kicker">${plain ? "Дом гармонии" : "Тональный центр"}</p>
          ${renderGlossaryLink("Словарь")}
        </div>
        ${renderVoiceToggleMini()}
        <p class="theory-degrees">${escapeHtml(symbol)}</p>
        <p class="theory-line">${escapeHtml(role)}</p>
        <p class="theory-line"><span class="theory-label">${
          plain ? "Настроение" : "Лад"
        }</span>${escapeHtml(moodLineForVoice(moodId))}</p>
        <p class="theory-summary">${escapeHtml(moodNoteForVoice(moodId))}</p>
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
    const hasContent =
      song &&
      Object.values(song).some((part) => part && Array.isArray(part.path) && part.path.length);
    if (!hasContent) return false;
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

  function clearSongState() {
    try {
      localStorage.removeItem(SONG_SAVE_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  function hasSavedSong() {
    const saved = loadSongState();
    return Boolean(
      saved && Object.values(saved).some((part) => part && Array.isArray(part.path) && part.path.length)
    );
  }

  function passportForPdf(pathIdea, opts) {
    const p = buildPassport(pathIdea, opts);
    const use = hasLadPlus() ? p.full : p.brief;
    const plain = getVoice() === "plain";
    return {
      degrees: use.degrees,
      functions: plain ? use.functionsPlain || use.functions : use.functions,
      modeLine: plain ? use.modeLinePlain || use.modeLine : use.modeLine,
      summary: plain ? use.summaryPlain || use.summary : use.summary,
      cadence: plain ? use.cadencePlain || use.cadence || "" : use.cadence || "",
      locked: !hasLadPlus(),
    };
  }

  global.LadTheory = {
    GLOSSARY,
    GLOSSARY_ENTRIES,
    FREE_PATH_LIMIT,
    hasLadPlus,
    setLadPlus,
    enableLadPlusPreview,
    freePathLimit,
    upperRomans,
    moodModeInfo,
    moodLineForVoice,
    moodNoteForVoice,
    edgeTheory,
    renderVoiceToggleMini,
    buildPassport,
    renderPassportHtml,
    renderMoodModeLine,
    renderCenterCard,
    renderLadPlusScreen,
    bindLadPlusScreen,
    saveSongState,
    loadSongState,
    clearSongState,
    hasSavedSong,
    passportForPdf,
    getVoice,
    setVoice,
    findGlossaryEntry,
    glossaryText,
    filterGlossary,
    renderGlossaryScreen,
    bindGlossaryScreen,
    renderGlossaryLink,
    linkifyTheoryTerms,
  };
})(typeof window !== "undefined" ? window : globalThis);
