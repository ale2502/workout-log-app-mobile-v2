// The only file that knows where the API lives and how to talk to it.
// Resource files (gyms.ts, sets.ts, ...) describe endpoints; this does the HTTP.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Thrown for any non-2xx response, so callers can tell "the server said no"
// (with its status) apart from a network failure (fetch throws a TypeError).
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  // Any JSON-serialisable value; it is sent as a JSON body.
  body?: unknown;
};

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const init: RequestInit = {};

  if (options.method !== undefined) {
    init.method = options.method;
  }

  // Only requests with a body send the JSON header, as the screens did.
  if (options.body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  // DELETE routes answer 204 No Content: there is no JSON to parse.
  const text = await response.text();
  return (text === '' ? undefined : JSON.parse(text)) as T;
}

// 400/404/409 send { error: 'message' } as JSON, but 500s send plain text,
// so only trust the body when it has the shape we expect.
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
}
