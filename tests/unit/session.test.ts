// @vitest-environment node
import { describe, expect, it } from "vitest";
import { publicUser, signSession, verifySession, type Session } from "@/lib/auth/session";
import { safeNext } from "@/features/auth/hooks";
import { passwordProblem } from "@/lib/auth/password-rules";

const base: Session = {
  id: "u-1",
  name: "Adeola Adesina",
  email: "adeola.adesina@cicod.com",
  role: { id: "admin", name: "Admin" },
  access: { customers: "full", catalogue: "full", billing: "full", pipeline: "full", marketing: "full", partners: "full", settings: "full" },
  exp: Date.now() + 60_000,
  token: "backend-token",
};

describe("session cookie", () => {
  it("round-trips a signed session", async () => {
    const cookie = await signSession(base);
    expect(await verifySession(cookie)).toEqual(base);
  });

  it("rejects a tampered payload", async () => {
    const cookie = await signSession(base);
    const [, sig] = cookie.split(".");
    const forged = Buffer.from(JSON.stringify({ ...base, role: { id: "admin", name: "Admin" }, id: "u-99" })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects expired sessions and junk", async () => {
    expect(await verifySession(await signSession({ ...base, exp: Date.now() - 1 }))).toBeNull();
    expect(await verifySession("abc.def")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });

  it("never exposes the backend token in the public user", () => {
    expect(publicUser(base)).not.toHaveProperty("token");
    expect(publicUser(base)).not.toHaveProperty("exp");
  });
});

describe("post-login redirect", () => {
  it("only allows paths inside the app", () => {
    expect(safeNext("/crm/billing?x=1")).toBe("/crm/billing?x=1");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/login")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});

describe("password rules", () => {
  it("requires length, a letter and a number", () => {
    expect(passwordProblem("short1")).toMatch(/at least/);
    expect(passwordProblem("onlyletterslong")).toMatch(/letter and one number/);
    expect(passwordProblem("goodpassw0rd")).toBeNull();
  });
});
