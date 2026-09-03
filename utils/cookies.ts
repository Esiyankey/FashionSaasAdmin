export function setClientCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function deleteClientCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function hasClientCookie(name: string): boolean {
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${name}=`));
}
