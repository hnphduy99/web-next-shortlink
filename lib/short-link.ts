export function normalizeShortCode(value: string | undefined) {
  return value?.trim().replace(/^\/+|\/+$/g, "") ?? "";
}

export function normalizeOriginalUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  return new URL(withProtocol).toString();
}
