import { chapters, type Chapter } from '../content/chapters';
import { projectById } from '../content/projects';
import { FactText } from '../components/Fact';
import { Scaffold } from '../components/Scaffold';
import { SiteHeader } from '../components/SiteHeader';
import { SkipLink } from '../components/SkipLink';
import { Hero } from '../chapters/Hero';

function ChapterBody({ chapter }: { chapter: Chapter }) {
  const headingId = `h-${chapter.id}`;

  if (chapter.kind === 'station' && chapter.projectId) {
    const p = projectById(chapter.projectId);
    return (
      <>
        <h2 id={headingId}>{p.title.value}</h2>
        <p className="lead">
          <FactText id={`${p.id}.summary`} fact={p.summary} />
        </p>
        {p.disclosures?.map((d, i) => (
          <p key={i} className="disclosure">
            <FactText id={`${p.id}.disclosure.${i}`} fact={d} />
          </p>
        ))}
        <p>
          <a href={`/work/${p.id}`}>Read the {p.title.value} case study</a>
        </p>
      </>
    );
  }

  return <h2 id={headingId}>{chapter.label}</h2>;
}

export function StudioPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        {chapters.filter((c) => c.kind !== 'hero').map((chapter) => (
          <section key={chapter.id} id={chapter.id} aria-labelledby={`h-${chapter.id}`} className="chapter">
            <p className="chapter-label">
              {chapter.number} — {chapter.label}
            </p>
            <ChapterBody chapter={chapter} />
            <Scaffold id={`scaffold.${chapter.id}`} what={`the ${chapter.label} chapter`} milestone={chapter.milestone} />
          </section>
        ))}
      </main>
    </>
  );
}
