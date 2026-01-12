/**
 * RFC 7807 Problem Details interface
 * https://tools.ietf.org/html/rfc7807
 */
export interface ProblemDetails {
  /**
   * A URI reference that identifies the problem type
   */
  type: string;

  /**
   * A short, human-readable summary of the problem type
   */
  title: string;

  /**
   * The HTTP status code
   */
  status: number;

  /**
   * A human-readable explanation specific to this occurrence
   */
  detail: string;

  /**
   * A URI reference that identifies the specific occurrence
   */
  instance?: string;

  /**
   * Timestamp of when the error occurred
   */
  timestamp: string;

  /**
   * Request trace ID for debugging
   */
  traceId?: string;

  /**
   * Additional extension members
   */
  extensions?: Record<string, unknown>;
}
