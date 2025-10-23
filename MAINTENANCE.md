# GitHub Pages Maintenance Guide

## Initial GitHub Setup (One-Time Configuration)

This repository is configured to use **GitHub Actions** for deployment instead of the legacy Jekyll build system.

### Repository Settings
1. Go to: https://github.com/marhar/marhar.github.io/settings/pages
2. Under "Build and deployment" → "Source": **GitHub Actions** (NOT "Deploy from a branch")
3. This allows the workflow at `.github/workflows/pages.yml` to handle deployments

### Key Files
- `.nojekyll` - Tells GitHub Pages to skip Jekyll processing (required for static HTML sites)
- `.github/workflows/pages.yml` - GitHub Actions workflow that deploys the site automatically on every push

**Note:** If you ever recreate this repository or need to set up a new GitHub Pages site, remember to:
1. Set the source to "GitHub Actions" in repository settings
2. Include a `.nojekyll` file in the root
3. Use the workflow file from this repository

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
