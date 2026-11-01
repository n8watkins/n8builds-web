import type { init } from '@sentry/nextjs'

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>['dataCollection']>

/**
 * What Sentry collects, spelled out for every runtime (browser, Node, edge).
 *
 * Sentry v11 replaced `sendDefaultPii` with `dataCollection`, and its defaults
 * depend on whether the option is set at all, so every category is set here:
 * the visitor's IP and user fields, cookies, headers and query parameters (as
 * with v10's `sendDefaultPii: true`, disclosed in the privacy policy), and no
 * HTTP bodies, stack frame locals, database query values, GraphQL data or AI
 * inputs and outputs unless a runtime asks for them.
 */
export function dataCollection(overrides: Partial<DataCollection> = {}): DataCollection {
  return {
    userInfo: true,
    cookies: true,
    httpHeaders: true,
    urlQueryParams: true,
    httpBodies: [],
    stackFrameVariables: false,
    databaseQueryData: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    ...overrides,
  }
}
