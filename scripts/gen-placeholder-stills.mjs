#!/usr/bin/env node
/**
 * Generates PLACEHOLDER hero stills (SVG) from the approved Stage 02 scene plate.
 * They stand in for the Blender renders (AVIF) produced in M2, so the T3 baseline, layout and LCP can be built now.
 * Same camera crops as the approved boards: desktop 1440×900, tablet 834×640, mobile 390×440.
 *
 *   node scripts/gen-placeholder-stills.mjs     (outputs are committed; re-run only if the plate changes)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const out = resolve(import.meta.dirname, '../public/stills/studio');
mkdirSync(out, { recursive: true });

const f = (pts) => pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
const pl = (cx, cy, a, h) => {
  const k = a * 0.22;
  return {
    top: f([[cx - a, cy], [cx, cy - k], [cx + a, cy], [cx, cy + k]]),
    left: f([[cx - a, cy], [cx, cy + k], [cx, cy + k + h], [cx - a, cy + h]]),
    right: f([[cx, cy + k], [cx + a, cy], [cx + a, cy + h], [cx, cy + k + h]]),
  };
};

let ticks = '';
for (let d = 5; d < 180; d += 5) {
  const major = d % 30 === 0;
  const r = (d * Math.PI) / 180;
  const x = 720 + 360 * Math.cos(r);
  const yb = 598 + 80 * Math.sin(r) - 3;
  ticks += `M${x.toFixed(1)} ${yb.toFixed(1)}V${(yb - (major ? 16 : 7)).toFixed(1)}`;
}
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let v = 0.45;
let ribs = '';
for (let i = 0; i < 15; i++) {
  v = Math.min(1, Math.max(0, v + (rnd() - 0.42) * 0.32));
  const base = 563 - i * 0.4;
  ribs += `M${905 + i * 4} ${base.toFixed(1)}V${(base - 6 - v * 24).toFixed(1)}`;
}
const pF = pl(720, 604, 78, 20), pB = pl(720, 515, 46, 12), pL = pl(505, 560, 58, 15), pR = pl(935, 560, 58, 15);

const scene = `
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F0E0C"/><stop offset="1" stop-color="#1D1A16"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C1915"/><stop offset=".5" stop-color="#13110E"/><stop offset="1" stop-color="#0B0A08"/></linearGradient>
    <radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F0A65A" stop-opacity=".32"/><stop offset=".45" stop-color="#F0A65A" stop-opacity=".11"/><stop offset="1" stop-color="#F0A65A" stop-opacity="0"/></radialGradient>
    <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C98A" stop-opacity=".16"/><stop offset="1" stop-color="#F7C98A" stop-opacity="0"/></linearGradient>
    <radialGradient id="top" cx=".5" cy=".32" r=".72"><stop offset="0" stop-color="#66736A"/><stop offset=".5" stop-color="#36403B"/><stop offset="1" stop-color="#1A201E"/></radialGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E1110"/><stop offset=".48" stop-color="#404B45"/><stop offset=".56" stop-color="#38423D"/><stop offset="1" stop-color="#0E1110"/></linearGradient>
    <linearGradient id="ped" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0A0C0B"/><stop offset=".5" stop-color="#252C29"/><stop offset="1" stop-color="#0A0C0B"/></linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1B201E"/><stop offset=".45" stop-color="#4C5852"/><stop offset="1" stop-color="#1B201E"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE2B0" stop-opacity=".5"/><stop offset="1" stop-color="#FFE2B0" stop-opacity="0"/></radialGradient>
    <linearGradient id="plaster" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F0EADF"/><stop offset="1" stop-color="#B5AD9F"/></linearGradient>
  </defs>
  <rect x="-600" y="-600" width="2640" height="1055" fill="url(#wall)"/>
  <rect x="-600" y="455" width="2640" height="1100" fill="url(#floor)"/>
  <rect x="140" y="50" width="380" height="360" fill="#121315" stroke="#26241F" stroke-width="6"/>
  <g stroke="#26241F" stroke-width="4"><path d="M235 50V410M330 50V410M425 50V410M140 122H520M140 194H520M140 266H520M140 338H520"/></g>
  <polygon points="240,50 300,50 190,410 140,410 140,360" fill="#ECE5D6" opacity=".035"/>
  <rect x="1060" y="330" width="300" height="125" fill="#181613"/>
  <rect x="1080" y="316" width="190" height="14" rx="7" fill="#57534B"/><rect x="1120" y="304" width="150" height="12" rx="6" fill="#47443D"/>
  <g stroke="#25221D" stroke-width="2"><path d="M1060 356H1360M1060 382H1360M1060 408H1360M1060 432H1360"/></g>
  <g fill="#6E5B38"><rect x="1200" y="341" width="20" height="4"/><rect x="1200" y="367" width="20" height="4"/><rect x="1200" y="393" width="20" height="4"/><rect x="1200" y="418" width="20" height="4"/></g>
  <g stroke="#221F1A" stroke-width="1.5" fill="none"><path d="M720 455L-300 1300M720 455L260 1300M720 455L1180 1300M720 455L1740 1300M-600 540H2040M-600 820H2040"/></g>
  <ellipse cx="720" cy="700" rx="640" ry="200" fill="url(#pool)"/>
  <polygon points="650,210 790,210 1110,700 330,700" fill="url(#cone)"/>
  <ellipse cx="720" cy="738" rx="320" ry="50" fill="#000" opacity=".6"/>
  <path d="M520 640L545 730A175 32 0 0 0 895 730L920 640Z" fill="url(#ped)"/>
  <polygon points="712,694 728,694 720,683" fill="#B8924F"/>
  <path d="M360 560L360 598A360 80 0 0 0 1080 598L1080 560A360 78 0 0 1 360 560Z" fill="url(#side)"/>
  <path d="${ticks}" stroke="#ECE5D6" stroke-opacity=".38" fill="none"/>
  <rect x="716" y="643" width="8" height="30" fill="#E0532F"/>
  <ellipse cx="720" cy="560" rx="360" ry="78" fill="url(#top)"/>
  <ellipse cx="720" cy="560" rx="359" ry="77.5" fill="none" stroke="#7D897F" stroke-opacity=".55" stroke-width="1.5"/>
  <ellipse cx="720" cy="560" rx="300" ry="65" fill="none" stroke="#0E1110" stroke-opacity=".75" stroke-width="1.5"/>
  <g stroke="#0E1110" stroke-opacity=".8" stroke-width="3"><path d="M720 560V626M720 560V494M720 560H418M720 560H1022"/></g>
  <circle cx="720" cy="560" r="6" fill="#B8924F"/>
  <g><polygon points="${pB.left}" fill="#251E18"/><polygon points="${pB.right}" fill="#19140F"/><polygon points="${pB.top}" fill="#3B3027"/>
    <ellipse cx="720" cy="512" rx="35" ry="7.7" fill="#2F3B2F"/><ellipse cx="721" cy="509" rx="30" ry="6.5" fill="#3F4C3B"/><ellipse cx="722" cy="506" rx="24" ry="5.3" fill="#56614A"/>
    <ellipse cx="721" cy="503" rx="18" ry="3.9" fill="#7A7F65"/><ellipse cx="720" cy="500" rx="11" ry="2.5" fill="#A9A58F"/><ellipse cx="720" cy="498" rx="6" ry="1.3" fill="#D4CDBB"/></g>
  <g><polygon points="${pL.left}" fill="#251E18"/><polygon points="${pL.right}" fill="#19140F"/><polygon points="${pL.top}" fill="#3B3027"/>
    <rect x="478" y="528" width="14" height="26" fill="#E9E3D7"/><rect x="492" y="532" width="6" height="22" fill="#A9A294"/><rect x="501" y="538" width="18" height="17" fill="#DDD6C9"/>
    <rect x="519" y="542" width="6" height="13" fill="#9F988B"/><rect x="528" y="546" width="10" height="10" fill="#E3DDD0"/><rect x="538" y="549" width="4" height="7" fill="#A39C8F"/></g>
  <g><polygon points="${pR.left}" fill="#251E18"/><polygon points="${pR.right}" fill="#19140F"/><polygon points="${pR.top}" fill="#3B3027"/>
    <path d="${ribs}" stroke="#C8A877" stroke-width="2.4" fill="none"/><path d="M963 562V526" stroke="#C9A25A" stroke-width="1.6"/></g>
  <g><polygon points="${pF.left}" fill="#251E18"/><polygon points="${pF.right}" fill="#19140F"/><polygon points="${pF.top}" fill="#3B3027"/>
    <g transform="translate(712 606) scale(.24)"><ellipse rx="70" ry="12" fill="#14110E"/><rect x="-5" y="-62" width="10" height="62" fill="#3A403C"/>
      <path d="M-42 -60L-46 -150H46L42 -60Z" fill="url(#plaster)"/><rect x="-70" y="-205" width="140" height="125" rx="30" fill="url(#plaster)"/>
      <path d="M-52 -195V-315M-18 -198V-338M16 -195V-325M48 -190V-295" stroke="#DCD5C8" stroke-width="28" stroke-linecap="round" fill="none"/>
      <path d="M-48 -110L-78 -136L-102 -160L-122 -178" stroke="#E6E0D4" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
    <path d="M770 604V556M740 556H772" stroke="#3A403C" stroke-width="1.6"/><rect x="742" y="557" width="12" height="8" fill="#2B302D"/><circle cx="741" cy="561" r="3" fill="#0E0F0F"/><circle cx="752" cy="559" r=".9" fill="#E0532F"/></g>
  <path d="M720 -600V142" stroke="#2A2622" stroke-width="2"/><rect x="710" y="136" width="20" height="14" fill="#2B302D"/>
  <path d="M680 150L760 150L798 204Q720 220 642 204Z" fill="url(#shade)"/>
  <ellipse cx="720" cy="212" rx="170" ry="60" fill="url(#glow)"/><ellipse cx="720" cy="206" rx="77" ry="9" fill="#FFE0AC"/>
  <polygon points="-600,800 300,846 380,1600 -600,1600" fill="#090807"/>
  <path d="M-600 800L300 846" stroke="#F0A65A" stroke-opacity=".14" stroke-width="2"/>`;

const variants = {
  'hero-desktop.svg': { vb: [-240, -10, 1440, 900] },
  'hero-tablet.svg': { vb: [200, 80, 1040, 798] },
  'hero-mobile.svg': { vb: [350, 110, 780, 880] },
};
for (const [name, { vb }] of Object.entries(variants)) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- PLACEHOLDER still generated by scripts/gen-placeholder-stills.mjs from the approved Stage 02 scene plate. Replaced by Blender renders in M2. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${vb[2]}" height="${vb[3]}" preserveAspectRatio="xMidYMid slice">${scene}
</svg>
`;
  writeFileSync(join(out, name), svg);
  console.log(`wrote public/stills/studio/${name} (${(svg.length / 1024).toFixed(1)} KB raw)`);
}
