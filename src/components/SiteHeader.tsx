import { primaryNav } from '../content/chapters';
import { site } from '../content/site';

/** M0 skeleton: semantic structure only. The designed header (dial, quality control, menu) is M1. */
export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        {site.name.value}
      </a>
      <nav aria-label="Primary">
        <ul>
          {primaryNav.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
