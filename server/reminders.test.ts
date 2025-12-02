import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("reminders router", () => {
  it("should list reminders for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reminders.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a new reminder", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newReminder = {
      title: "Test Reminder",
      type: "termin" as const,
      dueDate: new Date("2025-12-31"),
      isAllDay: false,
    };

    const result = await caller.reminders.create(newReminder);

    expect(result).toBeDefined();
  });
});

describe("finance router", () => {
  it("should list finance entries for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.finance.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a new finance entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newEntry = {
      date: new Date(),
      type: "ausgabe" as const,
      category: "Test Category",
      amount: 5000, // 50.00 CHF in cents
      currency: "CHF",
      isRecurring: false,
    };

    const result = await caller.finance.create(newEntry);

    expect(result).toBeDefined();
  });
});

describe("taxes router", () => {
  it("should list tax profiles for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.taxes.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get tax profile by year", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.taxes.getByYear({ year: 2025 });

    // Result can be undefined if no profile exists for the year
    expect(result === undefined || typeof result === 'object').toBe(true);
  });
});
