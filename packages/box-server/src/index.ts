/**
 * `@box-open-elements/box-server` — the server-side Box adapter.
 *
 * It keeps Box SDK/REST churn, auth, and impersonation below the boundary and
 * exposes stable pattern contracts (ContentExplorer / Share / Metadata data
 * sources) plus framework-neutral route handlers that speak the documented wire
 * JSON. The browser-facing core package never sees a Box DTO or a token.
 */

// HTTP + errors
export { BoxApiError, resolveFetch, type FetchLike } from "./http.js";

// Auth
export {
  createCcgTokenProvider,
  type BoxCcgConfig,
  type BoxTokenProvider,
} from "./auth/ccg.js";
export {
  createStaticTokenProvider,
  createRefreshingTokenProvider,
  type RefreshingTokenProviderConfig,
} from "./auth/oauth.js";
export { createJwtTokenProvider, type BoxJwtConfig } from "./auth/jwt.js";
export {
  createBoxRestClient,
  type BoxRestClient,
  type BoxRestClientConfig,
  type BoxRequestOptions,
} from "./auth/client.js";

// Data sources (implement the core pattern contracts)
export {
  createBoxExplorerDataSource,
  type BoxExplorerDataSourceOptions,
} from "./box/explorer-data-source.js";
export {
  createBoxShareDataSource,
  type BoxShareDataSourceOptions,
} from "./box/share-data-source.js";
export {
  createBoxMetadataDataSource,
  type BoxMetadataDataSourceOptions,
} from "./box/metadata-data-source.js";

// Mappers (raw Box DTO → stable contracts)
export * as explorerMappers from "./mappers/explorer.js";
export * as shareMappers from "./mappers/share.js";
export * as metadataMappers from "./mappers/metadata.js";

// Framework-neutral route handlers (Request → Response)
export {
  createContentExplorerRouteHandler,
  type ContentExplorerRouteOptions,
} from "./routes/content-explorer.js";
export { createShareRouteHandler, type ShareRouteOptions } from "./routes/share.js";
export { createMetadataRouteHandler, type MetadataRouteOptions } from "./routes/metadata.js";
export { type RouteHandler } from "./routes/shared.js";
