import { assumed, known, verify } from '../schema';
import { BRIEF, placeholderCaseText, placeholderFields } from './common';
import type { Project } from './types';

export const stockpred: Project = {
  id: 'stockpred',
  number: '02',
  title: known('StockPred', 'project name from brief'),
  world: 'The Forecast Room',
  summary: verify(
    'Stock price prediction with LSTM, GRU and Transformer models: time-series forecasting, data visualisation and backend/API integration.',
    BRIEF,
  ),
  ...placeholderFields(),
  caseStudy: {
    ...placeholderCaseText(),
    solution: verify('[SOLUTION — how it works, in your words]', BRIEF),
    architecture: {
      nodes: [
        { id: 'source', label: verify('[DATA SOURCE]') },
        { id: 'prep', label: assumed('Preprocessing') },
        { id: 'models', label: verify('LSTM · GRU · Transformer — compared or combined?', BRIEF) },
        { id: 'api', label: verify('Backend / API — framework?', BRIEF) },
        { id: 'viz', label: verify('Data visualisation — library?', BRIEF) },
      ],
      edges: [
        ['source', 'prep'],
        ['prep', 'models'],
        ['models', 'api'],
        ['api', 'viz'],
      ],
    },
    stack: verify(['LSTM', 'GRU', 'Transformer'], BRIEF),
  },
  disclosures: [
    known(
      'Illustrative series — not real market data and not model output.',
      'Stage 03 decision #5: illustrative data initially, clearly labelled',
    ),
    known('Not financial advice.', 'Stage 02 review board'),
  ],
};
