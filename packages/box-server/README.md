# @box-open-elements/box-server

The server-side Box adapter for `box-open-elements`. It keeps Box SDK/REST
churn, auth, and impersonation **below** the boundary and exposes the stable
pattern contracts the browser-facing core consumes — so no Box DTO or access
token ever reaches a controller or component.

See [`docs/integration/box-server.md`](../../docs/integration/box-server.md) for
the architecture and [`docs/integration/wire-examples.md`](../../docs/integration/wire-examples.md)
for the JSON contracts.

## What's in the box

| Layer | Exports |
| --- | --- |
| **Auth** | `createCcgTokenProvider` (Client Credentials Grant), `createStaticTokenProvider` / `createRefreshingTokenProvider`, `createJwtTokenProvider` (stub), `createBoxRestClient` |
| **Data sources** | `createBoxExplorerDataSource`, `createBoxShareDataSource`, `createBoxMetadataDataSource` — implement the core `ContentExplorerDataSource` / `ShareDataSource` / `MetadataDataSource` contracts over Box REST |
| **Mappers** | `explorerMappers`, `shareMappers`, `metadataMappers` — pure raw-Box-DTO → contract functions |
| **Routes** | `createContentExplorerRouteHandler`, `createShareRouteHandler`, `createMetadataRouteHandler` — framework-neutral `(Request) => Promise<Response>` |

The package depends only on the platform `fetch` — no `box-node-sdk` — so it runs
on any Fetch-capable runtime (Bun, Deno, Node 18+, Workers, edge route handlers).

## Usage

```ts
import {
  createCcgTokenProvider,
  createBoxRestClient,
  createBoxExplorerDataSource,
  createContentExplorerRouteHandler,
} from "@box-open-elements/box-server";

const tokenProvider = createCcgTokenProvider({
  clientId: process.env.BOX_CLIENT_ID!,
  clientSecret: process.env.BOX_CLIENT_SECRET!,
  subjectType: "enterprise",
  subjectId: process.env.BOX_ENTERPRISE_ID!,
});

const client = createBoxRestClient({ tokenProvider });
const explorer = createBoxExplorerDataSource(client, { asUser: currentUserId });

// Mount the framework-neutral handler on any Fetch-based server:
const handler = createContentExplorerRouteHandler(explorer);
// Bun.serve({ fetch: handler }) / Deno.serve(handler) / Next route handler / …
```

The browser then drives a controller through the matching HTTP data source from
the core package (`createHttpContentExplorerDataSource` +
`createExplorerTransportFromDataSource`) pointed at these routes — no
browser-held token required.

## Auth

Prefer **CCG**. JWT is intentionally a stub (`createJwtTokenProvider` throws)
until a concrete deployment needs it, per the integration guide. Any async token
source can be adapted with `createRefreshingTokenProvider`.

## Status

Typechecked and tested as part of the repo's `bun run verify`. Not yet published
or built to `dist/` — it ships as source within the monorepo for now.
