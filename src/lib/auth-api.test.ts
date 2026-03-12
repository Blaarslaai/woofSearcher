import { getSession, login, logout, type Session } from "./auth-api";

describe("auth-api", () => {
  beforeEach(() => {
    document.cookie = "auth_session=; Path=/; Max-Age=0";
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    jest.restoreAllMocks();
  });

  it("stores session in cookie after login", async () => {
    const fakeSession: Session = {
      id: "1",
      username: "kminchelle",
      email: "kminchelle@x.dummyjson.com",
      firstName: "Jeanne",
      lastName: "Halvorson",
      gender: "female",
      image: "https://example.com/dog.png",
      accessToken: "token-123",
      refreshToken: "refresh-123",
    };

    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => fakeSession,
    } as Response);

    const result = await login({ username: "kminchelle", password: "0lelplR" });

    expect(result).toEqual(fakeSession);
    expect(document.cookie).toContain("auth_session=");
  });

  it("returns null when session cookie is missing", async () => {
    await logout();
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("clears session on logout", async () => {
    const fakeSession: Session = {
      id: "1",
      username: "kminchelle",
      email: "kminchelle@x.dummyjson.com",
      firstName: "Jeanne",
      lastName: "Halvorson",
      gender: "female",
      image: "https://example.com/dog.png",
      accessToken: "token-123",
    };

    document.cookie = `auth_session=${encodeURIComponent(JSON.stringify(fakeSession))}; Path=/`;

    expect(await getSession()).not.toBeNull();
    await logout();
    expect(await getSession()).toBeNull();
  });
});
