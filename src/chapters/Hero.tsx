import { chapters } from '../content/chapters';
import { hero, stills } from '../content/hero';
import { site } from '../content/site';
import { FactText } from '../components/Fact';

/** Decorative leader lines and labels. Same viewBox and bottom-anchored slice as the desktop still (object-position: bottom), so they stay registered with it. */
function HeroAnnotations() {
  return (
    <svg className="hero__annotations" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      {hero.annotations.map((a) => {
        const [first] = a.leader;
        return (
          <g key={a.lines[0]}>
            <polyline points={a.leader.map((p) => p.join(',')).join(' ')} fill="none" stroke="#ece5d6" strokeOpacity=".45" />
            {first ? <circle cx={first[0]} cy={first[1]} r="2.5" fill="#f0a65a" /> : null}
            <text textAnchor={a.label.anchor} fontSize="11">
              {a.lines.map((line, i) => (
                <tspan key={line} x={a.label.x} y={a.label.y + 11 + i * 17.6}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Hero() {
  const [first, ...rest] = site.name.value.split(' ');
  return (
    <section id="studio" className="hero" aria-labelledby="h-studio">
      <div className="hero__stage">
        <picture>
          <source media={`(min-width: ${stills.desktop.minWidth}px)`} srcSet={stills.desktop.src} width={stills.desktop.width} height={stills.desktop.height} />
          <source media={`(min-width: ${stills.tablet.minWidth}px)`} srcSet={stills.tablet.src} width={stills.tablet.width} height={stills.tablet.height} />
          <img src={stills.mobile.src} width={stills.mobile.width} height={stills.mobile.height} alt={hero.stillAlt} fetchPriority="high" decoding="async" />
        </picture>
        <HeroAnnotations />
      </div>

      <div className="hero__copy">
        <p className="eyebrow">
          <span className="eyebrow__mark" aria-hidden="true" />
          {hero.eyebrow}
        </p>
        <h1 id="h-studio">
          <span className="h1-line">{first}</span> <span className="h1-line">{rest.join(' ')}</span>
        </h1>
        <p className="lead">
          <FactText id="site.positioning" fact={site.positioning} />
        </p>
        <div className="hero__cta">
          <a className="button" href={hero.ctaPrimary.href}>
            {hero.ctaPrimary.label} <span aria-hidden="true">↓</span>
          </a>
          <a className="button button--ghost" href={hero.ctaSecondary.href}>
            {hero.ctaSecondary.label}
          </a>
        </div>
      </div>

      <div className="hero__foot">
        <p className="hero__cue" aria-hidden="true">
          <span className="hero__cue-line" />
          {hero.scrollCue}
        </p>
        <nav aria-label="Chapter index">
          <ol>
            {chapters.slice(0, 5).map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`} aria-current={i === 0 ? 'true' : undefined}>
                  {c.number} {c.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
