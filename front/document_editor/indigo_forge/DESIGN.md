```markdown
# Design System Specification: Editorial Precision

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Editor"**

This design system moves beyond the generic "SaaS Dashboard" aesthetic to embrace an editorial, high-fidelity experience. The goal is to make data-dense collaboration feel like a premium publication. We achieve this by rejecting the "boxed-in" layout of traditional software. Instead of rigid grids and heavy borders, we use **Intentional Asymmetry** and **Tonal Depth**. 

The interface should feel like a series of high-end paper stocks or frosted glass sheets layered upon one another. By utilizing expansive white space (using our custom spacing scale) and sophisticated typography, we transform "Production-Ready" into "Production-Refined."

---

## 2. Colors & Surface Logic

Our palette is anchored in high-trust Indigos (`primary`) and Slates (`secondary`), punctuated by a surgical use of Teal (`tertiary`) to draw the eye to critical actions.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Traditional borders create visual noise that exhausts the user in data-heavy environments. Instead, sectioning must be achieved through:
1.  **Background Color Shifts:** Placing a `surface_container_low` section directly against a `surface` background.
2.  **Vertical Space:** Using the `8` (1.75rem) or `10` (2.25rem) spacing tokens to create breathing room between functional groups.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. The closer the information is to the user’s "lens," the lighter and more translucent the surface becomes.
*   **Base Layer:** `surface` (#faf8ff) – The desk on which everything sits.
*   **Navigation/Sidebar:** `surface_container_low` (#f2f3ff) – Recessed and stable.
*   **Content Cards:** `surface_container_lowest` (#ffffff) – The highest "elevation," popping against the slightly tinted background.
*   **Active Overlays:** `surface_bright` with 80% opacity and a `20px` backdrop-blur for a "Glassmorphism" effect.

### Signature Textures
Main CTAs should not be flat. Use a subtle linear gradient transitioning from `primary` (#3a388b) to `primary_container` (#5250a4) at a 135-degree angle. This adds a "soul" to the button that makes it feel tactile and pressable.

---

## 3. Typography: The Hierarchy of Authority

We pair **Manrope** (Display/Headline) for an architectural, modern feel with **Inter** (Title/Body/Label) for clinical legibility in data-dense document editors.

*   **Display & Headlines (Manrope):** Use `display-lg` to `headline-sm` for landing moments and section headers. The wider aperture of Manrope provides an "Editorial" feel that breaks the monotony of the workspace.
*   **The Working UI (Inter):** Use `title-sm` (1rem) for document titles and `body-md` (0.875rem) for the primary interface text. 
*   **Functional Labels:** Use `label-sm` (#0.6875rem) in `on_surface_variant` for metadata. This ensures that while the layout is dense, the "visual weight" remains light.

---

## 4. Elevation & Depth

### The Layering Principle
Hierarchy is achieved through **Tonal Layering**. To highlight a document in a list, do not add a border; instead, change its background from `surface_container_lowest` to `surface_container_high`. 

### Ambient Shadows
For floating elements like dropdowns or modals, use the "Ambient Shadow" technique:
*   **Blur:** 24px - 40px.
*   **Spread:** -4px.
*   **Color:** `on_surface` at 6% opacity. 
*   **Result:** A soft, natural lift that mimics gallery lighting rather than a digital drop-shadow.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., in the Document Editor's input fields), use a **Ghost Border**: `outline_variant` (#c5c5d4) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Sidebar Navigation
*   **Background:** `surface_container_low`.
*   **Active State:** No background pill. Use a 4px vertical "indicator bar" on the far left in `tertiary` (#004c45) and transition the text to `primary` (#3a388b) with a `title-sm` weight.

### Data Tables & Document Lists
*   **Forbid Dividers:** Horizontal lines are banned. Use `spacing-4` (0.9rem) between rows.
*   **Row Hover:** On hover, transition the row background to `surface_container_highest`. 
*   **Role Badges:** Use `secondary_container` backgrounds with `on_secondary_container` text. Apply the `full` (9999px) roundedness for a soft, pebble-like feel.

### Document Editor Interface
*   **The Canvas:** The main editor area should be `surface_container_lowest`. 
*   **The "Focus" Mode:** When the user is typing, fade the `on_surface_variant` elements (sidebars/toolbars) to 30% opacity to minimize distraction.
*   **Interactive Accents:** Use `tertiary` (#004c45) for text selection and cursors to provide a high-contrast, professional "pop."

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `xl` (0.75rem) corner radius.
*   **Secondary:** Ghost style. No background, `outline` at 15% opacity.
*   **Tertiary (Action):** `tertiary` background with `on_tertiary` text. Use this exclusively for "Finalize" or "Share" actions.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `xl` (0.75rem) rounding for large cards and `md` (0.375rem) for smaller buttons to create a nested visual harmony.
*   **Do** use `surface_dim` for the backdrop of modals to create a "deep focus" effect.
*   **Do** prioritize `tertiary_fixed` (#89f5e7) for success states or "online" indicators—it feels more premium than a standard lime green.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#131b2e) to maintain the sophisticated Indigo/Slate undertone.
*   **Don't** use "Card-in-Card" layouts with multiple shadows. Use one shadow for the parent and background shifts for the children.
*   **Don't** use standard 16px padding. Use the spacing scale (e.g., `5` for 1.1rem or `6` for 1.3rem) to create non-standard, intentional breathing room.

---

## 7. Signature Interaction Pattern
When a user clicks a "Primary Action," the element should not just change color; it should perform a subtle `scale(0.98)` transform and the `surface_tint` should wash over the element briefly. This "Micro-Haptic" feedback reinforces the "Production-Ready" feel through high-end engineering.```