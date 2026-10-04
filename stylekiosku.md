# BuatinToko / Kiosku — UI Style & Design System

> **Source of truth:** `resources/css/app.css` pada repository `fandiplay/BuatinToko`.
>
> Style saat ini menggunakan **custom CSS design system**, CSS variables, CSS Grid/Flexbox, responsive media queries, dan Font Awesome. Tailwind CSS 4 tersedia melalui Vite, tetapi visual system utamanya dibangun dengan CSS custom.

---

## 1. Overall Design Direction

### Design character

- Modern
- Clean
- Simple
- Friendly
- Practical
- Soft rounded UI
- Minimal visual noise
- Mobile-first behavior
- Slightly premium without looking luxurious/overdesigned
- Strong emphasis on readability and usability
- Orange is the main brand/action color
- Neutral surfaces dominate the interface
- Cards use subtle borders and soft shadows rather than heavy elevation
- Interactions are quick and subtle

### Visual hierarchy

```text
Neutral background
↓
White / dark surface cards
↓
Dark high-contrast text
↓
Muted secondary text
↓
Orange action / highlight
↓
Status colors for semantic states
```

The design should feel closer to a **modern SaaS dashboard + simple Indonesian UMKM storefront** than to a traditional marketplace.

---

# 2. Color System

## Light Theme

### Global colors

| Token | Value | Usage |
|---|---:|---|
| `--bg` | `#f6f6f8` | Main page background |
| `--surface` | `#ffffff` | Cards, panels, inputs |
| `--surface-2` | `#f0f1f5` | Secondary surfaces |
| `--text` | `#171923` | Primary text |
| `--text-muted` | `#5c6470` | Secondary text |
| `--text-faint` | `#8a91a0` | Very subtle text |
| `--border` | `#e5e7ee` | Standard borders |
| `--border-strong` | `#d3d7e2` | Stronger borders |

### Brand / primary

| Token | Value | Usage |
|---|---:|---|
| `--primary` | `#f97316` | Main orange |
| `--primary-strong` | `#ea580c` | Hover / darker orange |
| `--primary-soft` | `#fff3e8` | Soft orange background |
| `--on-primary` | `#ffffff` | Text/icons on primary |

The dominant brand color is **orange**, approximately Tailwind `orange-500`.

---

## Semantic colors

### Success

```text
#16a34a
```

Soft:

```text
#e8f8ee
```

Used for success messages, active/approved states, positive transaction states, and live status.

### Warning

```text
#b45309
```

Soft:

```text
#fdf3e0
```

Used for warnings and attention states.

### Danger

```text
#dc2626
```

Soft:

```text
#fdeeee
```

Used for destructive actions, errors, rejected transactions, and abuse/report links.

### Info

```text
#2563eb
```

Soft:

```text
#e9f0fe
```

Used for informational states and processing indicators.

---

# 3. Dark Theme

Dark mode is implemented through:

```css
html[data-theme="dark"]
```

### Dark palette

| Token | Value |
|---|---:|
| Background | `#0c0e12` |
| Surface | `#14171d` |
| Surface 2 | `#1b1f27` |
| Text | `#e8eaf0` |
| Muted text | `#99a1b0` |
| Faint text | `#6b7280` |
| Border | `#272c36` |
| Strong border | `#363d4a` |
| Primary | `#fb923c` |
| Primary strong | `#f97316` |

Dark mode still keeps orange as the brand accent.

### Dark mode principle

Do **not** turn the entire UI into pure black.

```text
#0c0e12  → page background
#14171d  → cards
#1b1f27  → secondary surfaces
```

This creates layered dark surfaces without harsh contrast.

---

# 4. Typography

## Primary font stack

```css
font-family:
    "Plus Jakarta Sans",
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
```

The visual character should therefore be:

- Modern sans-serif
- High readability
- Slightly geometric
- Friendly rather than corporate
- Strong weight hierarchy

### Base typography

```text
Body size: 14.5px
Line height: 1.55
```

Mobile is approximately `14px`.

### Heading system

#### H1

```text
24px → 30px
Weight: 800
Line-height: 1.2
Letter-spacing: -0.02em
```

Large landing hero H1:

```text
34px → 58px
Weight: 800
Line-height: 1.04
Letter-spacing: -0.04em
```

#### H2

```text
18px → 22px
Weight: 700
Line-height: 1.2
```

Landing section H2:

```text
22px → 32px
Weight: 800
Line-height: 1.12
Letter-spacing: -0.03em
```

#### H3

```text
15px
Weight: 700
```

---

# 5. Spacing System

The design uses an explicit spacing scale:

```css
--sp-1: 4px;
--sp-2: 8px;
--sp-3: 12px;
--sp-4: 16px;
--sp-5: 24px;
--sp-6: 32px;
--sp-7: 48px;
```

### Practical interpretation

```text
4px   → micro spacing
8px   → icon / small internal gap
12px  → compact components
16px  → normal component padding
24px  → card padding / section gaps
32px  → larger layout gaps
48px  → major section spacing
```

Avoid arbitrary spacing unless necessary.

---

# 6. Border Radius System

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 20px;
```

### Usage

```text
10px → small controls / compact UI
14px → buttons, inputs, small cards
20px → major cards / sections
```

Special large elements may use `22px`, `27px`, or `36px` where appropriate.

The overall design therefore has a **soft rounded appearance**, but not excessive pill-shaped UI everywhere.

---

# 7. Shadow System

### Small

```css
0 1px 3px rgba(16, 20, 33, .07),
0 1px 2px rgba(16, 20, 33, .05)
```

### Medium

```css
0 8px 28px rgba(16, 20, 33, .10)
```

### Large

```css
0 20px 50px rgba(16, 20, 33, .14)
```

Shadow philosophy:

```text
Do not make cards look heavily floating.
Use subtle elevation.
Use stronger shadow only for:
- modal
- floating dock
- phone preview
- important CTA
```

---

# 8. Brand Glow

### Focus glow

```css
0 0 0 3px
color-mix(in srgb, var(--primary) 22%, transparent)
```

### CTA glow

```css
0 6px 20px
color-mix(in srgb, var(--primary) 32%, transparent)
```

### CTA hover glow

```css
0 8px 28px
color-mix(in srgb, var(--primary) 45%, transparent)
```

The glow must remain subtle.

---

# 9. Motion / Animation

Global duration:

```css
--dur: 180ms;
```

Easing:

```css
cubic-bezier(.3, .7, .4, 1)
```

### Interaction philosophy

Animations should feel:

```text
quick
soft
responsive
not flashy
```

Common effects:

```text
translateY(-1px)
translateY(-2px)
scale(.98)
opacity transitions
small shadow increase
```

### Button press

```css
transform: scale(.98);
```

### Card hover

```css
transform: translateY(-2px);
```

### Dropdown

```text
opacity: 0 → 1
translateY(-4px) → 0
```

### Bottom sheet

```text
translateY(24px) → 0
opacity 0 → 1
```

---

# 10. Button Style

Base button:

```text
Display: inline-flex
Min height: 42px
Padding: 10px 16px
Radius: 12px
Font size: 14px
Font weight: 700
```

Buttons are rounded, compact, strongly typographic, and high contrast.

### Primary button

```text
Background: #f97316
Text: #ffffff
```

Hover:

```text
Background: #ea580c
Orange glow
```

### Ghost button

```text
Background: surface
Border: border
Text: primary text
```

Hover:

```text
surface-2
stronger border
```

### Dark button

```text
#1b2433
```

Dark mode:

```text
#2a3242
```

### WhatsApp button

```text
#16a34a
```

Hover:

```text
#15803d
```

---

# 11. Icon Buttons

Typical size:

```text
40 × 40px
```

Mobile:

```text
38 × 38px
```

Style:

```text
Border: 1px
Radius: 11px
Background: surface
Color: muted
```

Used for menu, close, profile, utility actions, and store actions.

Icons use **Font Awesome**.

---

# 12. Header / Navigation

Header:

```text
position: sticky
top: 0
z-index: 50
```

Height:

```text
~60px
```

Visual treatment:

```text
border-bottom
semi-transparent background
backdrop-filter: blur(14px)
```

This gives a restrained translucent/glass-like effect without heavy glassmorphism.

### Brand

```text
18px
Weight: 800
Letter spacing: -0.03em
```

Brand icon:

```text
34 × 34px
Radius: 10px
Orange gradient
Soft orange glow
```

---

# 13. Cards

Default card pattern:

```text
Background: surface
Border: 1px solid border
Radius: 14px or 20px
Shadow: small
```

Major cards:

```text
Padding: 24px
Radius: 20px
```

Mobile:

```text
Padding: 16px
Radius: 14px
```

### Hover

Usually:

```text
translateY(-2px)
shadow-md
border color slightly stronger
```

There is no aggressive zoom or giant animation.

---

# 14. Form UI

Inputs:

```text
Min height: 44px
Padding: 11px 13px
Border radius: 11px
Border: border-strong
Background: surface
```

Focus:

```text
Border: primary
Orange focus ring
```

Labels:

```text
13px
Weight: 600
```

Supporting text:

```text
13px
Muted color
```

Error:

```text
danger red
```

---

# 15. Upload UI

Image uploader:

```text
Dashed border
1.5px
Radius: 12px
Min height: 84px
Background: surface-2
```

Upload preview:

```text
56 × 56px
Radius: 10px
object-fit: cover
```

This creates a friendly image upload component instead of a raw browser file input.

---

# 16. Status Badges

Badge pattern:

```text
display: inline-flex
pill shape
font-size: ~11–12px
font-weight: 700
```

Examples:

```text
Live        → success
Draft       → neutral
Pending     → warning
Approved    → success
Processing  → info
Rejected    → danger
```

---

# 17. Dashboard Style

Dashboard is deliberately closer to a **clean SaaS admin panel**.

### Layout

```text
max-width shell
horizontal navigation
metric cards
large content sections
```

Main shell:

```css
width: min(1120px, calc(100% - 32px));
margin-inline: auto;
```

### Metric cards

Desktop:

```text
4 columns
```

Each card:

```text
padding: 16px
border: 1px
radius: 14px
background: surface
```

Value:

```text
22px
weight: 800
```

Label:

```text
12px
muted
```

---

# 18. Mobile Dashboard Navigation

At `max-width: 768px`, dashboard navigation becomes a fixed bottom navigation.

```text
position: fixed
bottom: 0
width: 100%
z-index: 45
backdrop-filter: blur(14px)
```

Navigation item:

```text
min-height: 52px
font-size: 10.5px
```

Active:

```text
primary color
primary-soft background
```

Important implementation principle:

> The content receives additional bottom padding so the fixed navigation does not cover the last content or pagination.

Safe-area support uses:

```text
env(safe-area-inset-bottom)
```

---

# 19. Mobile Philosophy

Responsive breakpoints currently revolve around:

```text
1024px
900px
768px
760px
700px
620px
480px
380px
```

### Desktop

```text
multi-column
horizontal controls
larger spacing
```

### Mobile

```text
single-column
compact spacing
full-width controls
smaller typography
cards instead of tables
bottom navigation
touch-friendly buttons
safe-area support
```

Mobile shell:

```css
width: calc(100% - 24px);
```

The UI intentionally avoids horizontal overflow:

```css
html,
body {
    overflow-x: clip;
}
```

---

# 20. Product Management

Desktop products use a traditional table:

```text
Image
Product
Price
Stock
Status
Actions
```

Mobile changes the table into compact cards using CSS Grid rather than forcing a horizontal table scroll.

---

# 21. Store Builder

Store builder uses roughly:

```text
1fr + 380px
```

Desktop:

```text
┌──────────────────────────┬──────────────┐
│ Settings / Form          │ Live Preview │
│                          │              │
└──────────────────────────┴──────────────┘
```

The preview is sticky with approximately:

```text
top: 80px
```

On mobile:

```text
Form
↓
Collapsible preview
```

The preview becomes expandable instead of permanently consuming screen space.

---

# 22. Storefront Design

Storefront has its own visual layer.

Base storefront variables:

```css
--store-primary: #9a3412;
--store-accent: #f97316;
--store-soft: #fff7ed;
```

The storefront therefore has a slightly deeper orange/brown primary than the dashboard.

---

# 23. Storefront Hero

Hero:

```text
Full-width colored / image background
White high-contrast text
Large store name
Small uppercase overline
Tagline
Description
```

Store logo:

```text
58 × 58px
Radius: 16px
```

Mobile:

```text
48 × 48px
Radius: 14px
```

Store title:

```text
30px → 52px
Weight: 800
Letter spacing: -0.04em
Line height: ~1.05
```

---

# 24. Store Categories

Category navigation is a horizontal scrollable chip row.

```text
Surface
Border
Rounded container
Soft shadow
Horizontal scrolling
Scrollbar hidden
```

Active chip:

```text
store-primary background
white text
```

---

# 25. Product Cards — Storefront

Desktop:

```text
3-column grid
```

Tablet:

```text
2-column grid
```

Mobile:

```text
compact horizontal cards
```

Desktop product image:

```text
height: 200px
```

Mobile:

```text
~104px image column
~132px minimum image height
```

Card:

```text
border
radius: 14px
surface background
small shadow
```

Hover:

```text
translateY(-2px)
shadow increase
```

---

# 26. Product Image Treatment

Product images:

```css
width: 100%;
height: 100%;
object-fit: cover;
```

Placeholder:

```text
soft orange background
large icon
```

Pinned product badge:

```text
yellow/gold
pill
star/pin icon
```

Pinned badge colors:

```text
#fef3c7
#713f12
#f59e0b
```

---

# 27. Product Action Buttons

Primary storefront CTA:

```text
store-primary
white text
rounded 10px
```

Secondary detail button:

```text
surface
border
dark text
rounded 10px
```

On mobile:

```text
Actions become full-width
Usually 2-column
```

---

# 28. Shopping Cart

Cart dock is a floating bottom bar.

```text
position: fixed
bottom: safe-area
width: min(600px, calc(100% - 28px))
```

Shape:

```text
14px radius
large shadow
store-primary background
white text
```

It behaves like a mobile-friendly floating purchase summary.

---

# 29. Cart / Product Modal

Both cart and product detail use a bottom-sheet pattern.

```text
fixed overlay
dark translucent backdrop
backdrop blur
bottom-aligned sheet
```

Sheet:

```text
max-width: ~590px
max-height: ~88dvh
radius: 22px
surface background
large shadow
```

Animation:

```text
translateY(24px) → 0
opacity 0 → 1
```

---

# 30. QR Modal

QR dialog:

```text
Width: max 380px
Radius: 22px
Surface background
Large shadow
Centered
Scrollable when needed
```

QR itself sits inside:

```text
white background
10px padding
18px radius
small border
```

The QR design stays intentionally clean for reliable scanning.

---

# 31. Storefront Layout Variants

## Layout: Hangat

Character:

```text
Warm
Traditional product-list feel
```

Products:

```text
1-column
horizontal product cards
```

Image:

```text
~140px side column
```

Visual model:

```text
[ IMAGE ][ PRODUCT INFO ]
```

---

## Layout: Minimal

Character:

```text
Clean
Editorial
Compact
Image-focused
```

Products use a grid.

Mobile:

```text
2-column product grid
```

Product image:

```text
1:1 aspect ratio
```

Store intro:

```text
center aligned
```

---

## Layout: Segar / Boutique-style

Character:

```text
Modern
Editorial
More visually curated
```

Desktop uses a split layout:

```text
┌───────────────┬──────────────────────────┐
│ Store Hero    │ Product Catalog          │
│               │                          │
│ Sticky        │ 2-column products        │
│               │                          │
└───────────────┴──────────────────────────┘
```

The left hero panel becomes sticky.

The first product can become a larger featured card.

On mobile it collapses into a normal vertical layout.

---

# 32. Store Visual Themes

## Sunset

```text
#7c2d12
#f97316
#7c3aed
```

Gradient:

```text
135deg
```

Mood:

```text
warm
bold
energetic
```

---

## Starlight

Uses:

```text
dark navy
purple
white star dots
```

Base:

```text
#111827
#312e81
```

The stars are implemented with multiple CSS radial gradients.

---

## Aurora

Gradient:

```text
#064e3b
#10b981
#8b5cf6
```

Mood:

```text
fresh
modern
slightly premium
```

---

## Paper

Light editorial visual:

```text
#ffffff
#e2e8f0
```

Text:

```text
#0f172a
```

The Paper theme changes the hero from a dark/high-contrast section into a light visual treatment.

---

## Gallery

Uses a custom uploaded background image.

Overlay:

```text
dark translucent gradient
```

Purpose:

```text
Maintain readable text over arbitrary uploaded imagery.
```

---

# 33. Visual / Seasonal Effects

The store supports optional visual effects.

### Shake

Small periodic horizontal/rotation movement.

```text
3.8s loop
```

Very subtle:

```text
-2px → +2px
```

### Snow

Uses:

```text
❄ · ❅ · ❄ · ❅
```

Animated vertically across the preview.

### Shine

A diagonal light sweep:

```text
transparent
→ white highlight
→ transparent
```

Used over product placeholder/card imagery.

### Rainbow

Animated outline cycling through:

```text
#ff4d8d
#22c55e
#3b82f6
```

The rainbow effect uses the border/outline rather than changing the entire card.

### Lovers

Adds:

```text
💖
```

near the card corner.

---

# 34. Reduced Motion

The entire system respects:

```css
@media (prefers-reduced-motion: reduce)
```

Animations and transitions are effectively disabled/minimized.

This should remain part of the design system.

---

# 35. VIP Visual Language

VIP uses a different accent family from the normal orange system.

Primary VIP gradient:

```text
#7c3aed
→
#2563eb
```

This creates a:

```text
purple → blue
```

visual language.

VIP active button:

```text
white icon
purple-blue gradient
soft blue/purple shadow
```

VIP plan card:

```text
purple border emphasis
soft purple shadow
gradient label
```

VIP label:

```text
white text
purple-blue gradient
pill shape
```

---

# 36. Verification Badge

Verification badge is visually similar to a social-platform verified mark.

Primary blue:

```text
#1687ff
```

White checkmark is layered on top.

Badge:

```text
blue text
light blue background
pill shape
```

---

# 37. Founder / Admin UI

Founder/admin areas continue using the same neutral system instead of creating an entirely different admin theme.

Use:

```text
same typography
same spacing
same card system
same borders
same orange primary
```

Special management badges use semantic colors.

This keeps the application visually unified.

---

# 38. Announcement Card

Founder-managed announcement:

```text
4-column grid
icon
content
action
close button
```

Desktop:

```text
Icon | Message | Action | Close
```

Mobile:

```text
Icon | Message | Close
     | Action
```

Background uses a subtle orange surface gradient.

---

# 39. Referral Card

Referral section uses:

```text
purple accent
soft radial gradient
surface card
20px radius
```

Purple palette:

```text
#7c3aed
#6d28d9
#c4b5fd
```

Progress bar:

```text
purple → orange
```

This is one of the few areas where purple becomes a major visual accent.

---

# 40. Landing Page

Landing page is more expressive than the dashboard.

Structure:

```text
Hero
↓
Feature / advantage sections
↓
Testimonials
↓
Final CTA
↓
Footer
```

### Hero

Desktop:

```text
two-column layout
```

Approximation:

```text
1.1fr / .9fr
```

Hero title:

```text
34px → 58px
800 weight
very tight letter spacing
```

Hero CTA:

```text
orange primary
dark secondary
```

---

# 41. Phone Mockup

Landing page includes a phone-like store preview.

Outer frame:

```text
width max ~380px
10px padding
36px radius
dark background
large shadow
```

Screen:

```text
27px radius
overflow hidden
```

This creates a realistic mobile storefront preview without using a literal device image.

---

# 42. Feature Cards

Feature / information cards:

```text
Surface
1px border
20px radius
24px padding
```

Hover:

```text
translateY(-2px)
shadow-md
```

Icons use the orange accent.

---

# 43. Testimonial Style

Testimonial section uses:

```text
surface-2 background
horizontal scroll carousel
scroll-snap
hidden scrollbar
```

Cards:

```text
min width ~280px
min height ~230px
20px radius
24px padding
```

Stars:

```text
orange
```

Avatar:

```text
40px circular
primary-soft background
```

---

# 44. Floating WhatsApp CTA

Landing page WhatsApp CTA:

```text
fixed
bottom safe-area
right safe-area
pill shape
dark outer shell
green circular icon
```

Main icon:

```text
#22c55e
44 × 44px
circular
```

The CTA combines:

```text
dark label
green WhatsApp button
soft large shadow
```

On very small screens, the text area becomes more compact.

---

# 45. Footer

Footer uses:

```text
surface background
top border
muted text
```

Desktop:

```text
3-column grid
```

Mobile:

```text
single column
```

Links:

```text
muted by default
orange on hover
```

Legal pages use the same system.

---

# 46. Legal Pages

Legal content uses a narrower reading width:

```text
max-width: ~820px
```

Main legal card:

```text
surface
border
20px radius
32px padding desktop
16px mobile
```

Body text:

```text
14px
line-height: 1.75
muted color
```

This intentionally prioritizes readability over dense presentation.

---

# 47. Design Rules for Future UI Work

## DO

```text
Use orange #f97316 as the main action accent.
Use #171923 / #e8eaf0 for primary text.
Use muted gray for secondary information.
Use white/dark layered surfaces.
Use 10–20px radius for most components.
Use subtle shadows.
Use 4/8/12/16/24/32/48 spacing.
Use 42–48px minimum button/input heights.
Use Font Awesome icons.
Use CSS Grid/Flexbox.
Use responsive breakpoints.
Use env(safe-area-inset-bottom) for fixed mobile elements.
Keep animations around ~180–240ms.
```

## DON'T

```text
Do not introduce random colors.
Do not use excessive gradients.
Do not make every component glassmorphic.
Do not use huge shadows everywhere.
Do not use sharp square cards unless intentionally required.
Do not make buttons excessively tall.
Do not create desktop-only UI.
Do not allow horizontal overflow on mobile.
Do not replace the existing design system with arbitrary Tailwind styling.
Do not introduce a completely different visual language for one page.
```

---

# 48. Core Visual Formula

```text
Modern SaaS UI
+
Soft rounded cards
+
Neutral gray/white surfaces
+
Orange brand accent
+
Subtle shadows
+
Strong typography
+
Compact controls
+
Responsive mobile transformations
+
Small purposeful motion
+
Storefront-specific visual themes
```

### Brand personality

```text
Simple
Friendly
Useful
Modern
Affordable
Practical
UMKM-oriented
```

The UI should feel like:

> **"Bikin toko online itu gampang, nggak ribet."**

rather than:

> "Kami adalah enterprise e-commerce platform."
