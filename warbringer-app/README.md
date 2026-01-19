# WARBRINGER - Wargame Mission Generator

A visual mission/scenario generator for tabletop wargames including:
- Warhammer 40,000
- Age of Sigmar
- One Page Rules (Grimdark Future / Age of Fantasy)
- Bolt Action
- Custom / Other systems

## Features

- 🎯 Visual board with drag-and-drop terrain & objectives
- 🗺️ Pre-built deployment patterns or paint your own zones
- ⚡ One-click random mission generation
- 📋 System-specific terrain rules, twists, and victory conditions
- 💾 Export missions as JSON

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Vercel (Easiest)

### Option 1: Via GitHub
1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" → Import your repo
4. Vercel auto-detects Vite and deploys
5. Done! You get a `.vercel.app` URL

### Option 2: Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

## Deploy to Netlify

### Option 1: Drag & Drop
1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to the deploy zone
4. Done!

### Option 2: Via GitHub
1. Push to GitHub
2. Connect repo in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

## Deploy to GitHub Pages

1. Add to `vite.config.js`:
```js
export default defineConfig({
  base: '/warbringer/', // your repo name
  plugins: [react()],
})
```

2. Build and deploy:
```bash
npm run build
# Push dist folder to gh-pages branch
```

## Tech Stack

- React 18
- Vite
- Pure CSS (no frameworks)
- SVG icons (custom)

## License

MIT - Use it however you want!
