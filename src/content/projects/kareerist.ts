import { assumed, known, verify } from '../schema';
import { BRIEF, placeholderCaseText, placeholderFields } from './common';
import type { Project } from './types';

export const kareerist: Project = {
  id: 'kareerist',
  number: '04',
  title: known('Kareerist', 'project name from brief'),
  world: 'The Platform',
  summary: verify(
    'A career-toolkit SaaS: resume analysis, ATS scoring and AI-powered interview functionality, with backend and workflow automation.',
    BRIEF,
  ),
  ...placeholderFields(),
  caseStudy: {
    ...placeholderCaseText(),
    solution: verify('[SOLUTION — how it works, in your words]', BRIEF),
    architecture: {
      nodes: [
        { id: 'frontend', label: assumed('Front end') },
        { id: 'gateway', label: assumed('API gateway') },
        { id: 'resume', label: verify('Resume analysis', BRIEF) },
        { id: 'ats', label: verify('ATS scoring', BRIEF) },
        { id: 'interview', label: verify('AI-powered interview', BRIEF) },
        { id: 'workflow', label: verify('Workflow automation', BRIEF) },
        { id: 'accounts', label: assumed('Accounts') },
      ],
      edges: [
        ['frontend', 'gateway'],
        ['gateway', 'resume'],
        ['gateway', 'ats'],
        ['gateway', 'interview'],
        ['gateway', 'workflow'],
        ['gateway', 'accounts'],
      ],
    },
    stack: verify(['[STACK]']),
  },
};
