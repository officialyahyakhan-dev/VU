# 📊 VU Marks & CGPA Calculator

A clean, modern web app to calculate your **subject marks**, see exactly **how much percentage you earned and lost** in each component (Quiz, Assignment, GDB, Midterm, Final), and get your **overall CGPA** — built around the **Virtual University (VU)** grading scale.

No installation, no internet, no libraries. Just open `index.html` in any browser.

---

## ✨ Features

- **Per-component breakdown** — for every part (Quiz, Assignment, GDB, Midterm, Final Exam) enter:
  - **Weight %** — how much that part counts
  - **Total Marks** — the maximum
  - **Your Marks** — what you scored
- **Live results** — instantly shows:
  - **% Earned** = `(your ÷ total) × weight`
  - **% Lost** = `weight − earned`
- **Per-subject total**, letter **grade**, and **GPA**
- **CGPA** across all subjects = `Σ(GPA × credit hours) ÷ Σ(credit hours)`
- **Animated CGPA gauge** + average percentage
- **Multiple subjects** — add as many as you want
- **Light / Dark theme** toggle (remembered)
- **Downloadable Result Card** (PNG) — shows totals only, in your choice of **light or dark** design
- **Auto-save** in your browser (localStorage) — your data stays after closing
- **Fully responsive** — works on phones (tables become cards)

---

## 🚀 How to use

1. Open **`index.html`** in any browser (double-click it).
2. Type a **subject name** and its **credit hours**.
3. Fill in each component's **weight %, total marks, and your marks**.
   - The footer confirms when your weights add up to **100%**.
4. Click **➕ Add Subject** for more subjects.
5. See your **CGPA** update at the bottom in real time.
6. Click **⬇ Result Card** → choose **Dark** or **Light** → a `Result-Card.png` downloads.

---

## 🎓 Grade scale (Virtual University)

| Percentage | Grade | Grade Points |
|-----------:|:-----:|:------------:|
| 85 – 100   | A     | 4.00 |
| 80 – 84    | A-    | 3.66 |
| 75 – 79    | B+    | 3.33 |
| 71 – 74    | B     | 3.00 |
| 68 – 70    | B-    | 2.66 |
| 64 – 67    | C+    | 2.33 |
| 61 – 63    | C     | 2.00 |
| 58 – 60    | C-    | 1.66 |
| 54 – 57    | D+    | 1.30 |
| 50 – 53    | D     | 1.00 |
| Below 50   | F     | 0.00 |

> Different program? Edit the `GRADE_SCALE` array near the top of [`app.js`](app.js) and everything recalculates.

### Default component weights (new subjects)

| Component   | Weight |
|-------------|-------:|
| Assignments | 5%  |
| Quizzes     | 5%  |
| GDB         | 5%  |
| Midterm     | 25% |
| Final Exam  | 60% |

Change these in `DEFAULT_COMPONENTS` in [`app.js`](app.js).

---

## 🗂️ Project structure

```
vumarks/
├── index.html   # Page structure & templates
├── style.css    # Theme, layout, animations
├── app.js       # Calculations, CGPA, result card, theme, storage
└── README.md
```

---

## 🛠️ Customization

| Want to change… | Where |
|---|---|
| Grade cutoffs / GPA values | `GRADE_SCALE` in `app.js` |
| Default components & weights | `DEFAULT_COMPONENTS` in `app.js` |
| Colors / theme | `:root` variables in `style.css` |
| Result-card colors | `CARD_THEME` in `app.js` |
| Social banner links | `<aside class="side-banner">` in `index.html` |

---

## 👤 Author

**Yahya Khan**

- 💼 LinkedIn: [yahyakhan-dev](https://www.linkedin.com/in/yahyakhan-dev)
- 💻 GitHub: [officialyahyakhan-dev](https://github.com/officialyahyakhan-dev)

---

## 📄 License

Free to use and modify for personal and educational purposes.
