/**
 * Wordex Design System — Sable & Cuivre (Sand & Copper)
 * High-end editorial aesthetic
 */

export const DESIGN_TOKENS = {
  colors: {
    // Sable (Backgrounds)
    background: "#fcf9f5",
    surface:    "#f6f3ef",
    surfaceContainer: "#f0ede9",
    surfaceGlass: "rgba(252, 249, 245, 0.7)",
    
    // Cuivre & Marron (Primary & Text)
    primary:    "#894d0d", // Deep Copper
    primaryContainer: "#a76526", // Light Copper
    primaryLight: "#ffdcc2",
    
    onSurface:  "#1c1c1a", // Almost black for text
    onSurfaceVariant: "#524439", // Brownish grey
    outlineVariant: "#d8c3b4", // Sand border
    
    // Accents
    tertiary:   "#006576", // Deep teal contrast
    tertiaryLight: "#a8edff",
    error:      "#ba1a1a",
  }
} as const;

export const getNavItems = (workspaceId: string = "demo-ws") => [
  { href: "/dashboard",                              icon: "auto_awesome",    label: "Workspace" },
  { href: `/workspace/${workspaceId}`,               icon: "description",     label: "Documents" },
  { href: `/workspace/${workspaceId}/files`,         icon: "inventory_2",     label: "Archives" },
  { href: `/workspace/${workspaceId}/sheets`,        icon: "table_chart",     label: "Sheets" },
  { href: `/workspace/${workspaceId}/slides`,        icon: "slideshow",       label: "Slides" },
  { href: `/workspace/${workspaceId}/pulse`,         icon: "insights",        label: "Pulse" },
  { href: `/workspace/${workspaceId}/history`,       icon: "history",         label: "History" },
  { href: `/dashboard/bi`,                           icon: "account_balance", label: "Control Tower" },
  { href: "/admin/agents",                           icon: "neurology",       label: "Agentic Lab" },
  { href: "/settings/integrations",                  icon: "hub",             label: "Bridges" },
  { href: "/settings/developer",                     icon: "terminal",        label: "Protocol Dev" },
  { href: "/settings/team",                          icon: "group",           label: "Team" },
] as const;

export const BOTTOM_NAV_ITEMS = [
  { href: "/settings/profile", icon: "settings",             label: "Settings" },
  { href: "/admin",            icon: "admin_panel_settings", label: "Admin" },
] as const;

export type NavItem = ReturnType<typeof getNavItems>[number];
