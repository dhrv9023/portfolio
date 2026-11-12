#!/usr/bin/env node
/**
 * Cross-platform release build (Windows, Linux, macOS): `VAR=value cmd` does not work in Windows shells,
 * so the release flag and site URL are set here instead of on the command line.
 *
 *   npm run build:release -- https://your-domain.example
 *
 * Fails while any claim or placeholder is unresolved (see scripts/check-verify.mjs).
 */
import { spawnSync } from 'node:child_process';

const siteUrl = process.argv[2] ?? process.env.SITE_URL;
const env = { ...process.env, SITE_RELEASE: '1', ...(siteUrl ? { SITE_URL: siteUrl } : {}) };
const result = spawnSync('npm run build', { stdio: 'inherit', shell: true, env });
process.exit(result.status ?? 1);
