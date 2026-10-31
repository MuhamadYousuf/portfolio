# Muhammad Yousuf — Graphic Design Portfolio

A 3D, graphic-design-first portfolio built with **Vite**, **Three.js**, **GSAP** and **Lenis**.

- Draggable 3D ring of project posters around an iridescent liquid-chrome blob (click a poster to open it)
- Kinetic display type, scroll-reactive marquees, custom cursor, film grain
- Project grid with 3D tilt cards and a detail modal
- Services, about (animated stats), process, clients, testimonial and contact sections

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
- Copy, email and social links: `index.html`
- Colours and type: CSS variables at the top of `src/style.css`
