/**
 * Export song track chord sequences to a downloadable PDF.
 * Draws a light print sheet on canvas (Cyrillic-safe) and wraps it as PDF.
 */

function songExportFilename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const start = state.start ? String(state.start).replace(/[^A-Za-z0-9#b]/g, "") : "song";
  return `lad-${start}-${stamp}.pdf`;
}

function collectSongExportData() {
  const mood = typeof moodById === "function" ? moodById(state.mood) : null;
  const parts = (typeof SONG_SLOTS !== "undefined" ? SONG_SLOTS : []).map((slot) => {
    const item = state.song?.[slot.id];
    if (!item?.path?.length) return null;
    return {
      title: slot.title,
      path: item.path,
      route: item.path.join(" → "),
      family: item.family || "",
      kind: item.kind || "",
      moodTitle: moodById(item.mood)?.title || mood?.title || "",
    };
  }).filter(Boolean);

  return {
    brand: "Лад",
    tagline: "Song Companion",
    moodTitle: mood?.title || "",
    start: state.start || "",
    parts,
    createdAt: new Date().toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawSongExportCanvas(data) {
  const width = 794; // ~A4 @ 96dpi
  const margin = 48;
  const contentW = width - margin * 2;
  const probe = document.createElement("canvas").getContext("2d");

  const layout = [];
  let y = margin + 18;
  layout.push({ type: "title", y });
  y += 28;
  layout.push({ type: "tag", y });
  y += 26;
  layout.push({ type: "meta", y });
  y += 18;
  layout.push({ type: "rule", y });
  y += 28;
  layout.push({ type: "heading", y });
  y += 30;

  if (!data.parts.length) {
    layout.push({ type: "empty", y });
    y += 30;
  }

  probe.font = "700 28px 'Cormorant Garamond', Georgia, serif";
  data.parts.forEach((part, idx) => {
    const routeLines = wrapCanvasText(probe, part.route, contentW - 32);
    const meta = [part.moodTitle, part.family, part.kind].filter(Boolean).join(" · ");
    const blockH = 28 + routeLines.length * 30 + (meta ? 22 : 8) + 16;
    layout.push({ type: "part", y, idx, part, routeLines, meta, blockH });
    y += blockH + 12;
  });

  if (data.parts.length) {
    y += 8;
    layout.push({ type: "linear-title", y });
    y += 22;
    probe.font = "500 14px 'Source Sans 3', system-ui, sans-serif";
    const linear = data.parts.map((p) => `${p.title}: ${p.route}`).join("   |   ");
    const linearLines = wrapCanvasText(probe, linear, contentW);
    layout.push({ type: "linear", y, lines: linearLines });
    y += linearLines.length * 20;
  }

  y += 40;
  layout.push({ type: "footer", y });
  const height = Math.max(1123, y + margin);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f7f1e4";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#d97835";
  ctx.fillRect(0, 0, width, 8);

  layout.forEach((item) => {
    if (item.type === "title") {
      ctx.fillStyle = "#1a120c";
      ctx.font = "700 42px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(data.brand, margin, item.y);
    } else if (item.type === "tag") {
      ctx.fillStyle = "#6e655a";
      ctx.font = "600 13px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillText(data.tagline.toUpperCase(), margin, item.y);
    } else if (item.type === "meta") {
      ctx.fillStyle = "#3f3832";
      ctx.font = "500 15px 'Source Sans 3', system-ui, sans-serif";
      const metaBits = [
        data.moodTitle ? `Настроение: ${data.moodTitle}` : null,
        data.start ? `Тоника: ${data.start}` : null,
        data.createdAt,
      ].filter(Boolean);
      ctx.fillText(metaBits.join("  ·  "), margin, item.y);
    } else if (item.type === "rule") {
      ctx.strokeStyle = "rgba(217, 120, 53, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, item.y);
      ctx.lineTo(width - margin, item.y);
      ctx.stroke();
    } else if (item.type === "heading") {
      ctx.fillStyle = "#1a120c";
      ctx.font = "700 26px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("Аккордовая последовательность", margin, item.y);
    } else if (item.type === "empty") {
      ctx.fillStyle = "#6e655a";
      ctx.font = "500 16px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillText("На дорожке пока нет ходов.", margin, item.y);
    } else if (item.type === "part") {
      const top = item.y - 8;
      ctx.fillStyle = item.idx % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(240, 163, 90, 0.08)";
      ctx.strokeStyle = "rgba(26, 18, 12, 0.12)";
      ctx.lineWidth = 1;
      roundRect(ctx, margin, top, contentW, item.blockH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#d97835";
      ctx.font = "700 12px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillText(item.part.title.toUpperCase(), margin + 16, item.y + 10);

      ctx.fillStyle = "#1a120c";
      ctx.font = "700 28px 'Cormorant Garamond', Georgia, serif";
      let ry = item.y + 38;
      item.routeLines.forEach((line) => {
        ctx.fillText(line, margin + 16, ry);
        ry += 30;
      });

      if (item.meta) {
        ctx.fillStyle = "#6e655a";
        ctx.font = "500 13px 'Source Sans 3', system-ui, sans-serif";
        ctx.fillText(item.meta, margin + 16, ry + 2);
      }
    } else if (item.type === "linear-title") {
      ctx.fillStyle = "#1a120c";
      ctx.font = "700 18px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("Сквозная линия", margin, item.y);
    } else if (item.type === "linear") {
      ctx.fillStyle = "#3f3832";
      ctx.font = "500 14px 'Source Sans 3', system-ui, sans-serif";
      let ly = item.y;
      item.lines.forEach((line) => {
        ctx.fillText(line, margin, ly);
        ly += 20;
      });
    } else if (item.type === "footer") {
      ctx.fillStyle = "#9a9186";
      ctx.font = "500 11px 'Source Sans 3', system-ui, sans-serif";
      ctx.fillText("Собрано в Лад · alyosha1988.github.io/lad-v2", margin, Math.min(item.y, height - 24));
    }
  });

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function dataUrlToPdfBlob(jpegDataUrl, imgWidthPx, imgHeightPx) {
  const base64 = jpegDataUrl.split(",")[1];
  const raw = atob(base64);
  const imgBytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) imgBytes[i] = raw.charCodeAt(i);

  // Single page sized to the sheet aspect (A4 width)
  const pageW = 595.28;
  const pageH = pageW * (imgHeightPx / imgWidthPx);
  const drawW = pageW;
  const drawH = pageH;
  const ox = 0;
  const oy = 0;

  return buildSingleImagePdf(imgBytes, imgWidthPx, imgHeightPx, pageW, pageH, drawW, drawH, ox, oy);
}

function buildSingleImagePdf(imgBytes, imgW, imgH, pageW, pageH, drawW, drawH, ox, oy) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];

  const push = (str) => {
    chunks.push(typeof str === "string" ? encoder.encode(str) : str);
  };

  push("%PDF-1.4\n");

  const objs = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = "<< /Type /Pages /Kids [5 0 R] /Count 1 >>";
  objs[3] = null; // image - binary
  const contentStream = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${ox.toFixed(2)} ${oy.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  objs[4] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`;
  objs[5] =
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
    `/Contents 4 0 R /Resources << /XObject << /Im0 3 0 R >> >> >>`;

  // Write objects 1,2 first
  for (let n = 1; n <= 5; n++) {
    offsets[n] = chunks.reduce((sum, c) => sum + c.length, 0);
    push(`${n} 0 obj\n`);
    if (n === 3) {
      push(
        `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
      );
      push(imgBytes);
      push("\nendstream\n");
    } else {
      push(objs[n]);
      push("\n");
    }
    push("endobj\n");
  }

  const xrefStart = chunks.reduce((sum, c) => sum + c.length, 0);
  push(`xref\n0 6\n`);
  push("0000000000 65535 f \n");
  for (let n = 1; n <= 5; n++) {
    push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((c) => {
    out.set(c, offset);
    offset += c.length;
  });
  return new Blob([out], { type: "application/pdf" });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportSongToPdf() {
  const data = collectSongExportData();
  if (!data.parts.length) {
    window.alert("Сначала добавь хотя бы один ход на дорожку.");
    return false;
  }

  const canvas = drawSongExportCanvas(data);
  const jpeg = canvas.toDataURL("image/jpeg", 0.92);
  const blob = dataUrlToPdfBlob(jpeg, canvas.width, canvas.height);
  downloadBlob(blob, songExportFilename());
  return true;
}

if (typeof window !== "undefined") {
  window.exportSongToPdf = exportSongToPdf;
  window.collectSongExportData = collectSongExportData;
}
