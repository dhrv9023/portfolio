import { assumed, known, verify } from '../schema';
import { BRIEF, placeholderCaseText, placeholderFields } from './common';
import type { Project } from './types';

export const pravah: Project = {
  id: 'pravah',
  number: '03',
  title: known('PRAVAH', 'project name from brief'),
  world: 'The Living Map',
  summary: verify(
    'An AI-powered biodiversity conservation platform: environmental data, AI analytics and interactive visualisation.',
    BRIEF,
  ),
  ...placeholderFields(),
  caseStudy: {
    ...placeholderCaseText(),
    solution: verify('[SOLUTION — how it works, in your words]', BRIEF),
    architecture: {
      nodes: [
        { id: 'sources', label: verify('[ENVIRONMENTAL DATA SOURCES]') },
        { id: 'ingest', label: assumed('Ingestion & cleaning') },
        { id: 'analytics', label: verify('AI analytics — what do they do?', BRIEF) },
        { id: 'api', label: assumed('API') },
        { id: 'viz', label: verify('Interactive visualisation — library?', BRIEF) },
      ],
      edges: [
        ['sources', 'ingest'],
        ['ingest', 'analytics'],
        ['analytics', 'api'],
        ['api', 'viz'],
      ],
    },
    stack: verify(['[STACK]']),
  },
};
