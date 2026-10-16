import { describe, expect, it } from "vitest";
import { canOpenPath, hasAccess, moduleForPath, type AccessMap } from "@/lib/permissions/model";
import { ROLE_SEED } from "@/lib/mock/seed/staff";
import { NAV, navItemVisible } from "@/lib/nav";

const role = (id: string) => ROLE_SEED.find((r) => r.id === id)!.access as AccessMap;

describe("hasAccess", () => {
  it("treats levels as ordered none < view < edit < full", () => {
    const sales = role("sales");
    expect(hasAccess(sales, "pipeline", "full")).toBe(true);
    expect(hasAccess(sales, "customers", "edit")).toBe(true);
    expect(hasAccess(sales, "customers", "full")).toBe(false);
    expect(hasAccess(sales, "settings", "view")).toBe(false);
  });
  it("denies everything without an access map", () => {
    expect(hasAccess(undefined, "customers")).toBe(false);
  });
});

describe("moduleForPath", () => {
  it("maps routes to the module that owns them", () => {
    expect(moduleForPath("/crm/customer-mgt/customers/23488")).toBe("customers");
    expect(moduleForPath("/crm/product-management/bundle-groups")).toBe("catalogue");
    expect(moduleForPath("/crm/growth/leads")).toBe("pipeline");
    expect(moduleForPath("/crm/growth/commission")).toBe("partners");
    expect(moduleForPath("/crm/marketing-channel")).toBe("marketing");
    expect(moduleForPath("/crm/settings/users")).toBe("settings");
  });
  it("leaves the dashboard and own profile open to everyone", () => {
    expect(moduleForPath("/")).toBeNull();
    expect(moduleForPath("/crm/settings/profile")).toBeNull();
  });
  it("does not match on a shared prefix only", () => {
    expect(moduleForPath("/crm/billingx")).toBeNull();
  });
});

describe("canOpenPath and navigation", () => {
  it("lets finance into billing but not the pipeline", () => {
    const finance = role("finance");
    expect(canOpenPath(finance, "/crm/billing/payments")).toBe(true);
    expect(canOpenPath(finance, "/crm/growth/leads")).toBe(false);
    expect(canOpenPath(finance, "/crm/settings/profile")).toBe(true);
  });

  it("hides whole nav groups the role can't open", () => {
    const finance = role("finance");
    const titles = NAV.flatMap((s) => s.groups).filter((g) => navItemVisible(g, (href) => canOpenPath(finance, href))).map((g) => g.title);
    expect(titles).toContain("Billing & Payments");
    expect(titles).not.toContain("Pipeline");
    expect(titles).not.toContain("Marketing");
  });

  it("shows every group to an admin", () => {
    const admin = role("admin");
    const groups = NAV.flatMap((s) => s.groups);
    expect(groups.every((g) => navItemVisible(g, (href) => canOpenPath(admin, href)))).toBe(true);
  });
});
