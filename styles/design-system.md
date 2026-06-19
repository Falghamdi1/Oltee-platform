# OLTEE Design System
## Complete Specification — Phase 2 Design

**Author:** Faisal Alghamdi  
**Version:** 1.0  
**Status:** Approved for implementation

---

## 1. Design Philosophy

### The Central Premise

Most financial tools hide their math behind a "score" or a traffic light.  
OLTEE does the opposite: **the equation is the product.**

Every design decision flows from this. The formula is not decorative —  
it is the credibility mechanism. Showing the math is what makes a  
non-financial user trust the output.

### Three Design Commitments

**1. Earned trust through transparency**  
Show the calculation at every step. No black boxes. When L* = 70%,  
the user sees exactly why: each of the 9 steps is visible, labeled, and  
formatted so a layperson can follow them.

**2. Precision without intimidation**  
Financial precision aesthetics (monospaced numbers, fine rules, data density)  
without clinical coldness. The product needs to feel like a trusted advisor,  
not a spreadsheet or a bank's compliance tool.

**3. One bold choice, everything else quiet**  
The signature element (the live equation display) gets all the boldness.  
Everything else — spacing, color usage, typography weight — is deliberately  
restrained so the equation reads as the centrepiece.

---

## 2. Color System

### Color Philosophy

Dark-first. The subject matter (debt, risk, precision thresholds) belongs  
in a dark environment. A light interface would feel like a consumer banking  
app; the dark surface reads as professional instrument.

The teal accent is not a "brand color" — it represents mathematical output.  
Every teal element in the product is a computed value, a threshold, or an  
action that generates insight. This gives the accent semantic meaning.

### Base Palette

| Token | Hex | Role |
|-------|-----|------|
| `--surface-base` | `#05070F` | Page background |
| `--surface-raised` | `#0D1420` | Cards, panels |
| `--surface-overlay` | `#111B2E` | Modals, dropdowns |
| `--surface-sunken` | `#070A16` | Input fields |
| `--surface-subtle` | `#0A1022` | Subtle inset areas |

| Token | Hex | Role |
|-------|-----|------|
| `--border-base` | `#182035` | Default borders |
| `--border-raised` | `#1E2A42` | Elevated borders |
| `--border-muted` | `#111928` | Dividers |
| `--border-strong` | `#2A3A5C` | Hover/active borders |

| Token | Hex | Role |
|-------|-----|------|
| `--ink-primary` | `#EEF2FF` | Main text |
| `--ink-secondary` | `#7A8BA8` | Labels, captions |
| `--ink-tertiary` | `#3E5070` | Disabled, hints |
| `--ink-inverse` | `#0D1420` | Text on light surfaces |

### Brand Accent — Precision Teal

| Token | Hex | Usage |
|-------|-----|-------|
| `--teal-vivid` | `#00D4AA` | L* output values, CTA buttons, active states |
| `--teal-mid` | `#00A882` | Hover states, secondary teal |
| `--teal-dim` | `#006655` | Borders on teal elements |
| `--teal-ghost` | `rgba(0,212,170,0.08)` | Subtle teal backgrounds |
| `--teal-glow` | `rgba(0,212,170,0.15)` | Focus rings, selected states |

**Rule:** Teal appears ONLY on computed outputs (L*, scores, gauge fill in optimal zone)  
and on primary interactive elements (CTA button, active nav link, focused input).  
Never use teal for decoration.

### Status Colors — Four States

The four leverage states each have a complete sub-palette:

**OPTIMAL (Emerald)**
```
--status-optimal-bg:      #031A0E   (card background)
--status-optimal-border:  #0D5C2E   (card border)
--status-optimal-mid:     #16A34A   (icons, accents)
--status-optimal-bright:  #4ADE80   (text on dark bg)
--status-optimal-pulse:   rgba(74,222,128,0.12)  (glow)
```

**CAUTION (Amber)**
```
--status-caution-bg:      #1A0E00
--status-caution-border:  #7C3D0A
--status-caution-mid:     #D97706
--status-caution-bright:  #FCD34D
--status-caution-pulse:   rgba(252,211,77,0.12)
```

**SUBOPTIMAL (Red)**
```
--status-suboptimal-bg:     #1A0303
--status-suboptimal-border: #7F1D1D
--status-suboptimal-mid:    #DC2626
--status-suboptimal-bright: #FCA5A5
--status-suboptimal-pulse:  rgba(252,165,165,0.12)
```

**NEG_SPREAD (Deep Crimson — severity above SUBOPTIMAL)**
```
--status-negspread-bg:      #1A0208
--status-negspread-border:  #7C0B28
--status-negspread-mid:     #E8305A
--status-negspread-bright:  #FF8FAB
--status-negspread-pulse:   rgba(255,143,171,0.12)
```

### Gauge Zones (SVG-specific)

The semicircular gauge uses three arc fill colors:
```
Zone 1 — Optimal:    #16A34A  (0% → L*×0.85)
Zone 2 — Caution:    #D97706  (L*×0.85 → L*)
Zone 3 — Suboptimal: #DC2626  (L* → 70%)
Threshold line:      #00D4AA  (teal — the L* marker)
Track (empty):       #182035
Needle:              #EEF2FF
```

---

## 3. Typography

### Font Roles

**Display: Space Grotesk (Google Fonts)**
- Used for: hero headline, large KPI numbers, the OLTEE logotype
- Why: geometric sans with subtle optical character — the "G" and "R"  
  have a distinctive asymmetric quality that reads as engineered rather  
  than generic. Used at large sizes only. Restraint is the point.
- Weights used: 500 (medium), 700 (bold) only

**Body: Inter (Google Fonts)**  
- Used for: all body text, labels, form fields, navigation, descriptions
- Why: the neutral workhorse. Excellent at 13–16px. Reliable across  
  all scripts (important for mixed English/Arabic labels).
- Weights used: 400 (regular), 500 (medium) only

**Mono: JetBrains Mono (Google Fonts)**
- Used for: equation display, formula terms, computed values in results,  
  all numeric outputs in the equation waterfall
- Why: designed for code — the characters are engineered for legibility  
  at small sizes, and the = sign, ÷ sign, and ×  sign are perfectly formed.  
  Gives computed values a "calculated" feel distinct from labels.
- Weights used: 400 (regular), 500 (medium) only

### Type Scale

```
Display Hero:     Space Grotesk  64px / 68px   weight 700   tracking -0.04em
Display Large:    Space Grotesk  48px / 52px   weight 700   tracking -0.03em
Display Mid:      Space Grotesk  36px / 40px   weight 500   tracking -0.02em
Heading 1:        Inter          28px / 34px   weight 500   tracking -0.01em
Heading 2:        Inter          22px / 28px   weight 500   tracking 0
Heading 3:        Inter          18px / 24px   weight 500   tracking 0
Body Large:       Inter          16px / 26px   weight 400   tracking 0
Body:             Inter          15px / 24px   weight 400   tracking 0
Body Small:       Inter          13px / 20px   weight 400   tracking 0
Label:            Inter          12px / 16px   weight 500   tracking 0.04em  UPPERCASE
Caption:          Inter          11px / 16px   weight 400   tracking 0.02em
Equation Display: JetBrains     22px / 28px   weight 500   tracking 0.01em
Equation Small:   JetBrains     14px / 20px   weight 400   tracking 0.01em
Data Large:       JetBrains     36px / 40px   weight 500   tracking -0.01em
Data Medium:      JetBrains     24px / 28px   weight 500   tracking 0
Data Small:       JetBrains     16px / 20px   weight 400   tracking 0.02em
```

### Typography Rules

1. Label text above input fields: `Label` style, uppercase, `--ink-secondary`
2. Numbers in KPI cards: `Data Large` (JetBrains Mono)
3. Equation terms in the live equation: `Equation Display` (JetBrains Mono)
4. Field descriptions/tooltips: `Body Small`, `--ink-secondary`
5. Error messages: `Body Small`, status-suboptimal-bright
6. Section headings inside cards: `Heading 3`, `--ink-primary`
7. Navigation items: `Body`, weight 500, `--ink-secondary` → `--ink-primary` on active

---

## 4. Spacing System

Base unit: 4px

```
space-1:   4px    (micro — icon gaps, border offsets)
space-2:   8px    (tight — inline element gaps)
space-3:   12px   (compact — label-to-field)
space-4:   16px   (base — component internal padding)
space-5:   20px   (medium — between related elements)
space-6:   24px   (comfortable — card padding)
space-8:   32px   (section — between card sections)
space-10:  40px   (panel — between major panels)
space-12:  48px   (layout — top-level section gaps)
space-16:  64px   (page — section separators)
space-24:  96px   (hero — hero internal padding)
```

### Application Rules

- Card padding: `space-6` (24px) all sides
- Card padding on mobile: `space-4` (16px) all sides
- Gap between cards in a row: `space-5` (20px)
- Gap between form field groups: `space-6` (24px)
- Gap between label and input: `space-2` (8px)
- Gap between input and helper text: `space-2` (8px)
- Nav height: 60px fixed
- Page max-width: 1280px, centered
- Content column max-width: 1080px
- Form column width: 420px (desktop)
- Results column width: flex remaining

---

## 5. Border Radius

```
radius-xs:  2px   (subtle — table cells, tags)
radius-sm:  4px   (inputs, badges)
radius-md:  8px   (cards, buttons, tooltips)
radius-lg:  12px  (large cards, panels)
radius-xl:  16px  (modal dialogs)
radius-2xl: 24px  (hero elements)
radius-full: 9999px  (pills, score rings, gauge center)
```

---

## 6. Elevation & Depth

No drop shadows on the dark surface — they don't read.  
Depth is created by **surface color steps** and **border contrast**.

```
Level 0 — Page:     #05070F  (no border)
Level 1 — Card:     #0D1420  border: #182035
Level 2 — Raised:   #111B2E  border: #1E2A42
Level 3 — Float:    #162038  border: #2A3A5C
Level 4 — Overlay:  #1A253E  border: #344260
```

**Glow exception:** Status-state elements (DecisionBanner, active score rings,  
the gauge) use a box-shadow glow matching the status color at 12% opacity.  
This is the only use of box-shadow in the product.

---

## 7. Signature Element — The Live Equation Display

This is the most distinctive element in OLTEE. It appears in two places:

**Version A: Hero (landing page)**  
Full-size equation centered in the hero. Terms are initially muted.  
As the user hovers different terms, they highlight with a tooltip  
explaining what that variable means.

**Version B: Form sidebar (analyze page)**  
Compact equation that updates live as the user types. Each term  
lights up in teal as its corresponding field has a valid value.  
When all terms are filled, the equation animates the → L* result.

### Equation Display Specification

```
L* = [ (ROI − r) × (1 − T) ] ÷ [ r × (1 + σ × 0.5) × (1/CF) ]
```

Layout: horizontal, single line on desktop  
Font: JetBrains Mono 22px / weight 500  
Background: `--surface-sunken` with 1px border `--border-base`  
Border-radius: `radius-lg`  
Padding: 20px 24px  

**Term coloring logic:**
- Not yet entered: `--ink-tertiary` (#3E5070)
- Field has valid value: `--teal-vivid` (#00D4AA)
- Field has error: `--status-suboptimal-bright`
- L* result (output): `--teal-vivid`, font-weight 700, slightly larger (26px)
- Brackets and operators: `--ink-secondary` always

**Animation:** When a term activates, it transitions color over 300ms ease-out.  
When L* becomes computable, it appears with a 400ms scale-in from 0.85→1.0.

---

## 8. Component Specifications

### 8.1 NavigationBar

**Height:** 60px, `position: sticky; top: 0; z-index: 200`  
**Background:** `--surface-base` with `border-bottom: 1px solid --border-base`  
**Backdrop:** `backdrop-filter: blur(12px)` with 80% opacity background

Layout (desktop):
```
[OLTEE logotype]     [Analyze | Scenario Lab | Monte Carlo | Report]     [—]
 left-aligned          centered                                          right gap
```

**OLTEE logotype:**  
- "OLTEE" in Space Grotesk 18px / weight 700 / `--ink-primary`
- Below it: "Optimal Leverage Threshold Engine" in Inter 10px / `--ink-tertiary`
- Clicking → / (landing page)

**Nav links:**
- Inter 14px / weight 500
- Default: `--ink-secondary`
- Hover: `--ink-primary`, transition 150ms
- Active: `--ink-primary` + 2px teal underline below the text (not the full link height)
- Underline: `--teal-vivid`, border-radius 1px

**Mobile (< 768px):**  
Hamburger icon (Lucide `Menu`), opens a slide-down drawer.  
Drawer: full width, `--surface-overlay`, links stacked 48px each.

---

### 8.2 InputField

Standard form field for ROI, r, T, CF_ratio inputs.

```
[  LABEL               TOOLTIP-ICON  ]
[  ________________________________  ]
[  placeholder text              SAR ]
[  helper text or error message      ]
```

**Label row:**
- Label: `Label` style (Inter 12px, uppercase, weight 500, `--ink-secondary`, letter-spacing 0.04em)
- Tooltip icon: Lucide `HelpCircle` 14px, `--ink-tertiary`, Radix Tooltip on hover

**Input:**
- Height: 44px
- Background: `--surface-sunken`
- Border: 1px `--border-base` → `--border-strong` on hover → 1px `--teal-dim` + `box-shadow: 0 0 0 3px --teal-glow` on focus
- Border-radius: `radius-sm` (4px)
- Font: Inter 15px / `--ink-primary`
- Padding: 0 12px
- Right slot (unit badge): Inter 12px / `--ink-tertiary`, separated by 1px `--border-base`

**States:**
- Default: `--border-base`
- Hover: `--border-strong`
- Focus: `--teal-dim` border + teal glow
- Error: `--status-suboptimal-border` + error glow + error text below
- Disabled: 50% opacity, no hover/focus effects

**Error text:**
- Inter 12px / `--status-suboptimal-bright`
- Lucide `AlertCircle` 12px inline before text
- Appears below input with 8px gap, 200ms fade-in

---

### 8.3 VolatilitySlider

Custom slider for σ (income volatility). Not a standard HTML range input.

```
[LABEL                         BETA PREVIEW]
[  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○        ]
   Very stable                  Highly volatile
[  "Government employee"                    ]
```

**Track:**
- Height: 4px
- Background: `--border-raised`
- Fill: color interpolation from `--status-optimal-mid` (σ=0) → `--status-caution-mid` (σ=0.5) → `--status-suboptimal-mid` (σ=1.0)
- Border-radius: 2px

**Thumb:**
- 18px × 18px circle
- Background: `--ink-primary`
- Border: 2px `--surface-base`
- Box-shadow: `0 0 0 4px rgba(255,255,255,0.08)` on hover
- Scale 1.0 → 1.15 on hover, 300ms spring

**Labels below:**
- 6 tick marks at the volatility label positions (subtle 4px lines)
- Label text: Inter 11px / `--ink-tertiary` at "Very stable" (left) and "Highly volatile" (right)
- Current label and example: Inter 13px / `--ink-secondary` below slider, updates live

**Beta preview (right of label row):**
- "β = 1.10" — JetBrains Mono 13px / `--teal-vivid`
- Updates in real time as slider moves, 150ms fade between values

---

### 8.4 CFSubCalculator

Collapsible panel that appears below the CF_ratio field.

**Trigger:** "Calculate automatically →" in Inter 13px / `--teal-vivid`, underline on hover

**Expanded state:**
```
┌─────────────────────────────────────────┐
│  Monthly income           SAR [______]  │
│  Monthly repayment        SAR [______]  │
│                                         │
│  CF ratio = 1.35×         [Use this →] │
└─────────────────────────────────────────┘
```

- Container: `--surface-overlay` background, `--border-raised` border
- Border-radius: `radius-md`
- Appears with 200ms height animation (0 → content height)
- CF ratio result: JetBrains Mono 18px / `--teal-vivid`, updates live
- "Use this →" button fills the CF_ratio field and collapses the panel

---

### 8.5 DecisionBanner

The first result element. Full-width, 96px tall (desktop), 80px (mobile).

**OPTIMAL:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  ↗  OPTIMAL                                                          │
│     Your leverage is in the productive zone. Debt is working.       │
└─────────────────────────────────────────────────────────────────────┘
```
- Background: `--status-optimal-bg`
- Border: 1px `--status-optimal-border`, left border 3px `--status-optimal-bright`
- No `border-radius` on left edge (left border butts against it)
- Icon: Lucide `TrendingUp` 20px / `--status-optimal-bright`
- Status label: Space Grotesk 22px / weight 700 / `--status-optimal-bright`
- Message: Inter 14px / `--status-optimal-mid`

**CAUTION:** Same structure, amber palette  
**SUBOPTIMAL:** Same structure, red palette  
**NEG_SPREAD:** Same structure, crimson palette + additional "borrowing destroys value" emphasis

**Animation:**
- Entrance: scale(0.96) + opacity 0 → scale(1) + opacity 1 over 500ms, cubic-bezier(0.22, 1, 0.36, 1)
- Icon pulses once on entrance (scale 1 → 1.3 → 1 over 600ms)
- Box-shadow: `0 0 24px var(--status-*-pulse)` — the only glow used this way

---

### 8.6 KPI Cards (3-card row)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  CURRENT RATIO   │  │  SAFE CEILING    │  │  HEADROOM        │
│                  │  │                  │  │                  │
│    59.8%         │  │    70.0%  ⚙      │  │  SAR 94,000      │
│                  │  │                  │  │                  │
│  of assets are   │  │  optimal L*      │  │  before limit    │
│  financed by     │  │  threshold       │  │  is reached      │
│  debt            │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

- Card: `--surface-raised`, `--border-base`, `radius-lg`, padding `space-6`
- Label: `Label` style / `--ink-secondary` / uppercase
- Value: JetBrains Mono, `Data Large` (36px) / color depends on card:
  - Current Ratio: status-color (green/amber/red matching decision)
  - Safe Ceiling: `--teal-vivid` always (it's an output)
  - Headroom: `--status-optimal-bright` if > 0, `--status-suboptimal-bright` if 0
- Sublabel: Inter 13px / `--ink-secondary`
- `⚙` on Safe Ceiling: cap applied indicator — Lucide `Lock` 14px / `--ink-tertiary`, Radix Tooltip "Capped at 70% regulatory ceiling"

**Animation (on first appearance):**
- Cards enter staggered: 0ms, 80ms, 160ms delay
- Value counts up from 0 to target over 1200ms (JetBrains Mono, tabular-nums)
- useCountUp hook, easeOut timing

---

### 8.7 GaugeVisualization

The signature data visualization. Semicircular meter (180° arc).

**Dimensions:** 280px × 156px (SVG viewBox: 280 × 160)  
**Placed:** Center of results panel, above the equation waterfall

```
         L* = 70.0%
              ↓
    ╭────────●────────╮
   /  ████████░░░░░░░  \
  │   ████████░░░░░░░   │
   \       ↑           /
    ╰──────┃──────────╯
           ┃  ← needle
         59.8%
      Current Ratio
```

**SVG Structure:**
1. Track arc: strokeWidth 16, color `--border-raised`, 180° sweep
2. Zone arc 1 (optimal): emerald fill, 0° → (caution_start_angle)°
3. Zone arc 2 (caution): amber fill, caution_start → threshold_angle
4. Zone arc 3 (suboptimal): red fill, threshold_angle → 180°
5. Threshold marker: 2px teal line perpendicular to arc at L*
6. Needle: 2px white line from center to arc, with 8px filled circle at center
7. Center readout: JetBrains Mono 28px / `--ink-primary` (current %)
8. Below readout: Inter 12px / `--ink-secondary` "current debt ratio"
9. Arc end labels: "0%" left, "70%" right, Inter 11px / `--ink-tertiary`
10. L* label: "L* = XX%" above the threshold tick, Inter 11px / `--teal-vivid`

**Animation:**
- Track draws first (200ms stroke-dasharray animation)
- Zone arcs fill in sequence (200ms each, 100ms apart)
- Threshold marker appears (200ms fade)
- Needle springs to position (600ms spring, stiffness 60, damping 12)
- Center number counts up (1000ms)

**Color exception:** In NEG_SPREAD state, the entire arc fill is crimson.  
No zone breakdown — the concept of zones doesn't apply when spread is negative.

---

### 8.8 EquationWaterfall

Step-by-step breakdown of the 9 calculation steps.

**Layout:** Table-like, full width of results column
**Title:** "How the result was calculated" / Heading 3 / with a Lucide `ChevronDown` collapse toggle

```
┌──────────────────────────────────────────────────────────────────┐
│  How the result was calculated              ∨                    │
├────┬──────────────────┬──────────────────┬───────────┬──────────┤
│ 1  │ Actual debt ratio│ D ÷ A            │ 550K÷920K │  59.8%  │
│ 2  │ Return spread Δ  │ ROI − r          │ 12%−5%    │  +7.0%  │
│ 3  │ Tax efficiency α │ 1 − T            │ 1−0.15    │  0.850  │
│ 4  │ Risk coefficient β│ 1+(σ×0.5)       │ 1+(0.20×½)│  1.100  │
│ 5  │ Numerator        │ Δ × α            │ 0.07×0.85 │  0.0595 │
│ 6  │ Denominator      │ r×β×(1/CF)       │ ...       │  0.0407 │
│ 7  │ L* (raw)         │ Num ÷ Den        │ 0.0595÷.. │  1.460  │
│ 8  │ L* (capped)  ★   │ min(raw, 0.70)   │ min(1.46..)│  0.700 │
│ 9  │ Decision         │ DR vs L*         │ 59.8%<70% │  ✓ OPT │
└────┴──────────────────┴──────────────────┴───────────┴──────────┘
```

**Columns:**
- Step #: Inter 12px / `--ink-tertiary`, width 32px
- Label: Inter 14px / `--ink-secondary`, min-width 180px
- Formula: JetBrains Mono 13px / `--ink-tertiary`, min-width 160px
- Calculation: JetBrains Mono 13px / `--ink-secondary`, min-width 120px
- Result: JetBrains Mono 14px / weight 500 / color-coded, min-width 80px, right-aligned

**Row styling:**
- Default: 1px `--border-muted` bottom border
- Row 7 (L* raw): faint `--surface-overlay` background
- Row 8 (L* capped) ★: `--surface-raised` background, left-border 2px `--teal-vivid`
- Row 9 (Decision): `--surface-raised` background, result in status color

**Result value colors:**
- Positive spreads (Δ): `--status-optimal-bright`
- Negative spreads: `--status-suboptimal-bright`
- L* value: `--teal-vivid`
- Decision: matches banner status color

**Animation:** Rows appear staggered at 30ms intervals on first render

---

### 8.9 FinancialScores Panel

Four score rings in a 2×2 grid.

```
┌────────────────────────┬────────────────────────┐
│    ╭──────╮            │    ╭──────╮            │
│   ╱  82   ╲           │   ╱  91   ╲           │
│  ╱ STABLE  ╲          │  ╱ HEALTHY ╲          │
│  ╲          ╱         │  ╲          ╱         │
│   ╲________╱           │   ╲________╱           │
│  Financial Stability   │  Debt Health           │
│  How reliably cash     │  How productive your   │
│  flow covers debt      │  current debt is       │
├────────────────────────┼────────────────────────┤
│    ╭──────╮            │    ╭──────╮            │
│   ╱  67   ╲           │   ╱  75   ╲           │
│  ╱EFFICIENT ╲         │  ╱RESILIENT╲          │
│  ╲          ╱         │  ╲          ╱         │
│   ╲________╱           │   ╲________╱           │
│  Leverage Efficiency   │  Financial Resilience  │
│  How optimally you use │  Ability to absorb     │
│  borrowing capacity    │  adverse shocks        │
└────────────────────────┴────────────────────────┘
```

**Ring specs (SVG):**
- Outer diameter: 88px
- Track ring: strokeWidth 8, `--border-raised`
- Fill ring: strokeWidth 8, color based on score:
  - ≥ 70: `--status-optimal-mid`
  - 40–69: `--status-caution-mid`
  - < 40: `--status-suboptimal-mid`
- Center: score number in JetBrains Mono 22px / weight 500 / same color
- Below number: 3-letter qualifier ("STABLE" / "AT RISK" etc.)  
  in Inter 10px / uppercase / same color

**Card styling:**
- `--surface-raised` background
- `--border-base` border
- `radius-lg`
- padding `space-6`
- Hover: subtle border elevation to `--border-strong`, 150ms

**Animation:**
- Ring stroke-dasharray animates from 0 to final value over 1000ms
- Score number counts up with useCountUp
- Ring delay: 0ms, 100ms, 200ms, 300ms (staggered)

---

### 8.10 AIInsightPanel

Streaming text display for the 8-section AI analysis.

**Container:** Full width, `--surface-raised`, `--border-base`, `radius-lg`, padding `space-6`

**Header:**
```
[Brain icon]  AI Analysis                     [Regenerate]
              Powered by Claude
```
- Icon: Lucide `Brain` 18px / `--teal-vivid`
- "AI Analysis": Heading 2 / `--ink-primary`
- "Powered by Claude": Inter 12px / `--ink-tertiary`
- Regenerate: ghost button, Lucide `RefreshCw` 14px

**Loading state:**
```
┌──────────────────────────────────────────┐
│  Analyzing your leverage situation...    │
│                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░              │
└──────────────────────────────────────────┘
```
- Skeleton blocks: `--surface-overlay` background, `shimmer` animation
- Message: Inter 14px / `--ink-secondary`, animated ellipsis

**Streaming state:**
- Text appears character by character from the stream
- Blinking cursor `|` at end of current text: 1px `--teal-vivid`, 700ms blink
- Once section boundary detected in JSON, render section header

**Complete state — section layout:**
```
Executive Summary ─────────────────────────────
[Highlighted card: --surface-overlay background, left-border 2px --teal-vivid]
[Text: Inter 15px / --ink-primary]

Risk Assessment ────────────────────────────────
[Text block: amber left accent if meaningful risk present]

Strengths ──────────────────────────────────────
• [Item 1]    [each as separate line, Lucide Check 14px / optimal-bright]
• [Item 2]

Weaknesses ─────────────────────────────────────
• [Item 1]    [Lucide AlertTriangle 14px / caution-bright]

Recommendations ────────────────────────────────
[Three cards in a row, numbered 1/2/3, each with action verb bolded]

Personalized Guidance ──────────────────────────
[Final callout: --surface-overlay, --border-teal, slightly larger text]
```

---

### 8.11 ScenarioPresetGrid

8 clickable scenario cards in a 4×2 grid (desktop), 2×4 (mobile).

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  📈            │  │  🚨            │  │  📉            │  │  💼            │
│  Rate +2%      │  │  Rate +5%      │  │  ROI drops 30% │  │  Income −25%   │
│                │  │                │  │                │  │                │
│  Central bank  │  │  Severe cycle  │  │  Investment    │  │  Salary cut or │
│  hike          │  │  500bp         │  │  underperforms │  │  slowdown      │
│                │  │                │  │                │  │                │
│ ─────────────  │  │ ─────────────  │  │ ─────────────  │  │ ─────────────  │
│ L*: → 48.2%   │  │ L*: → 34.1%   │  │ L*: → 52.0%   │  │ L*: → 61.4%   │
│ Status: CAUTION│  │ Status: SUBOPT │  │ Status: CAUTION│  │ Status: OPTIMAL│
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

**Card specs:**
- `--surface-raised` default, `--border-base` border, `radius-lg`
- Cursor: pointer
- Hover: `--border-strong`, background lightens to `--surface-overlay`
- Active/selected: `--border-teal`, `--teal-ghost` background tint
- Transition: 150ms ease

**Result row** (below divider, only shown after scenario is computed):
- L* delta: JetBrains Mono 13px — green if improved, red if degraded
- Status: badge using status palette

---

### 8.12 ScenarioComparisonChart

Recharts grouped bar chart comparing baseline vs scenarios.

**Chart 1 — L* Threshold:**
- X-axis: scenario names (truncated at 12 chars), `--ink-tertiary`, 11px
- Y-axis: 0%–75%, `--ink-tertiary`, 11px
- Baseline bars: `--teal-mid` fill, 0.6 opacity
- Scenario bars: status-color fill
- Reference line at current Debt_Ratio: `--ink-secondary`, dashed, "Your debt ratio" label
- Reference line at 0.70: `--border-strong`, dotted, "Hard cap" label
- Custom tooltip: `--surface-overlay` background, `radius-md`, Inter 13px

**Chart 2 — Headroom (SAR):**
- Same X-axis
- Y-axis: SAR values
- Bars: green above 0, red at 0
- Zero line solid

Both charts: no chart border, transparent background, 200ms bar entrance animation.

---

### 8.13 Monte Carlo — Distribution Histogram

Recharts BarChart of L* frequency distribution.

**X-axis:** L* value ranges (0–70%), displayed as "0–3.5%", "3.5–7%", etc.
**Y-axis:** Frequency (% of iterations)
**Bar colors:** Based on which zone each range falls in:
- Bars in OPTIMAL zone: `--status-optimal-mid` fill
- Bars in CAUTION zone: `--status-caution-mid` fill  
- Bars overlapping threshold: split coloring (half green, half amber)
- Bars in SUBOPTIMAL zone: `--status-suboptimal-mid` fill

**Reference lines:**
- P5: dashed white, very thin, labeled "5th percentile"
- P50: solid `--teal-vivid`, labeled "Median L* = XX%"
- P95: dashed white, labeled "95th percentile"
- Current DR: dashed amber, labeled "Your debt ratio"
- 0.70 cap: dotted `--ink-tertiary`, labeled "Max (70%)"

**Probability cards above chart (3 cards):**
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  73.4%           │  │  18.2%           │  │  8.4%            │
│  OPTIMAL         │  │  CAUTION         │  │  SUBOPTIMAL      │
│  of futures      │  │  zone likely     │  │  scenarios       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```
Each card: status palette, large JetBrains Mono percentage.

---

### 8.14 PDFReportBuilder

**Layout:** Two-column (toggle panel left, preview mockup right)

```
┌─────────────────────────┬─────────────────────────────┐
│  Include in report:     │  Preview                    │
│                         │                             │
│  ✓ Executive summary    │  ┌───────────────────────┐  │
│  ✓ Equation walkthrough │  │     OLTEE              │  │
│  ✓ Financial scores     │  │     Leverage Report    │  │
│  ✓ AI recommendations   │  │     ───────────────    │  │
│  ○ Scenario comparison  │  │     [Cover preview]    │  │
│    (run scenarios first) │  │                        │  │
│  ○ Monte Carlo results  │  └───────────────────────┘  │
│    (run simulation first)│                             │
│                         │  6 pages estimated           │
│  [Download PDF]         │                             │
│  [Copy shareable link]  │                             │
└─────────────────────────┴─────────────────────────────┘
```

---

## 9. Page Layouts

### 9.1 Landing Page

```
┌────────────────────────────────────────────────────────────────┐
│  [NavigationBar]                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    OLTEE                                       │
│          [Space Grotesk 64px, centered]                       │
│                                                                │
│      Optimal Leverage Threshold Engine                         │
│          [Inter 18px, --ink-secondary]                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  L* = [ (ROI − r) × (1 − T) ]  ÷  [ r × (1 + σ × 0.5) × (1/CF) ]  │
│  │  [Equation display, JetBrains Mono, terms muted]    │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│      Know exactly when debt works for you                      │
│                    [Inter 22px]                               │
│                                                                │
│              [ Analyze your leverage → ]                       │
│                    [Teal CTA button]                           │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Feature highlights (4 columns)                               │
│  [Precision Engine] [AI Intelligence] [Scenarios] [Monte Carlo]│
├────────────────────────────────────────────────────────────────┤
│  "How it works" (3 steps, horizontal)                         │
│  Enter your numbers → Engine calculates L* → AI explains why  │
├────────────────────────────────────────────────────────────────┤
│  Worked example: Ahmad's case                                  │
│  [Recreates Section 5 of the spec in a formatted card]        │
├────────────────────────────────────────────────────────────────┤
│  [Footer]                                                      │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Analyze Page

Desktop: two-column, 420px left / flex-grow right, separated by 40px gap

```
┌──────────────────────────────────────────────────────────────────┐
│  [NavigationBar]                                                 │
├─────────────────────────┬────────────────────────────────────────┤
│                         │                                        │
│  ┌───────────────────┐  │  [Empty state: no results yet]        │
│  │ Live equation     │  │  ┌──────────────────────────────────┐ │
│  │ display (compact) │  │  │                                  │ │
│  └───────────────────┘  │  │  Enter your numbers              │ │
│                         │  │  to calculate your optimal       │ │
│  Annual return (ROI)    │  │  leverage threshold              │ │
│  [________________%]    │  │                                  │ │
│                         │  └──────────────────────────────────┘ │
│  Annual interest rate   │                                        │
│  [________________%]    │  [After calculation:]                 │
│                         │                                        │
│  Tax rate               │  [DecisionBanner — full width]        │
│  [____________15%]      │                                        │
│                         │  [KPIRow — 3 cards]                   │
│  Income stability    β= │                                        │
│  [━━━━●━━━━━━━━━━━━━]  │  [GaugeVisualization — centered]      │
│  Stable employee        │                                        │
│                         │  [EquationWaterfall — collapsible]    │
│  Cash flow coverage     │                                        │
│  [________________×]    │  [FinancialScores — 2×2 grid]         │
│  [Calculate auto →]     │                                        │
│                         │  [AIInsightPanel — streaming]         │
│  Total debt             │                                        │
│  [_____________ SAR]    │                                        │
│                         │                                        │
│  Total assets           │                                        │
│  [_____________ SAR]    │                                        │
│                         │                                        │
│  [ Calculate L* → ]     │                                        │
│                         │                                        │
└─────────────────────────┴────────────────────────────────────────┘
```

**Mobile layout:** Single column, form first, then results below (sticky "Calculate" button at bottom of viewport).

### 9.3 Scenario Lab

```
┌──────────────────────────────────────────────────────────────────┐
│  [NavigationBar]                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Your baseline: OPTIMAL  │  L* = 70.0%  │  Debt: 59.8%         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Scenario presets ───────────────────────────────────────────── │
│  [4×2 grid of ScenarioPresetCards]                              │
│                                                                  │
│  ─── OR adjust manually ────────────────────────────────────── │
│                                                                  │
│  [ScenarioSlider: Interest rate]                                │
│  [ScenarioSlider: Annual return]                                │
│  [ScenarioSlider: Asset value]                                  │
│  [ScenarioSlider: Income / CF ratio]                            │
│                                                                  │
│  ─── Impact ─────────────────────────────────────────────────  │
│  [ScenarioComparisonChart — L* comparison]                      │
│  [ScenarioComparisonChart — Headroom SAR comparison]            │
│                                                                  │
│  ─── Sensitivity analysis ───────────────────────────────────  │
│  [Parameter selector dropdown]                                  │
│  [SensitivityChart — sweep line]                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.4 Monte Carlo Page

```
┌──────────────────────────────────────────────────────────────────┐
│  [NavigationBar]                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Probability analysis ───────────────────────────────────────── │
│  What happens to your leverage across 10,000 possible futures?  │
│                                                                  │
│  Simulation settings:                                           │
│  Iterations: [ 1K ] [ 5K ] [ 10K ★ ] [ 50K ]                  │
│                                                                  │
│  [ Run simulation — 10,000 scenarios → ]                        │
│                                                                  │
│  [After run:]                                                   │
│                                                                  │
│  [3 ProbabilityCards: OPTIMAL 73.4% / CAUTION 18.2% / SUB 8.4%]│
│                                                                  │
│  [DistributionHistogram — full width]                           │
│                                                                  │
│  Confidence range:                                              │
│  P5 = 41.2%  │  P50 = 62.8%  │  P95 = 70.0%                   │
│  [Progress bar visualization of range]                          │
│                                                                  │
│  [AI summary: 3 sentences]                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Interactive States

### 10.1 Button Styles

**Primary CTA (teal):**
```
background: --teal-vivid
color:       --ink-inverse
border:      none
border-radius: radius-md
height:      44px
padding:     0 20px
font:        Inter 15px weight 500
```
Hover: `--teal-mid` background, 150ms  
Active: scale(0.97), 100ms  
Loading: teal spinner, text fades to 50%

**Secondary (outlined):**
```
background: transparent
color:       --ink-primary
border:      1px solid --border-strong
```
Hover: `--surface-overlay` background, `--border-raised` border  

**Ghost:**
```
background: transparent
color:       --ink-secondary
border:      none
```
Hover: `--ink-primary`, 150ms  

**Destructive:**  
Red border + red text, for reset/clear actions only.

---

### 10.2 Tooltip Style

Radix Tooltip primitive.

```
background:    --surface-overlay
border:        1px solid --border-raised
border-radius: radius-sm
padding:       8px 12px
font:          Inter 13px / --ink-secondary
max-width:     260px
```

Arrow: 6px, same `--surface-overlay` background  
Animation: fade-in 150ms  

---

### 10.3 Form Validation Feedback

**Inline warning** (non-blocking):
```
[TriangleAlert icon 14px / --status-caution-mid]  [text: Inter 12px / --status-caution-bright]
```
Appears with 200ms slide-down. Does not prevent calculation.

**Inline error** (blocking):
```
[AlertCircle icon 14px / --status-suboptimal-mid]  [text: Inter 12px / --status-suboptimal-bright]
```
Input border turns `--status-suboptimal-border`. Prevents calculation.

**Cross-field error** (A must exceed D):  
Appears as a banner below the Assets field spanning both fields.

---

## 11. Motion Design Specification

### 11.1 Easing Functions

```
ease-spring:    cubic-bezier(0.22, 1, 0.36, 1)   — entrance animations
ease-smooth:    cubic-bezier(0.4, 0, 0.2, 1)     — transitions
ease-entrance:  cubic-bezier(0.0, 0.0, 0.2, 1)   — state changes
ease-exit:      cubic-bezier(0.4, 0, 1, 1)        — exits
```

### 11.2 Duration Scale

```
instant:    0ms    (no animation — reduced-motion fallback)
fast:       150ms  (hover states, color transitions)
normal:     250ms  (button interactions, tooltip)
medium:     400ms  (panel transitions, card entrances)
slow:       600ms  (gauge needle, complex transitions)
deliberate: 1200ms (count-up animations, arc fills)
```

### 11.3 Animation Inventory

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page entrance | opacity 0→1, y 20→0 | 400ms | ease-spring |
| DecisionBanner | scale 0.96→1, opacity 0→1 | 500ms | ease-spring |
| KPI Card (each) | y 16→0, opacity 0→1 | 400ms | ease-spring |
| KPI Count-up | 0→target | 1200ms | ease-smooth |
| Gauge track draw | stroke-dashoffset | 300ms | ease-smooth |
| Gauge zone fill | stroke-dashoffset | 200ms each | ease-smooth |
| Gauge needle | rotation (spring) | 600ms | ease-spring |
| Gauge center number | count-up | 1000ms | ease-smooth |
| Equation term activate | color transition | 300ms | ease-smooth |
| Equation L* appear | scale 0.85→1, opacity 0→1 | 400ms | ease-spring |
| Score ring fill | stroke-dasharray | 1000ms | ease-smooth |
| Score count-up | 0→score | 1000ms | ease-smooth |
| Waterfall row | opacity 0→1, x -8→0 | 300ms | ease-spring |
| Scenario card hover | border-color, background | 150ms | ease-smooth |
| AI cursor blink | opacity | 700ms | step(1) |

### 11.4 Reduced Motion

All animations wrapped in `@media (prefers-reduced-motion: reduce)`:
- Duration → 0ms (instant)
- No count-ups — display final value immediately
- No entrance transforms — opacity-only fades at 150ms

---

## 12. Responsive Breakpoints

```
mobile:   < 640px    — single column, bottom CTA strip
tablet:   640–1024px — single column with wider cards
desktop:  1024–1280px — two-column analyze page
wide:     > 1280px   — max-width 1280px, centered
```

### Mobile Adaptations

- NavigationBar: hamburger menu
- Analyze page: form → results stacked, "Calculate" button sticky at bottom
- KPI cards: 1-column stack instead of 3-column row  
- Gauge: 240px × 134px (scaled down)
- EquationWaterfall: horizontal scroll inside container
- ScenarioPresets: 2×4 grid instead of 4×2
- PDF preview: hidden on mobile, download only

---

## 13. Copywriting Standards

### Voice

**Precise, not jargon-heavy.** The OLTEE equation uses symbols like σ and α —  
but every label in the UI translates these into plain language.

**Direct, not salesy.** "Your leverage is in the productive zone" not  
"Congratulations! Your finances are AMAZING!"

**Honest about risk.** "Debt has exceeded the safe threshold. Consult a  
financial advisor." — clear, actionable, not alarming.

### Label Conventions

| Concept | Label used |
|---------|-----------|
| ROI | Annual return on your investment (%) |
| r | Annual interest rate on your loan (%) |
| T | Your effective tax rate (%) |
| σ | Income stability |
| CF_ratio | Monthly income ÷ monthly repayment |
| D | Total outstanding debt |
| A | Total assets you own |
| L* | Your safe borrowing ceiling |
| Debt_Ratio | Current debt ratio |
| Headroom | Room before the limit |

### Tooltip Standards

Every input field has a tooltip. Format:
- One sentence explaining what the number means
- One example with SAR values

Example (ROI): "If your apartment earns SAR 60,000 rent per year on a  
SAR 500,000 property, your annual return is 12%."

### Empty States

- No results yet: "Enter your numbers on the left to calculate your optimal  
  leverage threshold." (not "No data available")
- No scenarios run: "Run a scenario above to see the impact." (invitation to act)
- Monte Carlo not run: "Click Run simulation to analyze 10,000 possible futures."

### Error Messages

- A > D violation: "Your total assets must be greater than your total debt."
- ROI ≤ r: "Your investment return is below your borrowing cost. The engine  
  cannot compute a positive threshold — this is itself the answer."
- CF_ratio < 0.5: "A ratio below 0.5 means monthly repayments exceed twice  
  your income. Please verify your numbers."

---

## 14. Design Tokens — CSS Custom Properties

All tokens live in `:root` in `app/globals.css`. These are the authoritative  
values; Tailwind config references them where possible.

```css
:root {
  /* Surfaces */
  --surface-base:    #05070F;
  --surface-raised:  #0D1420;
  --surface-overlay: #111B2E;
  --surface-sunken:  #070A16;
  --surface-subtle:  #0A1022;

  /* Borders */
  --border-base:     #182035;
  --border-raised:   #1E2A42;
  --border-muted:    #111928;
  --border-strong:   #2A3A5C;

  /* Ink */
  --ink-primary:     #EEF2FF;
  --ink-secondary:   #7A8BA8;
  --ink-tertiary:    #3E5070;

  /* Teal — output color */
  --teal-vivid:      #00D4AA;
  --teal-mid:        #00A882;
  --teal-dim:        #006655;
  --teal-ghost:      rgba(0, 212, 170, 0.08);
  --teal-glow:       rgba(0, 212, 170, 0.15);

  /* Status — OPTIMAL */
  --optimal-bg:      #031A0E;
  --optimal-border:  #0D5C2E;
  --optimal-mid:     #16A34A;
  --optimal-bright:  #4ADE80;
  --optimal-pulse:   rgba(74, 222, 128, 0.12);

  /* Status — CAUTION */
  --caution-bg:      #1A0E00;
  --caution-border:  #7C3D0A;
  --caution-mid:     #D97706;
  --caution-bright:  #FCD34D;
  --caution-pulse:   rgba(252, 211, 77, 0.12);

  /* Status — SUBOPTIMAL */
  --suboptimal-bg:     #1A0303;
  --suboptimal-border: #7F1D1D;
  --suboptimal-mid:    #DC2626;
  --suboptimal-bright: #FCA5A5;
  --suboptimal-pulse:  rgba(252, 165, 165, 0.12);

  /* Status — NEG_SPREAD */
  --negspread-bg:     #1A0208;
  --negspread-border: #7C0B28;
  --negspread-mid:    #E8305A;
  --negspread-bright: #FF8FAB;
  --negspread-pulse:  rgba(255, 143, 171, 0.12);

  /* Gauge */
  --gauge-track:      #182035;
  --gauge-needle:     #EEF2FF;

  /* Motion */
  --ease-spring:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-smooth:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-entrance:  cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit:      cubic-bezier(0.4, 0, 1, 1);

  --dur-fast:       150ms;
  --dur-normal:     250ms;
  --dur-medium:     400ms;
  --dur-slow:       600ms;
  --dur-deliberate: 1200ms;

  /* Fonts */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-1: 4px;    --space-2: 8px;    --space-3: 12px;
  --space-4: 16px;   --space-5: 20px;   --space-6: 24px;
  --space-8: 32px;   --space-10: 40px;  --space-12: 48px;
  --space-16: 64px;  --space-24: 96px;

  /* Radii */
  --radius-xs: 2px;    --radius-sm: 4px;    --radius-md: 8px;
  --radius-lg: 12px;   --radius-xl: 16px;   --radius-2xl: 24px;
}
```

---

*Design system complete. All specifications are implementation-ready.*  
*Next phase: Core engine implementation, then UI layer.*
