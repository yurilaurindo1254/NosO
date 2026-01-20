# NósOS Design System

## 1. Design Philosophy

**Cyber-Luxe & Functional Intimacy**
The goal is to create an interface that feels "Premium" and "Futuristic" but remains warm and usable for a couple's daily life.

- **Dark Mode First**: The interface is optimized for a sleek, dark aesthetic using deep slate/black backgrounds with vibrant neon accents.
- **Glassmorphism**: Use translucent layers to create depth and hierarchy.
- **Bento Grids**: Information is organized in rigid but visually varied grid tiles.

## 2. Color Palette (OKLCH)

We use the modern **OKLCH** color space for perceived lightness consistency.

### Core Colors

| Token          | Variable       | Value (Dark)           | Usage                                           |
| -------------- | -------------- | ---------------------- | ----------------------------------------------- |
| **Background** | `--background` | `oklch(0.08 0.01 264)` | Main app background (Deep Navy/Black)           |
| **Foreground** | `--foreground` | `oklch(0.98 0 0)`      | Primary text (White)                            |
| **Primary**    | `--primary`    | `oklch(0.65 0.2 264)`  | Main actions, highlights (Electric Purple/Blue) |
| **Secondary**  | `--secondary`  | `oklch(0.16 0.02 264)` | Secondary buttons, subtle backgrounds           |
| **Card**       | `--card`       | `oklch(0.12 0.01 264)` | Card backgrounds (slightly lighter than bg)     |

### Semantic Colors

- **Success/Income**: Emerald Green (`oklch(0.6 0.15 150)`) - Used for positive financial values.
- **Danger/Expense**: Rose Red (`oklch(0.6 0.2 25)`) - Used for negative values, deletions.
- **Warning/Meta**: Amber/Orange - Used for savings goals and alerts.

## 3. Typography

**Font Family**: [Geist](https://vercel.com/font)

- **Headings**: `Geist Sans` (Weights: 600, 700)
- **Body**: `Geist Sans` (Weights: 400, 500)
- **Code/Tech**: `Geist Mono`

### Scale

- **Display**: `text-4xl` to `text-6xl`, `font-black`, `tracking-tight` (e.g., Marketing Headers)
- **Page Title**: `text-2xl` to `text-3xl`, `font-bold` (e.g., "Planner Financeiro")
- **Card Title**: `text-sm` to `text-base`, `font-bold`
- **Body**: `text-sm` (Default UI text)
- **Metadata**: `text-[10px]` or `text-xs`, `uppercase`, `tracking-wider`

## 4. Layout Patterns

### The Bento Grid (Finance Standard)

A rigid yet expressive grid system for dashboards.

**Desktop (md+)**

- **Grid**: `grid-cols-4` x `grid-rows-3`
- **Container**: `max-w-[1800px]`, `h-[calc(100vh-200px)]`
- **Gap**: `gap-6` or `gap-8`
- **Logic**:
  - **2x2**: Major Focus (Charts, Main Feeds)
  - **1x1**: Key Metrics (Cards)
  - **1x2 (Vertical)**: Lists (Transactions, Tasks)
  - **2x1 (Horizontal)**: Interactive Bars (Sliders, Timelines)

**Mobile**

- **Grid**: `grid-cols-2`
- **Gap**: `gap-3`
- **Logic**:
  - **Full Width (2 cols)**: Charts, Total Balance, Tools (Sliders).
  - **Half Width (1 col)**: Comparative Metrics (Income vs Expenses), Lists (Fixed Expenses vs Goals).

### Glassmorphism

Utility classes defined in `globals.css`:

```css
.glass {
  @apply bg-background/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)];
}
.glass-card {
  @apply bg-card/60 backdrop-blur-md border border-white/5 shadow-2xl;
}
```

## 5. Components

### Cards

- **Border**: `border-none` (rely on `bg` contrast or subtle internal borders).
- **Shadow**: `shadow-xl`, `shadow-primary/20` for featured cards.
- **Content**: Use `flex flex-col` to ensure footer sticks to bottom or content expands.

### Buttons

- **Primary**: Solid color, `rounded-md` or `rounded-full`.
- **Ghost**: Used for icon-only actions (Trash, Edit) to reduce visual noise.

### Charts & Data

- **Library**: `recharts`
- **Style**:
  - `innerRadius={60}`, `outerRadius={90}` for Doughnuts.
  - `cornerRadius={6}` for rounded segments.
  - **Tooltip**: Custom styling with `borderRadius: '12px'`, `border: 'none'`.

## 6. Iconography

**Library**: `lucide-react`

- Use consistent sizing: `h-4 w-4` for button icons, `h-5 w-5` for card headers.
- **Stroke**: Default `stroke-2`.

## 7. Motion

- **Transitions**: `transition-all`, `duration-300`, `ease-in-out`.
- **Hover**: Subtle scale (`scale-105`) or brightness adjustments (`hover:bg-white/10`).
