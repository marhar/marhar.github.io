# Claude Code Instructions for marhar.github.io

Personal website and web apps hosted on GitHub Pages.

## Project Structure

```
marhar.github.io/
├── index.html          # Main landing page
├── apps/               # Interactive web applications
│   ├── app-theme.css   # Shared theme (CSS variables, dark mode)
│   ├── mortgage-payoff/
│   ├── stockreturns/
│   ├── pid-demo/
│   ├── geoavg/
│   ├── double-pendulum/
│   └── duckdb-explorer/
├── blog/               # Blog posts
├── simple.min.css      # Site-wide CSS framework
└── style.min.css       # Site-wide custom styles
```

## App Conventions

### Shared Theme
Apps should link `../app-theme.css` for consistent styling:
- CSS variables for colors, typography, spacing
- Dark mode support via `prefers-color-scheme`
- Common components: `.app-header`, `.panel`, buttons

### App Structure
Each app is typically a single-file HTML application:
- Self-contained HTML/CSS/JS
- No build step required
- Canvas-based visualizations where appropriate
- Optional README.md for documentation

### Header Pattern
Apps use a compact header with navigation:
```html
<header class="app-header">
    <div class="header-left">
        <h1>App Name</h1>
        <span class="subtitle">Description</span>
    </div>
    <nav>
        <a href="https://marhar.github.io/">Home</a>
        <!-- other links -->
    </nav>
</header>
```

## Testing

Some apps have test suites:
- `tests.js` - Test definitions
- `test-runner.html` - Browser-based runner
- `run_tests.js` - Node.js runner (run with `node run_tests.js`)

## Deployment

- Push to `master` branch deploys automatically via GitHub Pages
- No build step - static files served directly
- `.nojekyll` file disables Jekyll processing

## DuckDB WASM Notes

When using DuckDB WASM in browser apps:

- **Community extensions not available**: Extensions like `ducklake` from the community repository don't have WASM builds. Workaround: load parquet files directly with `read_parquet('https://...')`.

- **Date/timestamp handling**: DuckDB WASM returns dates as milliseconds since epoch (not days), often as BigInt. To detect and format timestamps, check if `Math.abs(value)` is between 1e10 and 1e14, then use `new Date(value)` directly.
