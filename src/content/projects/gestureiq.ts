import { assumed, known, verify } from '../schema';
import { BRIEF, placeholderCaseText, placeholderFields } from './common';
import type { Project } from './types';

export const gestureiq: Project = {
  id: 'gestureiq',
  number: '01',
  title: known('GestureIQ', 'project name from brief'),
  world: 'The Vision Lab',
  summary: verify('Gesture-based presentation control using computer vision, in real time.', BRIEF),
  ...placeholderFields(),
  caseStudy: {
    ...placeholderCaseText(),
    solution: verify('[SOLUTION — how it works, in your words]', BRIEF),
    architecture: {
      nodes: [
        { id: 'input', label: assumed('Camera input', 'inferred from "computer vision"') },
        { id: 'mediapipe', label: verify('MediaPipe — which model?', BRIEF) },
        { id: 'recognition', label: assumed('Gesture recognition') },
        { id: 'mapping', label: assumed('Command mapping') },
        { id: 'control', label: assumed('Presentation control') },
        { id: 'flask', label: verify('Flask service — place in pipeline?', BRIEF) },
      ],
      edges: [
        ['input', 'mediapipe'],
        ['mediapipe', 'recognition'],
        ['recognition', 'mapping'],
        ['mapping', 'control'],
      ],
    },
    stack: verify(['MediaPipe', 'Flask'], BRIEF),
  },
};
