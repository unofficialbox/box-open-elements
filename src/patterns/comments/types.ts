/**
 * The comment model.
 *
 * Kept separate from the component so the data contract does not depend on the
 * class: a host that only transports comments — a controller, an adapter, a
 * server route — imports these without pulling a custom element in with them.
 */

/** A button offered beneath the thread, e.g. "Resolve" or "Delete". */
export type CommentAction = {
  id: string;
  label: string;
  tone?: string;
};

/**
 * One comment.
 *
 * `badge` is the generic pill beside the author — whatever short qualifier the
 * surface wants to show. `box-annotation-thread` maps its own `toolLabel` onto
 * it, which is why the base model does not name it after annotation tools.
 */
export type CommentEntry = {
  author: string;
  badge?: string;
  body: string;
  createdAt?: string;
  id: string;
  initials?: string;
  status?: string;
};

/**
 * A composed comment, before it has an id.
 *
 * `inReplyToId` carries the selected entry, so the same event serves both a new
 * top-level comment and a reply — the host decides which by reading it.
 */
export type CommentSubmittedDetail = {
  body: string;
  inReplyToId: string | null;
};
