# Muhammad Yousuf — Graphic Design Portfolio

A 3D, graphic-design-first portfolio built with **Vite**, **Three.js**, **GSAP** and **Lenis**.

- Draggable 3D ring of project posters around an iridescent liquid-chrome blob (click a poster to open it)
- Kinetic display type, scroll-reactive marquees, custom cursor, film grain
- Filterable project grid with 3D tilt cards; each project opens a case-study sheet with brief, approach, palette (click a swatch to copy its hex), typography and deliverables
- Design principles, services, craft (typography, colour, grid, print) with toolkit, experience timeline, process
- Contact opens a Gmail compose window; headlines auto-fit their column so nothing overflows on phones

## Develop

```bash
npm install
npm run dev
```

## Deploy on Vercel

Import this repo in Vercel. It detects Vite automatically:

- Build command: `npm run build`
- Output directory: `dist`

## Edit content

- Projects: `src/projects.js` (artwork lives in `public/work/*.svg`, one file per project slug)
- Contact email: `EMAIL` at the top of `src/main.js` (and the visible address in `index.html`)
- Copy and sections: `index.html`
- Colours and type: CSS variables at the top of `src/style.css`; v2 sections in `src/sections.css`
