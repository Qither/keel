// Exit statuses are a convention of the product, not a rule.
// Source: design 4 (exit statuses); OWNER 2026-10-08.
export const EXIT = {
  DONE: 0,
  CHECK_FAILED: 1,
  USAGE: 2,
  REFUSED: 3,
  WAITING: 4,
  AUTHORITY: 5,
} as const;

export class KeelError extends Error {
  constructor(
    public readonly exit: number,
    message: string,
    public readonly source?: string,
    public readonly detail?: unknown,
  ) {
    super(message);
  }
}

export class UsageError extends KeelError {
  constructor(message: string) {
    super(EXIT.USAGE, message);
  }
}

/** A check or acceptance failed. */
export class CheckFailed extends KeelError {
  constructor(message: string, source: string, detail?: unknown) {
    super(EXIT.CHECK_FAILED, message, source, detail);
  }
}

/** Refused by a rule; the message names the rule's source tag. */
export class Refused extends KeelError {
  constructor(message: string, source: string, detail?: unknown) {
    super(EXIT.REFUSED, message, source, detail);
  }
}

/** Waiting on a human decision. */
export class Waiting extends KeelError {
  constructor(message: string, source: string, detail?: unknown) {
    super(EXIT.WAITING, message, source, detail);
  }
}

/** An authoritative record is missing or inconsistent. */
export class AuthorityError extends KeelError {
  constructor(message: string, source: string, detail?: unknown) {
    super(EXIT.AUTHORITY, message, source, detail);
  }
}
