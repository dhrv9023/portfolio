import { verify } from '../schema';

/** Brief content is pre-filled but stays VERIFY until Dhruv confirms it (Stage 03 instruction). */
export const BRIEF = 'project brief 2026-11-10 — unconfirmed';

export const placeholderFields = () => ({
  role: verify('[ROLE]'),
  team: verify('[SOLO / TEAM]'),
  period: verify('[PERIOD]'),
  status: verify('[STATUS]'),
  links: {
    github: verify('[GITHUB LINK]'),
    live: verify('[LIVE LINK]'),
    video: verify('[DEMO VIDEO]'),
  },
});

export const placeholderCaseText = () => ({
  problem: verify('[PROBLEM — who had it, what they did before, why it was not good enough]'),
  contribution: verify('[MY CONTRIBUTION — what I built vs. teammates or libraries]'),
  challenges: verify('[TECHNICAL CHALLENGES — challenge → approach → outcome]'),
  results: verify('[RESULTS & EVIDENCE — each claim with its method and source, or "Not measured"]'),
});
