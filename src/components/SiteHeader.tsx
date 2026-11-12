import { chapters, primaryNav } from '../content/chapters';
import { site } from '../content/site';
import { IndexDial } from './IndexDial';
import { QualityPanel } from './QualityPanel';

/**
 * Studio header. Without JavaScript: name + the primary nav, wrapped. With JavaScript (data-js on <html>):
 * <1024px the nav collapses into the MENU panel; ≥1024px the QUALITY popover sits at the end of the nav.
 */
export function SiteHeader() {
  return (
    <>
      <header className="site-header site-header--studio">
        <a className="brand" href="/">
          {site.name.value}
        </a>
        <p className="header-dial">
          <IndexDial />
          <span>Studio · 00 / 04</span>
        </p>
        <nav className="primary-nav" aria-label="Primary">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <div className="quality" data-needs-js data-quality-root>
            <button type="button" className="tool-button" data-quality-toggle aria-expanded="false" aria-controls="quality-pop">
              Quality · <span data-quality-label>Auto</span>
            </button>
            <div id="quality-pop" className="quality__popover" hidden>
              <QualityPanel prefix="pop" />
            </div>
          </div>
          <button type="button" className="tool-button tool-button--menu" data-needs-js data-menu-toggle aria-expanded="false" aria-controls="menu-panel">
            Menu
          </button>
        </div>
      </header>

      <div id="menu-panel" className="menu-panel" role="dialog" aria-modal="true" aria-label="Chapters and settings" hidden>
        <nav aria-label="Chapters">
          <ol>
            {chapters.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  <span className="menu-panel__num">{c.number}</span>
                  {c.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu-panel__quality" data-quality-root>
          <QualityPanel prefix="menu" />
        </div>
      </div>
    </>
  );
}
