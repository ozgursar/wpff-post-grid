# WP Fix Fast Post Grid

A filterable post grid Gutenberg block with taxonomy filter buttons. Server-side rendered, works with any public post type.

## Block

Registered as `wpff-post-grid/post-grid` and available in the block inserter under **Widgets → Post Grid**.

---

## Settings

### Query Settings
| Setting | Description |
|---|---|
| Post Type | Any registered public post type |
| Filter Taxonomy | Taxonomy to build the filter buttons from. Leave empty to hide filters. |
| Posts Per Page | 1–100. Displays all matching posts for the queried term on archive pages. |
| Order By | Date, Title, Menu Order, Last Modified, or Random |
| Order | Ascending or Descending |

**Archive pages:** when the block is placed on a taxonomy archive template, it automatically filters results to the current term.

---

### Layout
| Setting | Description |
|---|---|
| Columns (Desktop) | 1–6 columns |
| Columns (Mobile) | 1–4 columns |
| Gap | Any CSS length value with unit selector (rem, px, em) |

---

### Card Settings
| Setting | Description |
|---|---|
| Show Featured Image | Toggle image display |
| Image Size | thumbnail, medium, medium_large, large, full |
| Image Ratio | Square (1:1), Landscape (4:3), Standard (3:2), Widescreen (16:9), Portrait (2:3 / 3:4) |
| Show Title | Toggle title display |
| Show Category Above Title | Shows the first term from the filter taxonomy above the title |
| Show Excerpt | Toggle excerpt display |
| Excerpt Length | Word count, 5–100 |
| Show Date | Toggle publication date |
| Show Read More Button | Toggle read more link |
| Read More Button Text | Customisable label |
| Download File | Adds `download` attribute to the Read More link |
| Title / Excerpt / Category Font Size | Theme preset font sizes |

---

### Link Settings
| Setting | Description |
|---|---|
| Link Target | Post permalink or a custom meta field value |
| Meta Field Key | Select from registered meta fields or enter manually |
| Open in New Tab | Applies to image and title links |

---

### Card Color
| Setting | Description |
|---|---|
| Card Background | Full theme palette + custom colour picker |
| Card Border | Full theme palette + custom colour picker. No colour = no border. |

---

### Style
| Setting | Description |
|---|---|
| Card Border Width | Any CSS length (px, rem, em, %). Only applied when a border colour is also set. |
| Card Border Radius | Any CSS length (px, rem, em, %) |
| Card Item Padding | CSS shorthand applied to the whole card including the image (e.g. `10px 20px`). Set to `0` to keep the image full-width. |
| Card Content Padding | CSS shorthand applied to the text content area only (e.g. `1rem`) |

---

### Filter Buttons
| Setting | Description |
|---|---|
| Button Alignment | Left, Center, Right |
| Button Style | Pill, Square, Outline |
| Show "All" Button | Toggle the "show all" filter button |
| "All" Button Label | Customisable label |
| Button Color | Full theme palette + custom colour picker |

---

## Frontend Behaviour

- Filter buttons show/hide cards instantly using the **View Transitions API** for per-card fade animations. Falls back to instant toggle on unsupported browsers.
- The first card image loads `eager` with `fetchpriority="high"`. All subsequent images load `lazy`.
- Respects `prefers-reduced-motion`.

---

## Development

```bash
npm install
npm run build   # minify all assets
npm run watch   # watch for changes
```

Build tool: [esbuild](https://esbuild.github.io/)

### File structure
```
wpff-post-grid/
├── wpff-post-grid.php               # Plugin bootstrap
├── includes/
│   └── class-wpff-post-grid.php     # Block registration & server-side rendering
├── blocks/
│   └── wpff-post-grid/
│       ├── editor.js                # Block editor component (source)
│       └── editor.min.js            # Minified (generated)
├── assets/
│   ├── css/
│   │   ├── wpff-post-grid.css       # Frontend styles (source)
│   │   ├── wpff-post-grid.min.css   # Minified (generated)
│   │   ├── wpff-post-grid-editor.css
│   │   └── wpff-post-grid-editor.min.css
│   └── js/
│       ├── wpff-post-grid.js        # Frontend filter behaviour (source)
│       └── wpff-post-grid.min.js    # Minified (generated)
├── build.js
└── package.json
```
