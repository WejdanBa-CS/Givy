import type {
  Breadcrumb,
  ErrorEvent,
  TransactionEvent,
} from "@sentry/core";

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i;
const INVITE_PATH = /^\/invite\/[^/?#]+/i;
const URL_FIELDS = ["url", "from", "to"] as const;

/**
 * Invite codes are bearer-style beta credentials. Keep route names useful for
 * diagnosis, but remove both code values and query/hash data before telemetry.
 */
export function scrubSentryUrl(raw: string): string {
  try {
    const absolute = ABSOLUTE_URL.test(raw);
    const url = new URL(raw, "https://givy.invalid");
    url.pathname = url.pathname.replace(INVITE_PATH, "/invite/[code]");
    url.search = "";
    url.hash = "";
    return absolute ? url.toString() : url.pathname;
  } catch {
    return raw
      .replace(/(\/invite\/)[^/?#\s]+/i, "$1[code]")
      .replace(/[?#].*$/, "");
  }
}

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb.data) return breadcrumb;

  const data = { ...breadcrumb.data };
  for (const field of URL_FIELDS) {
    if (typeof data[field] === "string") {
      data[field] = scrubSentryUrl(data[field]);
    }
  }
  return { ...breadcrumb, data };
}

/**
 * Sentry always collects request URLs. This final event filter protects invite
 * links and removes request payload/query data across browser, Node, and edge
 * runtimes without disabling useful error diagnostics.
 */
export function scrubSentryEvent<T extends ErrorEvent | TransactionEvent>(
  event: T,
): T {
  const next = { ...event } as T;

  if (event.request) {
    const request = { ...event.request };
    delete request.data;
    const headers = { ...(request.headers ?? {}) };
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === "referer") delete headers[key];
    }

    next.request = {
      ...request,
      ...(event.request.url
        ? { url: scrubSentryUrl(event.request.url) }
        : {}),
      headers,
    };
  }

  if (event.breadcrumbs) {
    next.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  }

  if (typeof event.transaction === "string") {
    next.transaction = scrubSentryUrl(event.transaction);
  }

  return next;
}
