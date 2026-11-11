import { CASE_CHAPTERS, projectById, projects, type ProjectId } from '../content/projects';
import { FactText } from '../components/Fact';
import { Scaffold } from '../components/Scaffold';
import { SkipLink } from '../components/SkipLink';

export function CaseStudyPage({ projectId }: { projectId: ProjectId }) {
  const p = projectById(projectId);
  const index = projects.findIndex((x) => x.id === projectId);
  const prev = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;
  const cs = p.caseStudy;

  return (
    <>
      <SkipLink />
      <header className="site-header">
        <a href={`/#${p.id}`}>← Back to the studio · Station {p.number}</a>
        <span className="chapter-label">
          Case study {p.number} / {String(projects.length).padStart(2, '0')}
        </span>
      </header>
      <main id="main" tabIndex={-1}>
        <article aria-labelledby="case-title">
          <p className="chapter-label">
            {p.number} — {p.world}
          </p>
          <h1 id="case-title">{p.title.value}</h1>
          <p className="lead">
            <FactText id={`${p.id}.summary`} fact={p.summary} />
          </p>
          {p.disclosures?.map((d, i) => (
            <p key={i} className="disclosure">
              <FactText id={`${p.id}.disclosure.${i}`} fact={d} />
            </p>
          ))}

          <dl className="overview">
            <div><dt>Role</dt><dd><FactText id={`${p.id}.role`} fact={p.role} /></dd></div>
            <div><dt>Team</dt><dd><FactText id={`${p.id}.team`} fact={p.team} /></dd></div>
            <div><dt>Period</dt><dd><FactText id={`${p.id}.period`} fact={p.period} /></dd></div>
            <div><dt>Status</dt><dd><FactText id={`${p.id}.status`} fact={p.status} /></dd></div>
          </dl>

          <nav aria-label="Case study chapters">
            <ol>
              {CASE_CHAPTERS.map(([key, label], i) => (
                <li key={key}>
                  <a href={`#${key}`}>
                    {String(i + 1).padStart(2, '0')} {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section id="problem" aria-labelledby="h-problem">
            <h2 id="h-problem">Problem</h2>
            <p><FactText id={`${p.id}.problem`} fact={cs.problem} /></p>
          </section>
          <section id="solution" aria-labelledby="h-solution">
            <h2 id="h-solution">Solution</h2>
            <p><FactText id={`${p.id}.solution`} fact={cs.solution} /></p>
          </section>
          <section id="architecture" aria-labelledby="h-architecture">
            <h2 id="h-architecture">Architecture</h2>
            <ol className="architecture">
              {cs.architecture.nodes.map((n) => (
                <li key={n.id} data-node-status={n.label.status}>
                  <FactText id={`${p.id}.architecture.${n.id}`} fact={n.label} />
                </li>
              ))}
            </ol>
          </section>
          <section id="stack" aria-labelledby="h-stack">
            <h2 id="h-stack">Tech stack</h2>
            <p><FactText id={`${p.id}.stack`} fact={cs.stack} /></p>
          </section>
          <section id="contribution" aria-labelledby="h-contribution">
            <h2 id="h-contribution">My contribution</h2>
            <p><FactText id={`${p.id}.contribution`} fact={cs.contribution} /></p>
          </section>
          <section id="challenges" aria-labelledby="h-challenges">
            <h2 id="h-challenges">Technical challenges</h2>
            <p><FactText id={`${p.id}.challenges`} fact={cs.challenges} /></p>
          </section>
          <section id="results" aria-labelledby="h-results">
            <h2 id="h-results">Results &amp; evidence</h2>
            <p><FactText id={`${p.id}.results`} fact={cs.results} /></p>
          </section>
          <section id="links" aria-labelledby="h-links">
            <h2 id="h-links">Links</h2>
            <ul>
              <li>GitHub: <FactText id={`${p.id}.links.github`} fact={p.links.github} /></li>
              <li>Live: <FactText id={`${p.id}.links.live`} fact={p.links.live} /></li>
              <li>Demo video: <FactText id={`${p.id}.links.video`} fact={p.links.video} /></li>
            </ul>
          </section>

          <Scaffold id={`scaffold.case.${p.id}`} what="the designed case-study layout" milestone="M8" />
        </article>

        <nav aria-label="More case studies" className="case-pager">
          {prev ? <a href={`/work/${prev.id}`}>{`← Previous: ${prev.title.value}`}</a> : null}
          {next ? (
            <a href={`/work/${next.id}`}>{`Next: ${next.title.value} →`}</a>
          ) : (
            <>
              <a href={`/#${projects[0]?.id ?? ''}`}>Back to all work</a>
              <a href="/#contact">Contact</a>
            </>
          )}
        </nav>
      </main>
    </>
  );
}
