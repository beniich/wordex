# Design System Strategy: High-Tech Editorial

## 1. Overview & Creative North Star
**Creative North Star: The Celestial Atelier**
This design system is a study in "Warm Futurism." It rejects the cold, sterile tropes of traditional high-tech interfaces in favor of an editorial experience that feels curated, magical, and grounded. We bridge the gap between the tactile world of sand and brushed metal and the ethereal world of digital light.

The system breaks away from "template" layouts through:
*   **Intentional Asymmetry:** Strategic use of whitespace and off-center focal points to guide the eye.
*   **Atmospheric Depth:** A multi-layered approach using glassmorphism and light-leaks to create a 3D workspace.
*   **High-Contrast Panels:** Utilizing "Dark Mode" containers as high-impact floating modules within a light-bathed environment.

## 2. Colors
Our palette is rooted in the earth but powered by the future.

### Core Palette
*   **Primary (Brushed Copper):** `#894d0d` (on-primary: `#ffffff`). This is our metallic soul, used for high-intent actions.
*   **Secondary (Bronze):** `#79573c`. Used for subtle emphasis and secondary narrative elements.
*   **Background (Soft Sand):** `#fcf9f5`. A warm, paper-like foundation that prevents eye strain.
*   **Tertiary (Ether):** `#006576`. A deep teal used sparingly for data-viz or technical highlights.

### The "No-Line" Rule
**Borders are prohibited for structural sectioning.** Boundaries must be defined solely through background shifts. To separate sections, transition from `surface` (#fcf9f5) to `surface-container-low` (#f6f3ef). A 1px solid line is a sign of a lack of confidence in your spacing; use the **Spacing Scale** (e.g., `16` for 5.5rem) to create distinct content zones instead.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
*   **Base:** `surface` (#fcf9f5)
*   **Low Elevation:** `surface-container-low` (#f6f3ef) for grouping.
*   **High Elevation:** `surface-container-highest` (#e5e2de) for active cards.
*   **Floating Panels:** Use Dark Mode elements (`inverse-surface`: #31302e) to create high-contrast "floating" modules that pop against the light background.

### The "Glass & Gradient" Rule
Standard flat colors are insufficient. Use `backdrop-blur` (20px-40px) on semi-transparent surface colors. Apply subtle radial gradients to CTAs, transitioning from `primary` (#894d0d) to `primary_container` (#a76526) at a 45-degree angle to mimic the sheen of real copper.

## 3. Typography
We utilize **Manrope** for its balance of geometric precision and organic warmth.

*   **Display (The Statement):** `display-lg` (3.5rem). Use sparingly for hero headers. Tighten letter-spacing (-0.02em) for an editorial feel.
*   **Headlines (The Narrative):** `headline-md` (1.75rem). Bold and authoritative.
*   **Title (The Label):** `title-md` (1.125rem). Medium weight for card titles.
*   **Body (The Content):** `body-lg` (1rem). High readability with generous line-height (1.6).
*   **Labels (The Metadata):** `label-md` (0.75rem). All-caps with increased letter-spacing (+0.05em) for a technical, "HUD" aesthetic.

## 4. Elevation & Depth
Depth is not a shadow; it is an atmosphere.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This "tonal pop" creates a sophisticated lift that feels architectural rather than digital.
*   **Ambient Shadows:** For floating elements, use `on-surface` (#1c1c1a) at **4% opacity** with a **40px blur** and **20px Y-offset**. It should feel like a cloud’s shadow, not a drop shadow.
*   **The "Ghost Border":** If a container requires definition, use the `outline-variant` (#d8c3b4) at **15% opacity**. This creates a "hairline" shimmer that captures the light.
*   **Magical Glow:** For active states or hover effects on copper elements, use a secondary radial glow: `box-shadow: 0 0 20px rgba(184, 115, 51, 0.4)`.

## 5. Components

### Buttons
*   **Primary:** Copper gradient, `rounded-lg` (1rem), with a subtle outer glow on hover.
*   **Secondary:** Glassmorphic (`surface` at 60% opacity) with a `backdrop-blur` and a "Ghost Border."
*   **Tertiary:** Text-only in `primary` color, with a 2px copper underline that expands from center on hover.

### Floating Cards
*   **Construction:** `surface-container-lowest` (#ffffff) at 80% opacity + `backdrop-blur` (30px).
*   **Separation:** Strictly forbid divider lines. Use `1.4rem` (Spacing 4) of vertical padding between internal card elements.

### Input Fields
*   **Style:** Minimalist. No bottom line or box border. Use a `surface-container-low` background with `rounded-sm`. 
*   **Active State:** The background shifts to `surface-container-highest` and the "Ghost Border" becomes 40% opaque copper.

### Data Visualization
*   **Gradients:** Use the `tertiary` (#006576) to `tertiary_container` (#008094) range for technical data to provide a "high-tech" counterpoint to the warm sand backgrounds.

## 6. Do's and Don'ts

### Do
*   **Do** use overlapping elements. A copper button overlapping the edge of a glass card creates "signature" depth.
*   **Do** lean into whitespace. If a layout feels "full," it has failed. 
*   **Do** use the Spacing Scale religiously to maintain a rhythmic, musical flow to the content.

### Don't
*   **Don't** use pure black (#000000). Even our dark panels use `inverse-surface` (#31302e) to keep the look "soft."
*   **Don't** use 1px solid borders for layout separation. This is the quickest way to make a premium design look like a bootstrap template.
*   **Don't** use standard "blue" for links. Use the Primary Copper or Tertiary Teal to maintain the signature palette.