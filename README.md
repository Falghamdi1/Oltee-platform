<div align="center">

# OLTEE
### Optimal Leverage Threshold Engine

**The first tool that tells you whether your debt is in its productive zone — mathematically.**

Built by **Faisal Alghamdi**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?logo=google)](https://aistudio.google.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

## What is OLTEE?

Most financial tools tell you whether you *have* debt. OLTEE is the first to tell you whether your debt is in its **productive zone** — using an original mathematical equation, not a credit score or a rule of thumb.

The platform computes **L*** — the Optimal Leverage Threshold — the precise point above which your debt-to-asset ratio transitions from a wealth-building instrument into a financial liability.

```
L* = [ (ROI − r) × (1 − T) ] ÷ [ r × (1 + σ × 0.5) × (1/CF) ]

subject to: L* = min(L*_computed, 0.70)
```

Every variable has a specific financial meaning. Every step is shown transparently. The AI translates the math into plain language.

---

## Features

| Feature | Description |
|---|---|
| **OLTEE Equation** | 9-step equation walkthrough — every calculation visible |
| **4 Intelligence Scores** | Stability, Debt Health, Efficiency, Resilience (0–100) |
| **AI Analysis** | 8-section Gemini-powered analysis in plain language |
| **Scenario Lab** | 8 presets + live sliders — rate hikes, income cuts, asset declines |
| **Monte Carlo** | 10,000-scenario probability simulation |
| **PDF Reports** | Professional downloadable reports for advisors |
| **Shareable Links** | URL-encoded analysis that auto-populates the form |

---

## The Equation

Derived from Modigliani-Miller Trade-Off Theory, adapted for individual borrowers:

| Symbol | Meaning |
|---|---|
| **ROI** | Annual return on the financed investment |
| **r** | Annual loan interest / Islamic profit rate |
| **T** | Effective tax rate |
| **σ** | Income volatility (0 = stable, 1 = erratic) |
| **CF** | Cash flow coverage ratio (income ÷ repayment) |
| **L*** | Safe borrowing ceiling (the output) |

**Status zones:**
- `Debt_Ratio < L* × 0.85` → **OPTIMAL** — debt is working for you
- `L* × 0.85 ≤ Debt_Ratio < L*` → **CAUTION** — approaching the limit
- `Debt_Ratio ≥ L*` → **SUBOPTIMAL** — crossed the threshold
- `ROI ≤ r` → **NEGATIVE SPREAD** — borrowing destroys value

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.5 (strict mode) |
| AI | Google Gemini 2.5 Flash (free tier) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF | jsPDF |
| Styling | Tailwind CSS + inline design tokens |
| Deployment | Vercel (Bahrain region — bah1) |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/oltee-platform.git
cd oltee-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Google AI API key:

```
GOOGLE_AI_API_KEY=AIzaSy-YOUR_KEY_HERE
```

**Get a free key:** [aistudio.google.com](https://aistudio.google.com/app/apikey)  
No credit card required. Free quota: 1,500 requests/day.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo — Ahmad's Case

The app pre-loads the worked example from the specification document:

| Input | Value |
|---|---|
| Annual ROI | 12% (rental property) |
| Interest rate | 5% (Al Rajhi Islamic profit rate) |
| Tax rate | 15% (Zakat + VAT pass-through) |
| Income stability σ | 0.20 (bank employee — stable) |
| CF coverage | 1.35× (income covers repayments 1.35×) |
| Total debt | SAR 550,000 (mortgage + car) |
| Total assets | SAR 920,000 (apartment + car + savings) |

**Result:** CAUTION — L* = 70.0% (cap applied) — SAR 94,000 headroom

**Shareable demo link:**
```
/analyze?roi=12&r=5&t=15&sigma=0.20&cf=1.35&d=550000&a=920000
```

---

## Running Without AI

The AI API key is optional. All mathematical features work with no key:
- OLTEE equation and L* computation
- Gauge, KPI cards, equation waterfall
- 4 intelligence scores
- Scenario simulation (all 8 presets + sliders + sensitivity)
- Monte Carlo (full 10,000-scenario simulation)
- PDF report generation

Only the AI insight text is absent. Set `NEXT_PUBLIC_ENABLE_AI_INSIGHTS=false` to hide the AI panel cleanly.

---

## Project Structure

```
oltee-platform/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Landing page
│   ├── analyze/page.tsx      # Main analysis page
│   ├── scenarios/page.tsx    # Scenario Lab
│   ├── montecarlo/page.tsx   # Monte Carlo simulation
│   ├── report/page.tsx       # PDF report builder
│   └── api/ai-insights/      # Gemini streaming API route
├── components/
│   ├── forms/                # AnalysisForm, VolatilitySlider, CFSubCalculator
│   ├── results/              # DecisionBanner, Gauge, KPIRow, Waterfall, Scores
│   ├── scenarios/            # ScenarioLab, ScenarioSlider, ScenarioChart
│   ├── montecarlo/           # MonteCarloPanel, DistributionChart
│   ├── ai/                   # AIInsightPanel, StreamingText
│   ├── report/               # PDFReportBuilder
│   ├── layout/               # Navigation, Footer
│   ├── landing/              # Hero, Features
│   └── pages/                # Page content client components
├── lib/
│   ├── engine.ts             # OLTEE equation (spec-exact, 35 tests)
│   ├── scores.ts             # 4 intelligence score formulas
│   ├── montecarlo.ts         # Box-Muller stochastic simulation
│   ├── scenarios.ts          # Scenario override engine
│   ├── ai.ts                 # Google Gemini client
│   ├── pdf.ts                # jsPDF report builder
│   ├── context.tsx           # OLTEEProvider + useOLTEEContext
│   ├── reducer.ts            # Pure state reducer (11 action types)
│   ├── validation.ts         # Zod form schemas
│   └── formatting.ts         # SAR, %, ratio formatters
├── config/
│   ├── constants.ts          # All formula constants + app config
│   └── ai-prompts.ts         # Gemini prompt architecture
├── hooks/
│   ├── useScenario.ts        # Scenario simulation state
│   ├── useMonteCarlo.ts      # MC simulation state
│   └── useCountUp.ts         # Animated number hook
└── types/
    └── oltee.ts              # Complete TypeScript type system
```

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
vercel env add GOOGLE_AI_API_KEY   # paste your key
vercel --prod
```

Full deployment guide: [VERCEL_GUIDE.md](./VERCEL_GUIDE.md)

### Manual

```bash
npm run build
npm start
```

---

## Tests

```bash
npm test
```

- **35 engine tests** — all formula values verified against specification document (Ahmad's case)
- **22 Monte Carlo / scenario tests** — Box-Muller, histogram, override DSL
- **38 AI layer tests** — JSON parsing, prompt validation, route validation

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_AI_API_KEY` | **Yes** | Free key from [aistudio.google.com](https://aistudio.google.com) |
| `GOOGLE_AI_MODEL` | No | Default: `gemini-2.5-flash` |
| `GOOGLE_AI_MAX_TOKENS` | No | Default: `2048` |
| `NEXT_PUBLIC_APP_URL` | No | Your deployed URL (for shareable links) |
| `NEXT_PUBLIC_ENABLE_AI_INSIGHTS` | No | Set `false` to disable AI panel |
| `NEXT_PUBLIC_ENABLE_MONTE_CARLO` | No | Set `false` to disable MC page |
| `NEXT_PUBLIC_ENABLE_PDF_EXPORT` | No | Set `false` to disable PDF download |

---

## Disclaimer

OLTEE is for educational and analytical purposes only. It does not constitute financial, investment, legal, or tax advice. Always consult a licensed financial advisor before making debt or investment decisions. The L* threshold is a mathematical output based on your inputs — it is not a guarantee of financial safety.

For users in Saudi Arabia and the GCC: Islamic profit rates are mathematically identical to interest rates in this model. The terminology is adapted; the calculation is the same.

---

## Author

**Faisal Alghamdi**  
Optimal Leverage Threshold Engine — original equation and platform

---

*Built with Next.js · TypeScript · Google Gemini · Vercel*
