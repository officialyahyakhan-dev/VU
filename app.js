/* =========================================================
   VU Marks & CGPA Calculator
   ---------------------------------------------------------
   For each component you enter:
     - Weight %      : how much that part counts toward the subject
     - Total Marks   : the maximum marks of that part
     - Your Marks    : what you scored
   We compute:
     % Earned = (Your / Total) * Weight
     % Lost   = Weight - % Earned
   Subject Total %  = sum of all "% Earned"
   GPA per subject  = from the grade scale below
   CGPA             = sum(GPA * creditHrs) / sum(creditHrs)
   ========================================================= */

// ----- Virtual University of Pakistan grade scale -----
// Each row: minimum percentage -> letter grade + grade points + colour tier.
// (Edit these numbers if your program uses a different table.)
const GRADE_SCALE = [
  { min: 85, grade: "A",  gpa: 4.00, tier: "a" },
  { min: 80, grade: "A-", gpa: 3.66, tier: "a" },
  { min: 75, grade: "B+", gpa: 3.33, tier: "b" },
  { min: 71, grade: "B",  gpa: 3.00, tier: "b" },
  { min: 68, grade: "B-", gpa: 2.66, tier: "b" },
  { min: 64, grade: "C+", gpa: 2.33, tier: "c" },
  { min: 61, grade: "C",  gpa: 2.00, tier: "c" },
  { min: 58, grade: "C-", gpa: 1.66, tier: "c" },
  { min: 54, grade: "D+", gpa: 1.30, tier: "d" },
  { min: 50, grade: "D",  gpa: 1.00, tier: "d" },
  { min:  0, grade: "F",  gpa: 0.00, tier: "f" },
];

// Default components shown when you add a new subject (typical VU layout).
const DEFAULT_COMPONENTS = [
  { name: "Assignments", weight: 5,  total: 0, obtained: 0 },
  { name: "Quizzes",     weight: 5,  total: 0, obtained: 0 },
  { name: "GDB",         weight: 5,  total: 0, obtained: 0 },
  { name: "Midterm",     weight: 25, total: 0, obtained: 0 },
  { name: "Final Exam",  weight: 60, total: 0, obtained: 0 },
];

const STORAGE_KEY = "vu-marks-calculator-v1";

const subjectsEl   = document.getElementById("subjects");
const subjectTmpl  = document.getElementById("subjectTemplate");
const rowTmpl      = document.getElementById("rowTemplate");

// ---------- helpers ----------
function gradeFor(percent) {
  for (const row of GRADE_SCALE) {
    if (percent >= row.min) return row;
  }
  return GRADE_SCALE[GRADE_SCALE.length - 1];
}
function num(input) {
  const v = parseFloat(input.value);
  return isNaN(v) ? 0 : v;
}
function round(n, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

// ---------- build a component row ----------
function addRow(tbody, data = {}) {
  const row = rowTmpl.content.firstElementChild.cloneNode(true);
  row.querySelector(".c-name").value     = data.name ?? "";
  row.querySelector(".c-weight").value   = data.weight ?? "";
  row.querySelector(".c-total").value    = data.total ?? "";
  row.querySelector(".c-obtained").value = data.obtained ?? "";

  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    recalcAll();
  });
  row.querySelectorAll("input").forEach(inp =>
    inp.addEventListener("input", recalcAll)
  );
  tbody.appendChild(row);
}

// ---------- build a subject card ----------
function addSubject(data = {}) {
  const card  = subjectTmpl.content.firstElementChild.cloneNode(true);
  const tbody = card.querySelector(".component-rows");

  card.querySelector(".subject-name").value   = data.name ?? "";
  card.querySelector(".subject-credit").value  = data.credit ?? 3;

  const comps = data.components ?? DEFAULT_COMPONENTS;
  comps.forEach(c => addRow(tbody, c));

  card.querySelector(".add-row").addEventListener("click", () => {
    addRow(tbody, { name: "", weight: 0, total: 0, obtained: 0 });
    recalcAll();
  });
  card.querySelector(".remove-subject").addEventListener("click", () => {
    card.remove();
    recalcAll();
  });
  card.querySelectorAll(".subject-name, .subject-credit").forEach(inp =>
    inp.addEventListener("input", recalcAll)
  );

  subjectsEl.appendChild(card);
  recalcAll();
}

// ---------- recalculate everything ----------
function recalcAll() {
  const cards = [...subjectsEl.querySelectorAll(".subject")];
  let totalCredits = 0, weightedGpa = 0, sumPercent = 0;

  cards.forEach(card => {
    const rows = [...card.querySelectorAll(".component-row")];
    let weightSum = 0, earnedSum = 0, lostSum = 0;

    rows.forEach(row => {
      const weight   = num(row.querySelector(".c-weight"));
      const total    = num(row.querySelector(".c-total"));
      const obtained = num(row.querySelector(".c-obtained"));

      const earned = total > 0 ? (obtained / total) * weight : 0;
      const lost   = weight - earned;

      row.querySelector(".c-earned").textContent = round(earned) + "%";
      row.querySelector(".c-lost").textContent   = round(Math.max(lost, 0)) + "%";

      weightSum += weight;
      earnedSum += earned;
      lostSum   += Math.max(lost, 0);
    });

    // footer totals
    const weightCell = card.querySelector(".weight-total");
    weightCell.textContent = round(weightSum) + "%";
    weightCell.classList.toggle("over", round(weightSum) > 100);
    weightCell.classList.toggle("ok", round(weightSum) === 100);

    const note = card.querySelector(".weight-note");
    if (round(weightSum) === 100) note.textContent = "✓ weights add up to 100%";
    else if (weightSum > 100)     note.textContent = "⚠ weights exceed 100%";
    else                          note.textContent = `weights add up to ${round(weightSum)}% (aim for 100%)`;

    card.querySelector(".earned-total").textContent = round(earnedSum) + "%";
    card.querySelector(".lost-total").textContent   = round(lostSum) + "%";

    // subject percentage = earned out of the weight you actually entered,
    // scaled to 100 so a partial setup still gives a fair grade.
    const subjectPercent = weightSum > 0 ? (earnedSum / weightSum) * 100 : 0;
    const g = gradeFor(subjectPercent);

    card.querySelector(".subj-percent").textContent = round(subjectPercent) + "%";
    const gradeEl = card.querySelector(".subj-grade");
    gradeEl.textContent = g.grade;
    gradeEl.dataset.tier = weightSum > 0 ? g.tier : "none";
    card.querySelector(".subj-gpa").textContent  = g.gpa.toFixed(2);
    card.querySelector(".bar-fill").style.width   = Math.min(subjectPercent, 100) + "%";

    const credit = num(card.querySelector(".subject-credit"));
    if (credit > 0 && weightSum > 0) {
      totalCredits += credit;
      weightedGpa  += g.gpa * credit;
      sumPercent   += subjectPercent;
    }
  });

  // overall
  const cgpa = totalCredits > 0 ? weightedGpa / totalCredits : 0;
  const validSubjects = cards.filter(c =>
    num(c.querySelector(".subject-credit")) > 0
  ).length;
  const avgPercent = validSubjects > 0 ? sumPercent / validSubjects : 0;

  document.getElementById("sumSubjects").textContent = cards.length;
  document.getElementById("sumCredits").textContent  = round(totalCredits);
  document.getElementById("sumCgpa").textContent     = cgpa.toFixed(2);
  document.getElementById("sumPercent").textContent  = round(avgPercent) + "%";

  // CGPA gauge ring (0–4 scale)
  const ring = document.getElementById("cgpaRing");
  if (ring) {
    const C = 2 * Math.PI * 52;              // circumference, r=52
    const pct = Math.max(0, Math.min(cgpa / 4, 1));
    ring.style.strokeDasharray  = C;
    ring.style.strokeDashoffset = C * (1 - pct);
    ring.dataset.tier = gradeFor(avgPercent).tier;
  }

  save();
}

// ---------- save / load ----------
function collect() {
  return [...subjectsEl.querySelectorAll(".subject")].map(card => ({
    name:   card.querySelector(".subject-name").value,
    credit: card.querySelector(".subject-credit").value,
    components: [...card.querySelectorAll(".component-row")].map(row => ({
      name:     row.querySelector(".c-name").value,
      weight:   row.querySelector(".c-weight").value,
      total:    row.querySelector(".c-total").value,
      obtained: row.querySelector(".c-obtained").value,
    })),
  }));
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collect())); } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return false;
    data.forEach(s => addSubject(s));
    return true;
  } catch (e) { return false; }
}

// ---------- wire up ----------
document.getElementById("addSubjectBtn").addEventListener("click", () => addSubject());
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Clear all subjects and start over?")) return;
  localStorage.removeItem(STORAGE_KEY);
  subjectsEl.innerHTML = "";
  addSubject({ name: "", credit: 3 });
});

// ---------- Result Card download (totals only) ----------
const TIER_COLOR = { a:"#3ddc97", b:"#5bd0ff", c:"#f0b429", d:"#ff9d5c", f:"#ff6b81", none:"#9aa2c8" };

function gatherResults() {
  return [...subjectsEl.querySelectorAll(".subject")].map(card => ({
    name:    card.querySelector(".subject-name").value.trim() || "Untitled subject",
    credit:  card.querySelector(".subject-credit").value || "0",
    percent: card.querySelector(".subj-percent").textContent,
    grade:   card.querySelector(".subj-grade").textContent,
    tier:    card.querySelector(".subj-grade").dataset.tier || "none",
    gpa:     card.querySelector(".subj-gpa").textContent,
  }));
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
}
function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255}, ${(n>>8)&255}, ${n&255}, ${a})`;
}
function classify(g) {
  if (g >= 3.5) return "Distinction";
  if (g >= 3.0) return "Very Good";
  if (g >= 2.5) return "Good";
  if (g >= 2.0) return "Satisfactory";
  if (g >  0)   return "Needs Improvement";
  return "—";
}

// theme palettes for the downloadable card
const CARD_THEME = {
  dark: {
    bg1:"#0c1124", bg2:"#141a36", subj:"#eef1fb", text:"#eef1fb", sub:"#9aa2c8",
    cell:"#c7cdec", colh:"#8b93ba", ink:"#ffffff", zebra:.04, line:.09, deco:.025,
    tiers:{ a:"#3ddc97", b:"#5bd0ff", c:"#f0b429", d:"#ff9d5c", f:"#ff6b81", none:"#9aa2c8" },
  },
  light: {
    bg1:"#ffffff", bg2:"#eaf0fc", subj:"#1b2138", text:"#1b2138", sub:"#5b6488",
    cell:"#44507a", colh:"#737da3", ink:"#1b2138", zebra:.05, line:.12, deco:.05,
    tiers:{ a:"#15a06e", b:"#1f8fd0", c:"#c98a0f", d:"#d97a36", f:"#d8344c", none:"#6b7290" },
  },
};

function buildResultCardSVG(theme = "dark") {
  const pl = CARD_THEME[theme] || CARD_THEME.dark;
  const T  = pl.tiers;
  const subjects = gatherResults();
  const cgpa    = document.getElementById("sumCgpa").textContent;
  const cgpaNum = parseFloat(cgpa) || 0;
  const credits = document.getElementById("sumCredits").textContent;
  const avg     = document.getElementById("sumPercent").textContent;
  const tier    = document.getElementById("cgpaRing").dataset.tier || "none";
  const accent  = T[tier];
  const today   = new Date().toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });

  const W = 820, P = 40;
  const headTop = 196, rowH = 54;
  const rowsTop = headTop + 48;
  const H = rowsTop + subjects.length * rowH + 116;

  // gauge ring geometry
  const gcx = 712, gcy = 96, gr = 46, C = 2 * Math.PI * gr;
  const off = C * (1 - Math.max(0, Math.min(cgpaNum / 4, 1)));

  // columns (centers)
  const colCR = 486, colPC = 572, colGR = 660, colGP = 752;

  // table rows
  let rows = "";
  subjects.forEach((s, i) => {
    const y = rowsTop + i * rowH, mid = y + rowH / 2;
    const c = T[s.tier] || accent;
    if (i % 2 === 1)
      rows += `<rect x="${P}" y="${y}" width="${W - 2*P}" height="${rowH}" rx="10" fill="${pl.ink}" opacity="${pl.zebra}"/>`;
    rows += `
      <circle cx="${P + 22}" cy="${mid}" r="13" fill="${hexA(accent,.16)}"/>
      <text x="${P + 22}" y="${mid}" class="idx" fill="${accent}">${i + 1}</text>
      <text x="${P + 48}" y="${mid}" class="subj">${esc(clip(s.name, 32))}</text>
      <text x="${colCR}" y="${mid}" class="cell">${esc(s.credit)}</text>
      <text x="${colPC}" y="${mid}" class="cell">${esc(s.percent)}</text>
      <rect x="${colGR - 24}" y="${mid - 14}" width="48" height="28" rx="9" fill="${hexA(c,.16)}" stroke="${hexA(c,.5)}"/>
      <text x="${colGR}" y="${mid}" class="grade" fill="${c}">${esc(s.grade)}</text>
      <text x="${colGP}" y="${mid}" class="gpa">${esc(s.gpa)}</text>`;
  });

  const fy = rowsTop + subjects.length * rowH + 30;   // footer baseline

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Roboto, Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${pl.bg1}"/><stop offset="1" stop-color="${pl.bg2}"/>
    </linearGradient>
    <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6b9bff"/><stop offset="1" stop-color="#9a6bff"/>
    </linearGradient>
    <style>
      .idx   { font-size:12px; font-weight:700; text-anchor:middle; dominant-baseline:central; }
      .subj  { font-size:16.5px; font-weight:600; fill:${pl.subj}; dominant-baseline:central; }
      .cell  { font-size:15px; font-weight:500; fill:${pl.cell}; text-anchor:middle; dominant-baseline:central; }
      .grade { font-size:14px; font-weight:800; text-anchor:middle; dominant-baseline:central; }
      .gpa   { font-size:15px; font-weight:700; fill:${pl.subj}; text-anchor:middle; dominant-baseline:central; }
      .colh  { font-size:11.5px; font-weight:700; fill:${pl.colh}; letter-spacing:.06em; dominant-baseline:central; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" rx="26" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="26" fill="none" stroke="${pl.ink}" stroke-opacity="${pl.line}"/>
  <circle cx="${W-70}" cy="-30" r="150" fill="${pl.ink}" opacity="${pl.deco}"/>
  <circle cx="60" cy="${H+40}" r="150" fill="${pl.ink}" opacity="${pl.deco*0.8}"/>
  <rect x="26" y="0" width="${W-52}" height="5" rx="2.5" fill="url(#logo)"/>

  <!-- header -->
  <rect x="${P}" y="40" width="52" height="52" rx="14" fill="url(#logo)"/>
  <text x="${P+26}" y="66" font-size="20" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">VU</text>
  <text x="${P+68}" y="58" font-size="23" font-weight="800" fill="${pl.text}" letter-spacing=".01em">Academic Result Card</text>
  <text x="${P+68}" y="84" font-size="13" fill="${pl.sub}">Virtual University grade scale  •  Generated ${esc(today)}</text>

  <!-- CGPA gauge -->
  <text x="${gcx}" y="40" fill="${pl.sub}" font-size="11.5" font-weight="700" letter-spacing=".08em" text-anchor="middle" dominant-baseline="central">CGPA / 4.0</text>
  <circle cx="${gcx}" cy="${gcy}" r="${gr}" fill="none" stroke="${pl.ink}" stroke-opacity="0.13" stroke-width="9"/>
  <circle cx="${gcx}" cy="${gcy}" r="${gr}" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${gcx} ${gcy})"/>
  <text x="${gcx}" y="${gcy-2}" font-size="30" font-weight="800" fill="${pl.text}" text-anchor="middle" dominant-baseline="central">${esc(cgpa)}</text>
  <text x="${gcx}" y="${gcy+18}" font-size="10.5" fill="${accent}" font-weight="700" text-anchor="middle" dominant-baseline="central">${esc(classify(cgpaNum).toUpperCase())}</text>

  <line x1="${P}" y1="${headTop-26}" x2="${W-P}" y2="${headTop-26}" stroke="${pl.ink}" stroke-opacity="${pl.line}"/>

  <!-- column headers -->
  <text x="${P+48}" y="${headTop}" class="colh">SUBJECT</text>
  <text x="${colCR}" y="${headTop}" class="colh" text-anchor="middle">CR.HRS</text>
  <text x="${colPC}" y="${headTop}" class="colh" text-anchor="middle">TOTAL %</text>
  <text x="${colGR}" y="${headTop}" class="colh" text-anchor="middle">GRADE</text>
  <text x="${colGP}" y="${headTop}" class="colh" text-anchor="middle">GPA</text>

  ${rows}

  <!-- footer -->
  <line x1="${P}" y1="${fy-24}" x2="${W-P}" y2="${fy-24}" stroke="${pl.ink}" stroke-opacity="${pl.line}"/>
  <text x="${P}" y="${fy+4}" font-size="13" fill="${pl.sub}" dominant-baseline="central">
    <tspan fill="${pl.text}" font-weight="700">${subjects.length}</tspan> Subjects
    <tspan dx="14" fill="${pl.text}" font-weight="700">${esc(credits)}</tspan> Credit Hrs
    <tspan dx="14" fill="${pl.text}" font-weight="700">${esc(avg)}</tspan> Average
  </text>
  <rect x="${W-P-150}" y="${fy-18}" width="150" height="44" rx="12" fill="${hexA(accent,.14)}" stroke="${hexA(accent,.5)}"/>
  <text x="${W-P-130}" y="${fy+4}" font-size="13" fill="${pl.cell}" dominant-baseline="central">CGPA</text>
  <text x="${W-P-16}" y="${fy+4}" font-size="22" font-weight="800" fill="${accent}" text-anchor="end" dominant-baseline="central">${esc(cgpa)}</text>
</svg>`;
}

function downloadResultCard(theme) {
  if (gatherResults().length === 0) { alert("Add a subject first."); return; }
  const svg = buildResultCardSVG(theme);
  const W = 820, scale = 2;
  const heightMatch = svg.match(/height="(\d+)"/);
  const H = heightMatch ? parseInt(heightMatch[1]) : 600;

  const img = new Image();
  img.onload = () => {
    const cv = document.createElement("canvas");
    cv.width = W * scale; cv.height = H * scale;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Result-Card-${theme}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.onerror = () => alert("Could not render the card. Please try again.");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// theme picker popup for the download button
const downloadBtn = document.getElementById("downloadBtn");
const cardMenu = document.createElement("div");
cardMenu.className = "card-menu hidden";
cardMenu.innerHTML = `
  <p class="card-menu-title">Download result card</p>
  <button class="card-menu-opt" data-theme="dark">🌙 <span>Dark card</span></button>
  <button class="card-menu-opt" data-theme="light">☀️ <span>Light card</span></button>`;
document.body.appendChild(cardMenu);

function openCardMenu() {
  if (gatherResults().length === 0) { alert("Add a subject first."); return; }
  const r = downloadBtn.getBoundingClientRect();
  cardMenu.style.top  = (r.bottom + window.scrollY + 8) + "px";
  cardMenu.style.left = (r.right + window.scrollX - cardMenu.offsetWidth) + "px";
  cardMenu.classList.remove("hidden");
  // reposition after it has a width
  const rr = downloadBtn.getBoundingClientRect();
  cardMenu.style.left = (rr.right + window.scrollX - cardMenu.offsetWidth) + "px";
}
function closeCardMenu() { cardMenu.classList.add("hidden"); }

downloadBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  cardMenu.classList.contains("hidden") ? openCardMenu() : closeCardMenu();
});
cardMenu.querySelectorAll(".card-menu-opt").forEach(btn =>
  btn.addEventListener("click", () => { closeCardMenu(); downloadResultCard(btn.dataset.theme); })
);
document.addEventListener("click", (e) => {
  if (!cardMenu.contains(e.target) && e.target !== downloadBtn) closeCardMenu();
});

// theme toggle (remembered)
const themeBtn = document.getElementById("themeBtn");
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.textContent = t === "light" ? "☀️" : "🌙";
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem("vu-theme", next);
});
applyTheme(localStorage.getItem("vu-theme") || "dark");

// first load
if (!load()) {
  addSubject({ name: "", credit: 3 });
}
