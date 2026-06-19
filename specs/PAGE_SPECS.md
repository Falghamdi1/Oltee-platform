# OLTEE — Complete Page Specifications
## All Pages · All States · All Flows
**Author:** Faisal Alghamdi | **Phase:** Pre-implementation | **Version:** 1.0

---

## GLOBAL SHELL

### NavigationBar
**Present on:** All pages  
**Position:** `sticky top-0 z-[200]`  
**Height:** 60px  
**Background:** `surface-base` + `backdrop-filter: blur(12px)` at 85% opacity  
**Border:** `1px solid border-base` (bottom only)

**Left slot — Logotype:**
- "OLTEE" — Space Grotesk 18px / weight 700 / `ink-primary`
- "Optimal Leverage Threshold Engine" — Inter 10px / `ink-tertiary` / uppercase / letter-spacing 0.05em
- Click → `/` (landing)

**Center slot — Nav links (desktop only):**
- "Analyze" → `/analyze`
- "Scenario Lab" → `/scenarios`
- "Monte Carlo" → `/montecarlo`
- "Report" → `/report`
- Each: Inter 14px / weight 500
- Default: `ink-secondary`
- Hover: `ink-primary`, 150ms ease
- Active (current route): `ink-primary` + 2px `teal-vivid` underline, border-radius 1px
- Disabled (Scenario Lab / Monte Carlo / Report when no baseline exists): `ink-tertiary`, cursor `not-allowed`, Radix Tooltip "Run an analysis first"

**Right slot — Mobile only:**
- Lucide `Menu` 22px / `ink-secondary`
- Tap → slide-down drawer (200ms height transition)
- Drawer: full width, `surface-overlay`, 1px `border-base` bottom
- Links stacked, 52px touch target each
- Close: tap outside or X button

**State: No baseline computed yet:**
- Scenario Lab, Monte Carlo, Report links: `ink-tertiary` + tooltip "Run an analysis on the Analyze page first"
- Not disabled visually — still full opacity — just redirects back to /analyze with a toast notification

---

### Footer
**Present on:** Landing page only  
**Height:** 72px  
**Background:** `surface-base` / `border-top: 1px solid border-muted`

Layout (three-column):
- Left: "OLTEE — Optimal Leverage Threshold Engine" / Inter 13px / `ink-tertiary`
- Center: "Built by Faisal Alghamdi" / Inter 13px / `ink-tertiary`
- Right: "Not financial advice. For educational and analytical purposes only." / Inter 11px / `ink-tertiary`

---

## PAGE 1 — LANDING

**Route:** `/`  
**Title:** `OLTEE — Know exactly when debt works for you`  
**Purpose:** Convert a first-time visitor into someone who clicks "Analyze your leverage"  
**Primary CTA:** Single teal button → `/analyze`

---

### Section 1.1 — Hero

**Viewport:** Full-screen, vertically centered  
**Background:** `surface-base` + subtle dot grid (CSS background-image: radial-gradient, 24px grid, 1px dots at 8% opacity)

**Layout (centered column, max-width 640px):**

```
[eyebrow]
[title line 1]
[title line 2 — teal accent]
[equation display block]
[tagline]
[CTA button]
```

**Eyebrow:**
- "Financial engineering · Built by Faisal Alghamdi"
- Inter 11px / uppercase / letter-spacing 0.14em / `ink-tertiary`
- Margin bottom: 20px

**Title:**
- Line 1: "Know when debt" — Space Grotesk 56px / weight 700 / `ink-primary`
- Line 2: "works for you." — Space Grotesk 56px / weight 700 / `teal-vivid`
- Letter-spacing: -0.03em / Line-height: 1.05
- Margin bottom: 24px

**Equation display block:**
- Background: `surface-sunken`
- Border: `1px solid border-base`
- Border-radius: `radius-lg` (12px)
- Padding: 20px 28px
- Font: JetBrains Mono 15px / line-height 1.8
- Margin bottom: 32px

Content:
```
L* = [ ROI − r ] × [ 1 − T ]
        ÷  [ r × ( 1 + σ × 0.5 ) × ( 1/CF ) ]
      subject to: L* = min( L*computed, 0.70 )
```
All terms in `ink-tertiary` on load.
On hover of each term → highlight to `teal-vivid` + Radix Tooltip explaining the symbol.
Hover interactions (per term):
- `ROI` → "Annual return on your investment (%)"
- `r` → "Annual interest rate on your loan (%)"
- `T` → "Your effective tax rate (%)"
- `σ` → "Income volatility — 0 = stable, 1 = erratic"
- `CF` → "Monthly income ÷ monthly debt repayment"
- `L*` → "Your optimal leverage threshold — the output"

**Tagline:**
- "One equation. The precise point where debt stops working for you."
- Inter 17px / `ink-secondary` / max-width 480px / centered
- Margin bottom: 36px

**CTA button:**
- "Analyze your leverage →"
- Primary teal button, height 48px, padding 0 28px, font-size 16px
- Below it: "No account required · Free to use" — Inter 12px / `ink-tertiary`

**Animation sequence (on page load):**
1. Eyebrow fades in: 0ms, opacity 0→1, 400ms ease-spring
2. Title slides up: 100ms delay, y 20→0 + opacity, 500ms ease-spring
3. Equation block scales in: 250ms delay, scale 0.95→1 + opacity, 500ms ease-spring
4. Equation terms light up one by one: 600ms start, 80ms stagger per term, teal flash then back to dim
5. Tagline + CTA: 800ms delay, slide up, 400ms ease-spring

---

### Section 1.2 — Feature Highlights

**Layout:** 4-column grid (2-column on tablet, 1-column on mobile)  
**Padding:** 56px 32px  
**Background:** `surface-base`
**Header:**
- "Everything you need to understand your debt" — Inter 22px / weight 500 / centered
- "Seven inputs. One equation. Actionable clarity." — Inter 14px / `ink-secondary` / centered
- Margin below: 40px

**Four cards:**

Card 1 — Precision engine
- Icon: Lucide `Calculator` in `surface-raised` rounded square (36px container, `optimal-bg` tint)
- Title: "Precision engine" — Inter 15px / weight 500
- Body: "The OLTEE equation tells you the exact debt ratio where borrowing stops working for you — to the riyal."

Card 2 — AI intelligence
- Icon: Lucide `Brain` in `teal-ghost` container
- Title: "AI intelligence"
- Body: "Claude translates every computed number into plain-language guidance your banker would charge to explain."

Card 3 — Scenario Lab
- Icon: Lucide `FlaskConical` in `caution-bg` tint
- Title: "Scenario lab"
- Body: "See how a rate hike or income cut affects your safe limit before it happens. Eight stress tests included."

Card 4 — Monte Carlo
- Icon: Lucide `ChartHistogram` in `surface-overlay`
- Title: "Monte Carlo"
- Body: "10,000 simulated futures show the probability your leverage stays productive. See the full distribution."

Card specs: `surface-raised` / `border-base` / `radius-lg` / padding 24px / gap between icon and title: 14px

**Animation:** Cards stagger in on scroll entry (Intersection Observer), 80ms between each.

---

### Section 1.3 — How It Works

**Layout:** 3-column with connecting lines  
**Background:** `surface-base`  
**Padding:** 0 32px 56px

Header: "Three steps to financial clarity" — Inter 22px / weight 500 / centered / margin-bottom 40px

Step 1: "Enter your numbers"
- Step circle: 36px diameter, `surface-raised`, `border-base`, JetBrains Mono "1" in `ink-tertiary`
- Title: Inter 15px / weight 500
- Body: "Seven inputs: your return, interest rate, tax rate, income stability, cash flow, debt, and assets."

Step 2: "Engine calculates L*"
- Title: Inter 15px / weight 500
- Body: "The OLTEE equation computes your optimal leverage threshold in real time, showing every step."

Step 3: "AI explains why"
- Title: Inter 15px / weight 500
- Body: "Eight sections of personalized insight tell you exactly what the numbers mean for your situation."

Connecting lines: 1px `border-muted` horizontal, between step circles.  
Mobile: lines hidden, steps stack vertically with vertical connector.

---

### Section 1.4 — Worked Example (Ahmad)

**Background:** `surface-raised` / top and bottom `border-muted` borders  
**Padding:** 40px 32px

Eyebrow: "WORKED EXAMPLE" — 10px / uppercase / `ink-tertiary`  
Header: "Ahmad at Al Rajhi Bank"

Layout: 2-column (profile left, KPI grid right)

**Profile column:**
- Avatar: 48px circle, `surface-overlay`, initials "A" in `teal-vivid`
- Name: Inter 18px / weight 500
- Role: "Client Relationship Manager · Al Rajhi Bank · SAR 18,000/mo" — Inter 13px / `ink-secondary`
- Status badge: "✓ Optimal leverage" — green pill

**KPI grid (6 cells, 2×3):**
- Debt ratio: 59.8%
- Safe ceiling L*: 70.0% (teal)
- Headroom: SAR 94,000 (green)
- Return spread Δ: +7.0% (green)
- Tax efficiency α: 0.850
- Risk coefficient β: 1.100

CTA: "See the full analysis →" — teal link → `/analyze?demo=ahmad`

---

### Section 1.5 — Final CTA Banner

**Background:** linear strip, `surface-raised`  
**Padding:** 48px 32px / centered

- "Your debt ratio in 60 seconds." — Space Grotesk 32px / weight 700 / `ink-primary`
- "Analyze your leverage →" — primary teal button, 48px height
- Below: three trust signals in a row:
  - "✓ Based on Modigliani-Miller theorem"
  - "✓ Islamic finance compatible"
  - "✓ Free to use"
  - Each: Inter 13px / `ink-tertiary` with Lucide `Check` 14px / `ink-tertiary`

---

## PAGE 2 — ANALYZE

**Route:** `/analyze`  
**Title:** `Analyze Your Leverage | OLTEE`  
**Purpose:** The core product experience. User enters 7 inputs, receives L*, all intermediate steps, 4 scores, and streaming AI analysis.

**State machine:**
```
EMPTY → [user fills form] → CALCULATING → [engine runs] → RESULTS_IDLE
RESULTS_IDLE → [AI auto-starts] → AI_STREAMING → AI_COMPLETE
AI_COMPLETE → [user edits form] → CALCULATING → RESULTS_IDLE
```

---

### Layout Structure

**Desktop (≥ 1024px):**
```
[NavigationBar — 60px sticky]
┌─────────────────────┬────────────────────────────────┐
│   Form column       │   Results column               │
│   width: 380px      │   flex: 1                      │
│   padding: 24px     │   padding: 24px                │
│   overflow-y: auto  │   overflow-y: auto             │
│   border-right:     │                                │
│   1px border-base   │                                │
└─────────────────────┴────────────────────────────────┘
```
Page height: `100dvh`, columns fill remaining height below nav.

**Tablet (640–1023px):**
Single column. Form first, results below. "Calculate" button sticky at bottom (64px strip above viewport bottom edge).

**Mobile (< 640px):**
Single column. Same order. Sticky calculate strip. Results scroll below form on same page.

---

### 2.1 — Form Column

#### Live Equation Display (top of form column)
- Always visible, updates in real time as fields are filled
- Background: `surface-sunken` / border: `border-base` / `radius-lg`
- Padding: 14px 18px / margin-bottom: 20px
- Font: JetBrains Mono 13px / line-height 1.8

Content:
```
L* = [ {ROI} − {r} ] × [ 1 − {T} ]
       ÷ [ {r} × β × (1/CF) ] = {L*}
```
- `{ROI}`, `{r}`, etc.: teal if field has valid value, `ink-tertiary` if empty
- `{L*}` on the right: shows computed result in teal bold (only when all required fields valid)
- β shown as computed value (updates with sigma slider)
- `= {L*}` hidden until first valid computation

#### Field: Annual return on investment (ROI)
- Label: "Annual return on your investment" / Label style
- Tooltip: "If your apartment earns SAR 60,000 rent on a SAR 500,000 property, your annual return is 12%."
- Input: number, 0.1–100, step 0.1
- Unit badge: "%"
- Right of label: live Δ spread preview — "Spread: +7.0%" in green or "Spread: −2.0%" in red (shows once r is also filled)
- Validation: required. Error if empty on submit. Warning if spread < 1%.

#### Field: Annual interest / profit rate (r)
- Label: "Annual interest rate on your loan"
- Tooltip: "The rate your bank charges on your mortgage or loan each year."
- Input: number, 0.1–30, step 0.1
- Unit badge: "%"
- Validation: required. Error if ROI ≤ r ("Your investment return is below your loan rate — borrowing cannot be optimal").

#### Field: Tax rate (T)
- Label: "Your effective tax rate"
- Tooltip: "The percentage of earnings paid in income tax, Zakat, or other levies. Default is 15%."
- Input: number, 0–50, step 0.1
- Unit badge: "%"
- Default value: 15
- Validation: optional (uses 15% if empty).

#### Field: Income stability (σ — VolatilitySlider)
- Label: "Income stability" / right-aligned: "β = {computed}" in JetBrains Mono teal
- Slider: 0.0–1.0, step 0.01, default 0.20
- Track color: interpolates green → amber → red
- Below slider: qualitative label (e.g. "Stable — corporate professional") updates live
- No validation — has default.

#### Field: Cash flow coverage ratio (CF_ratio)
- Label: "Monthly income ÷ monthly repayment"
- Tooltip: "If your salary is SAR 18,000/month and your repayments total SAR 13,333, your ratio is 1.35×."
- Input: number, 0.5–5.0, step 0.01
- Unit badge: "×"
- Below input: "Calculate automatically →" — teal link, 13px, expands CFSubCalculator
- Validation: required. Error if < 0.5.

**CFSubCalculator (expandable):**
- Appears below CF field with 200ms height slide-down
- Two sub-fields: "Monthly income (SAR)" and "Monthly repayment (SAR)"
- Live result: "CF ratio = 1.35×" in JetBrains Mono teal 20px
- "Use this →" button: fills CF_ratio field and collapses panel
- Collapses if user clicks CF_ratio field directly

#### Field: Total debt (D)
- Label: "Total outstanding debt"
- Tooltip: "All loans combined: mortgage balance, vehicle loans, personal loans. Include everything."
- Input: number / formatted with comma separators
- Unit badge: "SAR"
- Validation: required, must be > 0.

#### Field: Total assets (A)
- Label: "Total assets you own"
- Tooltip: "Property value, savings, vehicle value, investments — everything you own. Must exceed your total debt."
- Input: number / formatted with comma separators
- Unit badge: "SAR"
- Validation: required, must be > D. Cross-field error: "Total assets must exceed total debt."

#### Calculate Button
- "Calculate L* →" — full-width primary teal button, height 44px
- Loading state: "Calculating…" + spinner
- Position: below last field / sticky on mobile

**Form validation flow:**
1. On blur: validate individual field, show field error
2. On submit: validate all fields, show all errors, scroll to first error
3. If cross-field error (A ≤ D): highlight both fields, show error below A field
4. If ROI ≤ r: show pre-computation warning; calculation still runs but result shows NEG_SPREAD

---

### 2.2 — Results Column

#### State: EMPTY (no results yet)
Centered placeholder:
```
[Lucide Calculator icon, 40px, ink-tertiary]
Enter your numbers
on the left to calculate
your optimal leverage threshold
```
Inter 16px / `ink-tertiary` / centered.

#### State: CALCULATING
Skeleton screens for each result component (shimmer animation):
- Banner skeleton: 88px height
- KPI row: 3 card skeletons
- Gauge: 170px circle placeholder
- Waterfall: 9 row skeletons

#### State: RESULTS (after first computation)

**Component order (top to bottom):**

1. **DecisionBanner** (full-width, 88px desktop / 72px mobile)
2. **KPIRow** (3-card horizontal row)
3. **GaugeVisualization** (centered, 300px wide)
4. **EquationWaterfall** (collapsible, default expanded on desktop / collapsed on mobile)
5. **FinancialScoresPanel** (2×2 grid)
6. **AIInsightPanel** (full-width, streaming)

**Recalculation behavior:**
- When user edits any form field and re-submits:
- Results column shows skeleton overlay on existing results (don't blank them — reduce opacity to 50%, show shimmer)
- New results animate in on completion
- AI panel resets to loading state and restarts stream

**Scroll behavior:**
- On first calculation: smooth scroll to top of results column
- On mobile: smooth scroll to DecisionBanner position

---

### 2.3 — Component Detail: DecisionBanner

**Height:** 88px desktop / 72px mobile  
**Border-radius:** `radius-lg`  
**Border:** 1px status-border + left-border 3px status-bright  
**Margin-bottom:** 20px

Layout: `display: flex; align-items: center; gap: 16px; padding: 0 20px`

**Left:** Status icon (Lucide, 24px, status-bright color)
**Middle:** 
- Status label (Space Grotesk 20px / weight 700 / status-bright)
- Message (Inter 13px / status-mid)
**Right (desktop only):** Delta indicator — "Δ +7.0% · β 1.10 · α 0.85" in JetBrains Mono 12px / `ink-tertiary`

**NEG_SPREAD additional content:**
Below the message: "No safe borrowing ceiling exists at this return spread." — Inter 12px / `negspread-bright`

---

### 2.4 — Component Detail: KPIRow

Three cards at equal width, 12px gap.

**Card 1 — Current Ratio:**
- Label: "CURRENT RATIO" — `Label` style
- Value: debt_ratio × 100, 1 decimal, JetBrains Mono 32px, color = status
- Sub: "of assets are financed by debt"

**Card 2 — Safe Ceiling L*:**
- Label: "SAFE CEILING" — with Lucide `Lock` 12px if cap applied
- Value: L_star × 100, 1 decimal, JetBrains Mono 32px, `teal-vivid`
- Sub: "optimal leverage threshold"
- Lock tooltip: "Capped at 70% — international regulatory ceiling applied"

**Card 3 — Headroom:**
- Label: "HEADROOM"
- Value: if > 0: formatSAR(headroom), JetBrains Mono 28px (smaller if large number), `optimal-bright`
- Value: if = 0: "SAR 0", `suboptimal-bright`
- Sub: if > 0: "before crossing the threshold"
- Sub: if = 0: "threshold already exceeded"

All values animate with `useCountUp` over 1200ms on first render.  
Entrance: staggered 80ms between cards, y -12→0 + opacity.

---

### 2.5 — Component Detail: GaugeVisualization

**Dimensions:** SVG 300×160, centered  
**Placed:** Between KPIRow and EquationWaterfall  
**Padding:** 24px inside `surface-raised` card

SVG elements (detailed):
- Arc radius: 120px, center at (150, 150)
- Track: full 180° sweep, stroke 16px, `--gauge-track` (#182035)
- Zone 1 (OPTIMAL): 0° → (L_star × 0.85) angle, stroke `optimal-mid` (#16A34A)
- Zone 2 (CAUTION): (L_star × 0.85) → L_star angle, stroke `caution-mid` (#D97706)
- Zone 3 (SUBOPTIMAL): L_star → 180°, stroke `suboptimal-mid` (#DC2626)
- Threshold marker: 2.5px teal line at L_star angle, 8px length inside/outside arc
- Teal dot at threshold arc position: 4px radius circle, `teal-vivid`
- L* label: "L* {val}%" above threshold in JetBrains Mono 11px / `teal-vivid`
- Needle: white 2px line from center to arc, at debt_ratio angle
- Hub: 8px circle at center, `surface-raised` fill, `border-raised` stroke
- Center readout: JetBrains Mono 26px / `ink-primary` — debt_ratio %
- Sub readout: Inter 11px / `ink-secondary` — "current debt ratio"
- Arc end labels: "0%" left / "70%" right, Inter 11px / `ink-tertiary`

**NEG_SPREAD state:**
- Entire arc is `negspread-mid` (#E8305A)
- No zones, no needle
- Center shows "−" symbol instead of ratio
- Sub: "No safe threshold — return spread is negative"

**Animation sequence (on each new result):**
1. Track arc draws: 0–300ms, stroke-dasharray 0→283
2. Zone 1 fills: 200–400ms
3. Zone 2 fills: 350–500ms
4. Zone 3 fills: 450–600ms
5. Threshold marker fades in: 500–700ms
6. Needle springs to position: 600–1200ms, spring physics (stiffness 55, damping 12)
7. Center number counts up: 600–1800ms

---

### 2.6 — Component Detail: EquationWaterfall

**Container:** `surface-raised` / `border-base` / `radius-lg`  
**Header:** "How the result was calculated" (Inter 15px / weight 500) + chevron toggle  
**Default:** Expanded on desktop / Collapsed on mobile (toggle to expand)

Table columns and widths:
- Step number: 32px, JetBrains Mono 12px / `ink-tertiary`
- Label: 180px min, Inter 13px / `ink-secondary`
- Formula: 160px min, JetBrains Mono 12px / `ink-tertiary`
- Calculation: 140px min, JetBrains Mono 12px / `ink-secondary`
- Result: 80px, JetBrains Mono 14px / weight 500 / right-aligned / color-coded

Row color coding:
- Steps 1–6: default `surface-raised`, `border-muted` bottom divider
- Step 7 (L* raw): `surface-subtle` background — slightly darker tint
- Step 8 (L* capped): `surface-subtle` + left border 2px `teal-vivid` — PRIMARY OUTPUT
- Step 9 (Decision): `surface-subtle` + result in full status color

Result column colors:
- Positive Δ (Step 2): `optimal-bright`
- Negative Δ: `suboptimal-bright`
- α value (Step 3): `ink-primary`
- β value (Step 4): `ink-primary`
- Numerator (Step 5): `teal-vivid`
- Denominator (Step 6): `teal-vivid`
- L* raw > 0.70: `ink-secondary` with "(uncapped)" annotation
- L* final: `teal-vivid` bold
- Decision: status-bright

**Animation:** Rows slide in from x: -8 with staggered 30ms delay per row, on first render only.

**Mobile:** Horizontal scroll wrapper. Minimum table width 540px.

---

### 2.7 — Component Detail: FinancialScoresPanel

**Layout:** 2×2 grid, 12px gap  
**Background per card:** `surface-raised` / `border-base` / `radius-lg` / padding 20px

**Score Ring (SVG, 88×88):**
- Outer circle: r=34, stroke 8px, `border-raised` (track)
- Progress circle: r=34, stroke 8px, status-color, stroke-dasharray computed from score
  - Full circle circumference: 213px (2π × 34)
  - At score 100: dasharray = 213 213, dashoffset = -53 (start from top)
  - At score N: dasharray = (N/100 × 213) 213
- Stroke-linecap: round
- Rotation: transform="rotate(-90 44 44)" to start from top
- Center: JetBrains Mono 20px / weight 600 / status-color
- Below center: 3-letter qualifier in Inter 10px / uppercase / status-color

**Score colors:**
- ≥ 70: `optimal-mid` (#16A34A)
- 40–69: `caution-mid` (#D97706)
- < 40: `suboptimal-mid` (#DC2626)

**Below ring:**
- Score label: Inter 13px / weight 500 / `ink-primary`
- Description: Inter 12px / `ink-secondary` / centered / line-height 1.5

**Animation:**
- Ring stroke-dasharray animates from 0 to final value, 1000ms ease-smooth
- Number counts up with useCountUp, 1000ms
- Staggered: 0ms / 100ms / 200ms / 300ms per card

---

### 2.8 — Component Detail: AIInsightPanel

**Container:** `surface-raised` / `border-base` / `radius-lg` / padding 24px

**Header row:**
- Lucide `Brain` 18px / `teal-vivid`
- "AI analysis" — Inter 16px / weight 500
- "Powered by Claude" — Inter 11px / `ink-tertiary`
- Right: Regenerate ghost button with Lucide `RefreshCw` 14px (appears only in AI_COMPLETE state)
- Separator: 1px `border-muted`, margin 12px 0

**State: AI_IDLE (before computation):**
- Center: "Run an analysis to see AI insights"
- Inter 14px / `ink-tertiary` / padding 32px

**State: AI_LOADING (computing, not yet streaming):**
- "Analyzing your leverage situation…" — Inter 14px / `ink-secondary`
- Three skeleton lines (shimmer), 80% / 90% / 65% width
- Pause: 400ms before first stream character appears

**State: AI_STREAMING:**
- Text renders character by character from stream
- Blinking cursor `|` at end, 1px `teal-vivid`, 700ms CSS animation step(1)
- Section headers appear when JSON boundary detected:
  - "Executive Summary" → renders as highlighted teal-accented card first
  - Other sections appear progressively as streaming fills them

**State: AI_COMPLETE:**
Eight sections in order:

Section 1 — Executive Summary:
- Card: `surface-sunken` bg / left-border 2px `teal-vivid` / `radius-sm` right / padding 16px
- Label: "EXECUTIVE SUMMARY" — 10px / uppercase / `ink-tertiary`
- Content: Inter 15px / `ink-primary` / line-height 1.65

Section 2 — Risk Assessment:
- Label: "RISK ASSESSMENT"
- Left border color: `caution-mid` if notable risk, `border-base` if minimal
- Content: Inter 14px / `ink-secondary`

Section 3 — Leverage Analysis:
- Label: "LEVERAGE ANALYSIS"
- Standard card, no special accent
- Content: Inter 14px / `ink-secondary`

Section 4 — Strengths:
- Label: "STRENGTHS"
- Each item: Lucide `Check` 14px / `optimal-bright` + Inter 13px / `ink-secondary` / gap 8px
- Background: `optimal-bg` card

Section 5 — Weaknesses:
- Label: "WATCH"
- Each item: Lucide `AlertTriangle` 14px / `caution-bright`
- Background: `caution-bg` card

Sections 4+5 displayed side by side (2-column grid, 12px gap) on desktop, stacked on mobile.

Section 6 — Recommendations:
- Label: "RECOMMENDATIONS"
- Three numbered action cards (01 / 02 / 03)
- Background: `surface-overlay` / `radius-md`
- Number: JetBrains Mono 11px / `ink-tertiary`
- Text: Inter 13px / `ink-secondary` / line-height 1.5

Section 7 — Future Considerations:
- Label: "FUTURE CONSIDERATIONS"
- Standard paragraph, `ink-secondary`

Section 8 — Personalized Guidance:
- Special callout card: `surface-overlay` / border `border-strong` / `radius-lg`
- Teal left accent bar (3px)
- Content: Inter 15px / `ink-primary` / slightly larger / line-height 1.65

**State: AI_ERROR:**
- "Unable to generate insights at this time."
- Lucide `AlertCircle` 16px / `suboptimal-bright`
- "Try again" ghost button

---

## PAGE 3 — SCENARIO LAB

**Route:** `/scenarios`  
**Title:** `Scenario Lab | OLTEE`  
**Purpose:** Simulate how changes in market conditions affect the user's L* threshold.

**Guard:** If no baseline inputs exist → redirect to `/analyze` with toast: "Run an analysis first to use the Scenario Lab."

**State machine:**
```
BASELINE_ONLY → [click preset] → PRESET_ACTIVE
PRESET_ACTIVE → [adjust slider] → CUSTOM_SCENARIO
CUSTOM_SCENARIO → [click preset] → PRESET_ACTIVE
Any state → [reset] → BASELINE_ONLY
```

---

### Layout Structure

**Desktop:** Single full-width column, max-width 1280px  
**Sections stacked vertically:**
1. Baseline Summary Bar
2. Preset Grid
3. Manual Slider Panel
4. Comparison Charts (L* + Headroom)
5. Sensitivity Analysis
6. AI Scenario Commentary

---

### 3.1 — Baseline Summary Bar

Height: 64px  
Background: `surface-raised` / `border-base` / `radius-lg`  
Padding: 0 24px  
Layout: horizontal row, gap 32px, dividers between items

Items:
- "Your baseline" label (10px / uppercase / `ink-tertiary`) + green "OPTIMAL" pill
- "Safe ceiling L*" → value in `teal-vivid`
- "Current debt ratio" → value in `ink-primary`
- "Return spread" → value in `optimal-bright` (or `suboptimal-bright` if negative)
- "Headroom" → value in `optimal-bright`
- Right-most: "Reset all →" ghost button (only visible when scenarios are active)

---

### 3.2 — Preset Grid

**Label:** "Scenario presets" (section-label style)  
**Layout:** 4×2 grid, 10px gap (2×4 on tablet, 1×8 on mobile)

Each preset card (ScenarioPresetCard):
- Background: `surface-raised` / `border-base` / `radius-lg` / cursor pointer
- Hover: `border-strong`
- Selected: `border: 1px solid teal-dim` + `teal-ghost` background tint
- Danger preset (rate +5%, combined stress): `suboptimal-border` tint on border
- Padding: 14px

Card anatomy:
```
[Scenario name]  14px / weight 500
[Description]    12px / ink-secondary / line-height 1.4 / margin-bottom 10px
[1px border-muted divider]
[L* arrow]       13px JetBrains Mono   [Status badge]
```
L* arrow color: status color of the scenario result  
Status badge: small pill — "Optimal" / "Caution" / "Suboptimal"

**Computation:** All 8 presets computed immediately when page loads (using baseline inputs). Results are instant (pure JS, no async).

**Multi-select:** User can select up to 4 presets simultaneously for chart comparison. Selected cards show teal border. "Compare selected →" button appears when 2+ selected.

---

### 3.3 — Manual Slider Panel

**Title:** "Adjust manually — live recalculation"  
**Background:** `surface-raised` / `border-base` / `radius-lg` / padding 20px

4 sliders, each `ScenarioSlider`:

Slider 1 — Interest rate (r):
- Range: baseline_r ± 5%, step 0.25%
- Center = baseline (no change)
- Display: "+{delta}%" or "−{delta}%" in teal / red
- Zero-crossing visual: center tick mark with "No change" label

Slider 2 — Annual return (ROI):
- Range: 50%–150% of baseline (multiplier)
- Display: actual % value + delta from baseline

Slider 3 — Asset value (A):
- Range: 60%–130% of baseline
- Display: formatted SAR value + change

Slider 4 — Cash flow / income (CF_ratio):
- Range: 50%–150% of baseline
- Display: ×value + direction

Each slider row:
- Left: parameter name (Inter 13px / `ink-secondary`)
- Center: slider track + thumb
- Right: current value (JetBrains Mono 13px / `teal-vivid`)
- Below all sliders: "Reset all sliders" ghost button

Recomputation: Debounced 150ms after slider stop. Results column updates immediately.

---

### 3.4 — Scenario Comparison Charts

**Title:** "Impact on your leverage threshold"

**Chart 1 — L* Comparison Bar Chart:**
- Recharts BarChart
- X-axis: scenario names (truncated to 10 chars)
- Y-axis: L* % (0–75%), `ink-tertiary` labels
- Baseline bar: `teal-mid` fill at 60% opacity (always first)
- Scenario bars: status-color fill
- Reference line 1: current Debt_Ratio — dashed `ink-secondary` — labeled "Your debt ratio"
- Reference line 2: 0.70 cap — dotted `border-strong` — labeled "Hard cap"
- Custom Recharts tooltip: `surface-overlay` / `radius-md` / 1px `border-raised` / Inter 13px
  - Shows: scenario name, L*, debt ratio, headroom, status
- Bar animation: 400ms ease-out on mount

**Chart 2 — Headroom Comparison:**
- Same X-axis
- Y-axis: SAR value
- Bars: green if headroom > 0 / red if 0
- Zero-line: solid `border-strong`
- Custom tooltip: scenario name + headroom SAR

Both charts: transparent background, no box border, grid lines in `border-base` at 30% opacity.

---

### 3.5 — Sensitivity Analysis

**Label:** "Single-variable sensitivity"  
**Background:** `surface-raised` / `radius-lg` / padding 20px

**Controls:**
- "Sweep variable:" label + Radix Select dropdown
  - Options: Interest rate (r) / Annual return (ROI) / Income stability (σ) / CF ratio
- "Run sweep →" ghost button

**Chart (SensitivityChart) — Recharts LineChart:**
- X-axis: parameter value across its valid range
- Y-axis: resulting L* (0–0.70)
- Line: `teal-vivid` fill, smooth curve
- Color regions behind line:
  - Green fill: zones where status = OPTIMAL (below debt_ratio line)
  - Amber fill: CAUTION zone
  - Red fill: SUBOPTIMAL zone
- Reference line: vertical at current baseline value (`ink-secondary` dashed, labeled "Current")
- Reference line: horizontal at current Debt_Ratio (`caution-mid` dashed, labeled "Your ratio")
- Inflection point: orange dot where status changes, labeled "Status changes here"

**Purpose:** Shows exactly which parameter value would tip the user from OPTIMAL to CAUTION.

---

### 3.6 — AI Scenario Commentary

Appears below charts when a scenario is selected.  
**Background:** `surface-raised` / left-border 2px `teal-dim` / `radius-lg` / padding 16px

Content: Two-sentence AI commentary (from API `/api/ai-insights` with scenario commentary prompt).  
Appears with 400ms fade after scenario selection.  
Cached per scenario (no re-fetch if scenario re-selected).

---

## PAGE 4 — MONTE CARLO

**Route:** `/montecarlo`  
**Title:** `Monte Carlo Analysis | OLTEE`  
**Purpose:** Show probability distribution of L* across thousands of stochastic futures.

**Guard:** If no baseline → redirect to `/analyze` with toast: "Run an analysis first."

**State machine:**
```
NOT_RUN → [click Run simulation] → RUNNING (0% → 100% progress)
RUNNING → [simulation complete] → COMPLETE
COMPLETE → [change config] → NOT_RUN
```

---

### Layout Structure

Single column, max-width 1280px, sections stacked.

---

### 4.1 — Page Header

```
[Title: "Probability analysis"]  Space Grotesk 28px / ink-primary
[Sub: "What happens to your leverage across N possible futures?"]  Inter 14px / ink-secondary
```

---

### 4.2 — Simulation Configuration

**Background:** `surface-raised` / `border-base` / `radius-lg` / padding 20px

**Iteration selector:**
Label: "Scenarios to simulate:"
Four toggle pills: `[ 1,000 ] [ 5,000 ] [ 10,000★ ] [ 50,000 ]`
- Active: `teal-vivid` bg / `ink-inverse` text
- Inactive: `surface-overlay` / `border-base` / `ink-secondary`
- ★ = default selection
- On 50,000: tooltip "Takes ~3 seconds to run"

**Advanced settings (collapsed by default):**
Toggle: "Advanced settings ∨"
When expanded:
- σ_ROI slider: "Return variance" (0.01–0.10, default 0.03)
- σ_r slider: "Rate variance" (0.005–0.03, default 0.01)
- σ_CF slider: "CF ratio variance" (0.05–0.30, default 0.15)
- σ_σ slider: "Volatility variance" (0.02–0.10, default 0.05)
- "Restore defaults" ghost link

**Run button:**
- "Run simulation — {N} scenarios →" — full-width primary teal, height 44px
- Loading state: replaced by progress bar
  - `ProgressBar`: teal fill, 4px height, `radius-full`, updates every 500ms yield
  - Label: "Simulating… {progress}% of {N} scenarios"
  - "Cancel" ghost button (right-aligned)

---

### 4.3 — Probability Cards (post-run)

Three cards, 3-column row, 12px gap.

**Card 1 — P(OPTIMAL):**
- Background: `optimal-bg` / border: `optimal-border`
- Value: "{X}%" — JetBrains Mono 36px / weight 700 / `optimal-bright`
- Label: "OPTIMAL" — 11px / uppercase / `optimal-mid`
- Sub: "of simulated futures stay in the productive zone"

**Card 2 — P(CAUTION):**
- Background: `caution-bg` / border: `caution-border`
- Value: `caution-bright`
- Sub: "of futures enter the caution zone"

**Card 3 — P(SUBOPTIMAL):**
- Background: `suboptimal-bg` / border: `suboptimal-border`
- Sub: "of futures cross the suboptimal threshold"

Animation: Cards scale in from 0.9 with stagger 100ms apart.

---

### 4.4 — Distribution Histogram

**Title:** "L* distribution across {N} simulated futures"  
**Background:** `surface-raised` / `radius-lg` / padding 20px

**Recharts BarChart:**
- Data: 20 histogram bins over [0, 0.70]
- X-axis: bin ranges ("0–3.5%", "3.5–7%", etc.), `ink-tertiary`, 11px
- Y-axis: frequency (% of iterations), hidden labels
- Bar fill: based on bin's zone position relative to current debt_ratio:
  - Bar represents L* values above DR (safe zones): `optimal-mid`
  - Bar overlaps DR (transition zone): `caution-mid`
  - Bar represents L* below DR (suboptimal): `suboptimal-mid`
- Reference lines:
  - P5: `ink-secondary` dashed 1px, labeled "5th %ile"
  - P50: `teal-vivid` solid 2px, labeled "Median L* = {val}%"
  - P95: `ink-secondary` dashed 1px, labeled "95th %ile"
  - Current DR: `caution-mid` dashed 1.5px, labeled "Your debt ratio"
  - 0.70 cap: `ink-tertiary` dotted 1px, labeled "Hard cap"

Custom tooltip: shows bin range, count, frequency %, zone label.

Bar entrance: 600ms staggered animation from height 0.

---

### 4.5 — Confidence Range Display

**Title:** "L* safe threshold — confidence intervals"  
**Layout:** 5-column row

Cells: P5 / P25 / P50 (highlighted) / P75 / P95

Each cell:
- Background: `surface-raised` / `radius-lg` / padding 12px / centered
- Label: "P{N}" — 11px / uppercase / `ink-tertiary`
- Value: JetBrains Mono 18px / weight 600 / `ink-primary`
- P50 cell: `border: 1px solid teal-dim` + `teal-ghost` background

**Visual range bar below the 5 cells:**
- Single horizontal bar spanning full width
- Background: `border-base`
- Fills: P5–P95 range shown as colored zone (opacity-blended status colors)
- Current DR marked with a small amber triangle above the bar
- P50 marked with a teal tick

---

### 4.6 — AI Monte Carlo Summary

**Background:** `surface-sunken` / left-border 2px `ink-tertiary` / `radius-lg` / padding 16px

Label: "AI INTERPRETATION" — 10px / uppercase / `ink-tertiary`  
Content: 3-sentence AI summary (from `/api/ai-insights` with MC prompt)  
Loads after simulation completes with 500ms delay.

---

## PAGE 5 — REPORT

**Route:** `/report`  
**Title:** `Download Report | OLTEE`  
**Purpose:** Let the user configure and download a professional PDF report.

**Guard:** If no baseline → redirect to `/analyze` with toast.

---

### Layout Structure

**Desktop:** 2-column (section toggles left / report preview right), 24px gap  
**Mobile:** Single column, toggles first, preview below, download button sticky bottom

---

### 5.1 — Page Header

```
[Title: "Your OLTEE report"]  Space Grotesk 28px
[Sub: "Download a professional summary of your leverage analysis."]  Inter 14px / ink-secondary
```

---

### 5.2 — Section Toggles (left column)

**Background:** `surface-raised` / `border-base` / `radius-lg` / padding 20px  
**Title:** "Include in report" — Inter 14px / weight 500

Each toggle row:
- Left: section name (Inter 14px / `ink-primary`) + description (Inter 12px / `ink-secondary`)
- Right: Radix Switch (on/off)
- Divider: 1px `border-muted` between rows

Toggle rows:
1. "Executive summary" — AI-generated plain-language overview — ON by default
2. "Input summary" — All 7 inputs in a formatted table — ON by default
3. "Equation walkthrough" — All 9 calculation steps shown — ON by default
4. "Decision result" — Banner + KPI values — ON by default (non-toggleable)
5. "Financial intelligence scores" — Stability, health, efficiency, resilience — ON by default
6. "AI recommendations" — 3 personalized action items — ON by default
7. "Scenario comparison" — Scenario chart and table
   - If no scenarios run: disabled, label reads "Run scenarios first to include"
   - If scenarios available: ON by default
8. "Monte Carlo analysis" — Probability table and summary
   - If not run: disabled
   - If complete: OFF by default (user must opt in — it's long)

**Footer row (below toggles):**
- Left: "Estimated {N} pages" — Inter 13px / `ink-tertiary`
- Right: two buttons:
  - "Copy link" — ghost button, Lucide `Link` — copies shareable URL with encoded inputs
  - "Download PDF" — primary teal, Lucide `Download`

**Shareable URL format:**  
`/analyze?roi=12&r=5&t=15&sigma=0.20&cf=1.35&d=550000&a=920000`  
URL params auto-populate form on landing. Toast: "Analysis loaded from shared link."

---

### 5.3 — Report Preview (right column)

**Background:** `surface-raised` / `border-base` / `radius-lg` / padding 20px

**Preview header:**
- "Preview" — 13px / `ink-secondary`
- "Page {active} of {total}" — 12px / `ink-tertiary`

**Cover page mockup:**
- Simulated A4 page (aspect ratio 210:297) at 60% scale
- Background: `surface-overlay` (`border: 1px solid border-raised`)
- Contents:
  - "OLTEE" logotype — large centered
  - "Optimal Leverage Threshold Engine" — subtitle
  - Status badge (colored)
  - "Generated: {date}" / "Report ID: OLTEE-{hash}"
  - "Built by Faisal Alghamdi" attribution

**Table of contents preview (below cover):**
List of included sections, numbered, grayed-out for excluded sections.

---

### 5.4 — PDF Generation

**Trigger:** "Download PDF" button click  
**State:** Button shows "Generating…" with spinner, disabled

**jsPDF document structure:**
- Page 1: Cover (OLTEE logotype, status badge, date, report ID)
- Page 2: Executive Summary (from AI)
- Page 3: Input Summary (7-row table with values)
- Page 4: Equation Walkthrough (9-step table)
- Page 5: Decision Result + KPI values + Financial Scores
- Page 6: AI Recommendations (3 items)
- Page 7 (if included): Scenario Comparison table
- Page 8 (if included): Monte Carlo probability + percentile table
- Last page: Disclaimer + "Not financial advice" footer

**Filename:** `oltee-report-{YYYY-MM-DD}-{status}.pdf`

**After generation:** `URL.createObjectURL(blob)` → auto-download trigger  
**Error state:** "Unable to generate report. Try again." with error details in console.

---

## USER FLOW SPECIFICATION

### Flow 1 — First-Time User (Primary Path)

```
/ (Landing)
  → [Analyze your leverage button]
  → /analyze (EMPTY state)
  → [Fills 7 form fields]
  → [Clicks Calculate L*]
  → /analyze (CALCULATING → RESULTS)
  → [Reads DecisionBanner + KPIs]
  → [Reads GaugeVisualization]
  → [Expands EquationWaterfall]
  → [Reads FinancialScores]
  → [Reads streaming AI analysis]
  → [Clicks "Scenario Lab" in nav]
  → /scenarios (baseline loaded automatically)
  → [Clicks "Rate hike +2%" preset]
  → [Reads impact on L*]
  → [Adjusts rate slider]
  → [Reads comparison chart]
  → [Clicks "Monte Carlo" in nav]
  → /montecarlo
  → [Clicks "Run simulation"]
  → [Watches progress bar]
  → [Reads probability cards]
  → [Reads distribution histogram]
  → [Clicks "Report" in nav]
  → /report
  → [Configures sections]
  → [Clicks "Download PDF"]
  → [PDF saved]
```

### Flow 2 — Return User (Recalculation)

```
/analyze (has prior session state)
  → [Edits ROI field]
  → [Clicks Calculate]
  → [Results update with skeleton overlay]
  → [New results animate in]
  → [AI panel streams new insights]
```

### Flow 3 — Shared Link User

```
/analyze?roi=12&r=5&... (URL params present)
  → Form auto-populated from URL params
  → Toast: "Analysis loaded from shared link."
  → [Page computes automatically]
  → [Results shown immediately]
```

### Flow 4 — Error Recovery

```
/analyze
  → [User enters ROI ≤ r]
  → [Clicks Calculate]
  → [NEG_SPREAD banner appears]
  → [Equation waterfall shows Δ as negative in red]
  → [AI panel: "Your investment return is below your borrowing cost..."]
  → [User edits ROI upward]
  → [Clicks Calculate]
  → [New status (OPTIMAL/CAUTION/SUBOPTIMAL) computed]
```

### Flow 5 — Mobile User

```
/ (Landing, mobile)
  → [Taps "Analyze your leverage →"]
  → /analyze (single column, form at top)
  → [Fills form fields (native keyboard)]
  → [Sticky "Calculate" button at bottom]
  → [Taps Calculate]
  → [Page auto-scrolls to results below form]
  → [Reads DecisionBanner (72px, compact)]
  → [KPI cards: single column stack]
  → [Gauge: 240×134px]
  → [Waterfall: collapsed by default, tap to expand + horizontal scroll]
  → [Score rings: 2×2 compact]
  → [AI panel: reads streaming text]
```

### Flow 6 — No Baseline Guard

```
/scenarios (direct navigation, no baseline)
  → [Redirect to /analyze]
  → Toast (bottom-center, 4s): "Run an analysis on the Analyze page first."
  → /analyze (EMPTY state)
```

---

## STATE PERSISTENCE

**Session storage (cleared on tab close):**  
- `oltee_inputs` — last computed OLTEEInputs
- `oltee_outputs` — last computed OLTEEOutputs
- `oltee_scores` — last computed FinancialScores
- `oltee_ai` — last AI insights (to avoid re-fetching on page navigate)
- `oltee_scenarios` — ScenarioComparison (if run)
- `oltee_mc` — MonteCarloResult (if run)

**URL params (shareable):**  
`roi`, `r`, `t`, `sigma`, `cf`, `d`, `a` — all in user-facing % or raw value format.  
Parsed on `/analyze` mount. Triggers auto-computation if all required params present.

**Behavior on navigate between pages:**  
State persists in React context (OLTEEContext) wrapping the app. No re-fetch on tab switch.

---

## TOAST NOTIFICATIONS

**Position:** Bottom-center, 16px above viewport bottom  
**Library:** Sonner  
**Duration:** 4 seconds (auto-dismiss)

Toast types and triggers:
- "Shared link loaded" — on URL param auto-fill (info, `teal-vivid` icon)
- "Analysis complete" — on first calculation (success, green)
- "Run an analysis first" — on guarded nav (warning, amber)
- "Report downloaded" — on PDF save (success, green)
- "Unable to generate AI insights — check your API key" (error, red)
- "Simulation complete — 10,000 scenarios run" (success, green)

---

## ACCESSIBILITY REQUIREMENTS

- All interactive elements: visible focus ring (2px `teal-glow` outline, 2px offset)
- All icon-only buttons: `aria-label` attribute
- Gauge SVG: `role="img"` + `<title>` + `<desc>` with current ratio and status
- Score rings: `aria-label="Financial Stability score: 82 out of 100"`
- AI streaming panel: `aria-live="polite"` region for screen reader updates
- Form fields: explicit `<label>` elements, not just placeholder text
- Error messages: `role="alert"` for screen reader announcement
- Keyboard navigation: all interactive elements reachable via Tab / Shift+Tab
- Reduced motion: all animations respect `prefers-reduced-motion: reduce`
- Color: never relies on color alone (status labels + icons + text always accompany color)

---

*All specifications are implementation-ready.*  
*Next: Phase 3 — Core engine implementation.*
