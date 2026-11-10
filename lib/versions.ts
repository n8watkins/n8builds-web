import nextPkg from 'next/package.json'
import reactPkg from 'react/package.json'
import typescriptPkg from 'typescript/package.json'
import tailwindPkg from 'tailwindcss/package.json'
import sanityPkg from '@sanity/client/package.json'
import sentryPkg from '@sentry/nextjs/package.json'
import playwrightPkg from '@playwright/test/package.json'
import vitestPkg from 'vitest/package.json'
import rootPkg from '@/package.json'

/**
 * The versions this site is built with, read from the installed packages when
 * it is built, so the n8builds.dev case study (/builds/n8builds) never states
 * one that is out of date (owner, round 12 of 2026-11-09). OpenNext's package
 * doesn't export its package.json, so its version comes from ours (pinned exactly).
 */
const minor = (version: string) => version.replace(/^[^\d]*/, '').split('.').slice(0, 2).join('.')

export const VERSIONS = {
  next: minor(nextPkg.version),
  react: minor(reactPkg.version),
  typescript: minor(typescriptPkg.version),
  tailwind: minor(tailwindPkg.version),
  sanity: minor(sanityPkg.version),
  sentry: minor(sentryPkg.version),
  playwright: minor(playwrightPkg.version),
  vitest: minor(vitestPkg.version),
  opennext: minor(rootPkg.dependencies['@opennextjs/cloudflare']),
} as const
