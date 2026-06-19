# OLTEE Platform — Developer Setup Guide

> **Optimal Leverage Threshold Engine**  
> AI-powered financial intelligence platform  
> Built by **Faisal Alghamdi**

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10.x | Included with Node |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url> oltee-platform
cd oltee-platform
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder:

```
ANTHROPIC_API_KEY=sk-ant-YOUR_ACTUAL_KEY_HERE
```

Get your API key at [console.anthropic.com](https://console.anthropic.com).

### 3. Install shadcn/ui components

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then add all required components:

```bash
npx shadcn@latest add button input label select slider switch tabs toast tooltip dialog progress separator popover dropdown-menu
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
oltee-platform/
├── app/                    # Next.js 15 App Router pages
│   ├── page.tsx            # Landing page (/)
│   ├── analyze/page.tsx    # Main calculator (/analyze)
│   ├── scenarios/page.tsx  # Scenario lab (/scenarios)
│   ├── montecarlo/page.tsx # Monte Carlo (/montecarlo)
│   ├── report/page.tsx     # PDF report (/report)
│   └── api/
│       └── ai-insights/    # Streaming AI endpoint
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── forms/              # Input forms
│   ├── results/            # Output displays
│   ├── ai/                 # AI insight components
│   ├── scenarios/          # Scenario lab
│   ├── montecarlo/         # Monte Carlo visualizations
│   ├── report/             # PDF report builder
│   └── landing/            # Landing page sections
├── lib/                    # Pure logic (no React)
│   ├── engine.ts           # OLTEE math engine ← CORE
│   ├── scores.ts           # Intelligence score formulas
│   ├── montecarlo.ts       # MC simulation engine
│   ├── scenarios.ts        # Scenario computation
│   ├── validation.ts       # Zod schemas
│   ├── ai.ts               # Anthropic API client
│   ├── pdf.ts              # PDF generation
│   ├── formatting.ts       # Number/currency formatters
│   └── utils.ts            # Shared utilities
├── types/
│   └── oltee.ts            # All TypeScript types
├── hooks/
│   ├── useOLTEE.ts         # Primary state hook
│   ├── useScenario.ts      # Scenario state hook
│   ├── useMonteCarlo.ts    # MC state hook
│   └── useCountUp.ts       # Animated number hook
└── config/
    ├── constants.ts        # All app constants
    └── ai-prompts.ts       # AI prompt templates
```

---

## Implementation Phases

| Phase | Content | Status |
|-------|---------|--------|
| Phase 1 | Document analysis + roadmap | ✅ Complete |
| Phase 2 | System architecture + folder structure | ✅ Complete |
| Phase 3 | Core engine implementation | ⏳ Next |
| Phase 4 | UI layer (forms, results, AI panel) | ⏳ Pending |
| Phase 5 | Scenario lab + Monte Carlo | ⏳ Pending |
| Phase 6 | PDF report + landing page | ⏳ Pending |
| Phase 7 | Polish, animation, deployment | ⏳ Pending |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | **Yes** | Anthropic API key for AI insights |
| `ANTHROPIC_MODEL` | No | Default: `claude-sonnet-4-6` |
| `ANTHROPIC_MAX_TOKENS` | No | Default: `2048` |
| `NEXT_PUBLIC_APP_URL` | No | Default: `http://localhost:3000` |
| `NEXT_PUBLIC_ENABLE_AI_INSIGHTS` | No | Default: `true` |
| `NEXT_PUBLIC_ENABLE_MONTE_CARLO` | No | Default: `true` |
| `NEXT_PUBLIC_ENABLE_PDF_EXPORT` | No | Default: `true` |
| `NEXT_PUBLIC_MONTE_CARLO_ITERATIONS` | No | Default: `10000` |

---

## Deployment to Vercel

### One-click deploy

1. Push to GitHub
2. Import repository at [vercel.com/new](https://vercel.com/new)
3. Add `ANTHROPIC_API_KEY` in Vercel Environment Variables
4. Deploy — Vercel auto-detects Next.js

### CLI deploy

```bash
npm install -g vercel
vercel --prod
```

Add secrets:
```bash
vercel env add ANTHROPIC_API_KEY production
```

---

## The OLTEE Equation (Reference)

```
L* = [ (ROI − r) × (1 − T) ] ÷ [ r × (1 + σ × 0.5) × (1 / CF_ratio) ]
     subject to: L* = min(L*computed, 0.70)

Decision:
  Debt_Ratio < L* × 0.85    → OPTIMAL
  L* × 0.85 ≤ DR < L*       → CAUTION
  Debt_Ratio ≥ L*            → SUBOPTIMAL
  ROI ≤ r (pre-check)       → NEG_SPREAD
```

All formula constants are in `config/constants.ts` under `FORMULA`.  
**Never change these without updating the source specification document.**

---

## Type Check & Lint

```bash
npm run type-check   # TypeScript strict mode
npm run lint         # ESLint
npm run build        # Full production build
```

---

*Built by Faisal Alghamdi · OLTEE v1.0.0*
