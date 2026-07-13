/** A role that can be granted to an invited collaborator. */
export interface InviteRole {
  value: string;
  label: string;
}

/** The payload submitted when inviting collaborators to an item. */
export interface InviteCollaboratorsInput {
  itemId: string;
  recipients: string[];
  role: string;
  message?: string;
}

/** The transport's response to an invite submission. */
export interface InviteResult {
  invited: string[];
  failed?: { recipient: string; reason: string }[];
}

/**
 * The transport a host provides to actually deliver invitations. Narrow by
 * design: the workflow owns the form state and validation; the transport owns
 * delivery (an API call, a queue, a mock).
 */
export interface InviteCollaboratorsTransport {
  sendInvites(input: InviteCollaboratorsInput): Promise<InviteResult>;
}

export type InviteStatus = "idle" | "submitting" | "success" | "error";

/** The controller's observable state for the invite flow. */
export interface InviteCollaboratorsState {
  recipients: string[];
  role: string;
  message: string;
  status: InviteStatus;
  error: string | null;
  result: InviteResult | null;
}
