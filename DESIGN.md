# QRE-Agent Platform v1.0 — Design System

## Direction & Purpose
Utilitarian dark dashboard for R&D tax credit tracking and admin approval workflows. High information density, zero decoration, every pixel serves classification and decision-making.

## Tone
Brutalist, productivity-focused, professional precision. Dark-on-dark depth hierarchy. No animations beyond subtle transitions.

## Palette (OKLCH)
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Background | 0.99 0 0 (white) | 0.065 0 0 (#0a0a0f) | Page base |
| Card | 1.0 0 0 | 0.107 0 0 (#0f172a) | Content containers |
| Border | 0.9 0 0 | 0.18 0 0 (#1e293b) | Dividers, strokes |
| Primary | 0.35 0 0 | 0.62 0.22 262 (#6366f1 indigo) | Buttons, active nav |
| Destructive | 0.55 0.22 25 | 0.60 0.22 25 (#ef4444 red) | Reject, danger |
| Success | green-500 | green-600 (#22c55e) | Eligible badge |
| Warning | amber-500 | amber-600 (#f59e0b) | Borderline badge |

## Typography
| Layer | Font | Usage |
|-------|------|-------|
| Display | General Sans | Headings, labels |
| Body | General Sans | Body text, UI copy |
| Mono | JetBrains Mono | Scores, timestamps, hashes, quantum values |

## Structural Zones
| Zone | Background | Border | Notes |
|------|-----------|--------|-------|
| Header | card | border-b | Branding, user menu |
| Sidebar | card | border-r | Persistent navigation, collapsible mobile |
| Main Content | background | none | Activity tables, forms, detail panels |
| Admin Detail Panel | popover | border | Modal overlay with classification breakdown |
| Eligibility Badges | Semantic (green/amber/red) backgrounds | none | Colored pills with text |

## Patterns
- **Score Badge**: Colored pill (`score-pill` class). Numeric in mono, label in body. Eligible=green, Borderline=amber, Ineligible=red.
- **Four-Part Test**: Rows with check/X icon + label + supporting note.
- **Quantum Score**: ⚛ Unicode prefix + value in mono, separate visual tier from classical score.
- **Admin Suggestion Chip**: `admin-suggestion-{approve|reject|info}` class. Icon + text, colored background.
- **Activity Table**: Dense grid, right-aligned numeric columns, left-aligned text. Sortable headers, inline edit for admin actions.
- **Audit Trail**: Monospace timestamp + action label + principal abbrev (last 4 chars).

## Motion
Transition default: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (easing-in-out-quad). No entrance animations, no bounce. Transitions applied to: hover states, active states, modal fade.

## Constraints
- **No gradients** (generic AI aesthetic). Solid backgrounds only.
- **No decorative shadows** (glow, blur orbs). Utility shadows for elevation only.
- **No color modulation** beyond primary/destructive/semantic status. No button color variants beyond action type.
- **Density over whitespace**: Cards/sections stacked tight. Rhythm driven by typography weight, not spacing.
- **Contrast verification**: All foreground-on-background pairs ≥ AA+ (L diff ≥ 0.7), all foreground-on-primary ≥ 0.45.

## Signature Detail
Dark-on-dark card elevation using border-top + subtle top shadow (card sits "below" header). Status badges as semantic-colored pills — visual language consistent with RFC §41 decision tree (green=go, amber=caution, red=stop). Quantum score isolated with ⚛ Unicode symbol — signals advanced classification, differentiates from classical scoring.
