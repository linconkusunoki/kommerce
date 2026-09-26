import { describe, expect, mock, test } from "bun:test";
import { AdminAuthService } from "../../services/AdminAuthService.ts";
import { CustomerAuthService } from "../../services/CustomerAuthService.ts";
import type { IAdminAuthRepository, ICustomerAuthRepository } from "../../repositories/interfaces.ts";

function mockAdminAuthRepo(overrides: Partial<IAdminAuthRepository> = {}): IAdminAuthRepository {
  return {
    findUserByUsername: mock(async () => null),
    createSession: mock(async () => ({ sessionId: "admin-session", expiresAt: "" })),
    findSession: mock(async () => null),
    deleteSession: mock(async () => {}),
    ...overrides,
  };
}

function mockCustomerAuthRepo(overrides: Partial<ICustomerAuthRepository> = {}): ICustomerAuthRepository {
  return {
    findCustomerByEmail: mock(async () => null),
    createCustomer: mock(async () => 1),
    createCustomerSession: mock(async () => ({ sessionId: "customer-session", expiresAt: "" })),
    findCustomerSession: mock(async () => null),
    updateCustomerDisplayName: mock(async () => {}),
    deleteCustomerSession: mock(async () => {}),
    ...overrides,
  };
}

describe("CustomerAuthService.register", () => {
  test("normalizes and creates a customer session", async () => {
    const createCustomer = mock(async () => 7);
    const createSession = mock(async () => ({ sessionId: "session-7", expiresAt: "" }));
    const service = new CustomerAuthService(
      mockCustomerAuthRepo({ createCustomer, createCustomerSession: createSession }),
    );

    const sessionId = await service.register(" TEST@Example.COM ", "password123", " Jane ");

    expect(sessionId).toBe("session-7");
    expect(createCustomer).toHaveBeenCalledWith("test@example.com", expect.any(String), "Jane");
    expect(createSession).toHaveBeenCalledWith(7);
  });

  test("rejects duplicate or invalid account details", async () => {
    const existing = { id: 1, email: "test@example.com", password_hash: "hash", display_name: "Jane" };
    const repo = mockCustomerAuthRepo({ findCustomerByEmail: mock(async () => existing) });
    const service = new CustomerAuthService(repo);

    expect(await service.register("test@example.com", "password123", "Jane")).toBeNull();
    expect(await service.register("not-an-email", "short", "")).toBeNull();
  });
});

describe("CustomerAuthService.login", () => {
  test("verifies credentials and creates a session", async () => {
    const customer = {
      id: 4,
      email: "test@example.com",
      password_hash: await Bun.password.hash("password123"),
      display_name: "Jane",
    };
    const createSession = mock(async () => ({ sessionId: "session-4", expiresAt: "" }));
    const service = new CustomerAuthService(
      mockCustomerAuthRepo({ findCustomerByEmail: mock(async () => customer), createCustomerSession: createSession }),
    );

    expect(await service.login("TEST@example.com", "password123")).toBe("session-4");
    expect(await service.login("test@example.com", "wrong-password")).toBeNull();
    expect(createSession).toHaveBeenCalledWith(4);
  });

  test("validates display-name updates", async () => {
    const update = mock(async () => {});
    const service = new CustomerAuthService(mockCustomerAuthRepo({ updateCustomerDisplayName: update }));

    expect(await service.updateDisplayName(3, "  Alex  ")).toBe(true);
    expect(update).toHaveBeenCalledWith(3, "Alex");
    expect(await service.updateDisplayName(3, " ")).toBe(false);
    expect(await service.updateDisplayName(3, "x".repeat(81))).toBe(false);
  });
});

describe("AdminAuthService", () => {
  test("verifies admin credentials and manages sessions", async () => {
    const admin = { id: 2, username: "admin", password_hash: await Bun.password.hash("password123") };
    const createSession = mock(async () => ({ sessionId: "admin-session", expiresAt: "" }));
    const service = new AdminAuthService(
      mockAdminAuthRepo({ findUserByUsername: mock(async () => admin), createSession }),
    );

    expect(await service.login("admin", "password123")).toBe("admin-session");
    expect(createSession).toHaveBeenCalledWith(2);
  });
});
