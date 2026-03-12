export type LoginRequest = {
  username: string;
  password: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
};

export type Session = User & {
  accessToken: string;
  refreshToken?: string;
};

const SESSION_COOKIE_KEY = "auth_session";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCookie(name: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function removeCookie(name: string): void {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function login(data: LoginRequest): Promise<Session> {
  const res = await fetch("https://dummyjson.com/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Login failed");
  }

  const session = (await res.json()) as Session;
  setCookie(SESSION_COOKIE_KEY, JSON.stringify(session), SESSION_COOKIE_MAX_AGE_SECONDS);
  return session;
}

export async function getSession(): Promise<Session | null> {
  const raw = getCookie(SESSION_COOKIE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    removeCookie(SESSION_COOKIE_KEY);
    return null;
  }
}

export async function logout(): Promise<void> {
  removeCookie(SESSION_COOKIE_KEY);
}
