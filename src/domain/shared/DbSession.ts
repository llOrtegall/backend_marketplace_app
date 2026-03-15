/**
 * Opaque type for a database transaction session.
 * Infrastructure layers cast this to their specific session type (e.g. Mongoose ClientSession).
 */
export type DbSession = unknown;
