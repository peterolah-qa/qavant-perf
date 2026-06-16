# qavant-perf — setup (k6 performance suite)

A new 4th repo that adds performance smoke / SLO checks to the Qavant ecosystem.
You'll create the repo, add 3 files, push, and the CI runs itself.

## Files & where they go
```
qavant-perf/
├── scripts/smoke.js              <- file: smoke.js
├── .github/workflows/k6.yml      <- file: k6.yml
└── README.md                     <- file: qavant-perf-README.md (rename to README.md)
```

---

## Step 1 — Create the repo on GitHub
1. Go to https://github.com/new
2. Owner: **peterolah-qa** · Repository name: **qavant-perf**
3. **Public** · tick **Add a README file** · Create repository.

## Step 2 — Clone it next to the others
```
cd ~/Downloads
git clone https://github.com/peterolah-qa/qavant-perf.git
cd qavant-perf
```

## Step 3 — Put the files in place
Create the folders and drop the files:
```
mkdir -p scripts .github/workflows
```
- Move **smoke.js** into `~/Downloads/qavant-perf/scripts/`
- Move **k6.yml** into `~/Downloads/qavant-perf/.github/workflows/`
- Move **qavant-perf-README.md** into `~/Downloads/qavant-perf/` and rename it to **README.md** (overwrite the GitHub one).

(Tip to open the folders: `open ~/Downloads/qavant-perf`)

## Step 4 — Commit & push
```
cd ~/Downloads/qavant-perf
git add .
git commit -m "Add k6 performance smoke suite + CI"
git push
```

## Step 5 — Watch CI
Repo → **Actions** → the "k6 Performance" workflow runs:
- installs k6,
- runs the smoke test against qavant.dev,
- publishes `status.json` + `summary.txt`.

Green = SLOs met (p95 < 800 ms, errors < 1%). If it ever goes red, that's a real
latency/availability regression — exactly the signal you want.

---

## Then: add it to the board & portfolio
- Create issue / draft card "k6 performance suite" → put in **Done**.
- Update the "three suites/stacks" wording to **four** on the site / CV / READMEs when you're ready (optional follow-up).
