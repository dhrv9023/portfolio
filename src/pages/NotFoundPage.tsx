import { projects } from '../content/projects';

/** Static page. Its template loads no JavaScript. */
export function NotFoundPage() {
  return (
    <main id="main" className="not-found">
      <p className="chapter-label">404</p>
      <h1>Nothing on this station.</h1>
      <p>
        <a className="button" href="/">
          Back to the studio
        </a>
      </p>
      <h2>Case studies</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <a href={`/work/${p.id}`}>{p.title.value}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
