# GitHub Pages Maintenance Guide

## Making Changes to Your Website

### 1. Edit files locally
Edit any HTML, CSS, or other files in `/Users/markharrison/g/marhar.github.io/`

### 2. Commit and push changes
```bash
cd /Users/markharrison/g/marhar.github.io
git add .
git commit -m "Description of your changes"
git push
```

### 3. Wait for deployment
- GitHub Actions will automatically build and deploy (takes 30-60 seconds)
- Check progress: `gh run list --limit 1`
- Or visit: https://github.com/marhar/marhar.github.io/actions

### 4. View your changes
- Visit: https://marhar.github.io/
- If you don't see changes, hard refresh: `Cmd + Shift + R` (Mac) or open in incognito mode

## Important Notes

**Directory names:**
- Avoid hyphens in directory names (use `payoff` not `payoff-or-invest`)
- Use lowercase, simple names

**Clearing browser cache:**
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or use Incognito/Private mode for testing
- GitHub Pages CDN caches for up to 10 minutes

**File requirements:**
- Each directory needs an `index.html` file to be accessible as a page
- Keep the `.nojekyll` file in the root (tells GitHub to skip Jekyll processing)
- Don't modify `.github/workflows/pages.yml` (handles deployment)

**Checking if site is live:**
```bash
curl -I https://marhar.github.io/your-page/
# Look for "HTTP/2 200" = success, "HTTP/2 404" = not found
```

That's it! Just edit → commit → push → wait → refresh browser.
