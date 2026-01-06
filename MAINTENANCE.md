# GitHub Pages Maintenance Guide

## Site Overview

This is a static HTML website hosted on GitHub Pages. No build system is required - just edit HTML/CSS/JS files directly.

## Making Changes

### 1. Edit files locally
Edit any HTML, CSS, or other files in this directory.

### 2. Commit and push changes
```bash
git add .
git commit -m "Description of your changes"
git push
```

### 3. Wait for deployment
- GitHub Actions will automatically deploy (30-60 seconds)
- Check progress: `gh run list --limit 1`
- Or visit: https://github.com/marhar/marhar.github.io/actions

### 4. View your changes
- Visit: https://marhar.github.io/
- If you don't see changes, hard refresh: `Cmd + Shift + R` (Mac) or open in incognito mode

## Key Files

- `.nojekyll` - Tells GitHub Pages to skip Jekyll processing
- `.github/workflows/pages.yml` - GitHub Actions workflow for deployment

## Important Notes

**Directory names:**
- Avoid hyphens in directory names (use `payoff` not `payoff-or-invest`)
- Use lowercase, simple names

**Browser cache:**
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or use incognito/private mode for testing
- GitHub Pages CDN caches for up to 10 minutes

**Adding new pages:**
- Each directory needs an `index.html` file to be accessible as a page
- Copy the structure from an existing page (header, nav, footer) for consistency

**Checking if site is live:**
```bash
curl -I https://marhar.github.io/your-page/
# Look for "HTTP/2 200" = success, "HTTP/2 404" = not found
```
