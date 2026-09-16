import { describe, expect, mock, test } from "bun:test";
import { AuthService } from "../../services/AuthService.ts";
import type { IAuthRepository } from "../../repositories/interfaces.ts";

function mockAuthRepo(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    findUserByUsername: mock(() => null),
    createSession: mock(() => ({ sessionId: "admin-session", expiresAt: "" })),
    findSession: mock(() => null),
    deleteSession: mock(() => {}),
    findCustomerByEmail: mock(() => null),
    createCustomer: mock(() => 1),
    createCustomerSession: mock(() => ({ sessionId: "customer-session", expiresAt: "" })),
    findCustomerSession: mock(() => null),
    updateCustomerDisplayName: mock(() => {}),
    deleteCustomerSession: mock(() => {}),
    ...overrides,
  };
}

describe("AuthService.registerCustomer", () => {
  test("normalizes and creates a customer session", async () => {
    const createCustomer = mock(() => 7);
    const createSession = mock(() => ({ sessionId: "session-7", expiresAt: "" }));
    const service = new AuthService(mockAuthRepo({ createCustomer, createCustomerSession: createSession }));

    const sessionId = await service.registerCustomer(" TEST@Example.COM ", "password123", " Jane ");

    expect(sessionId).toBe("session-7");
    expect(createCustomer).toHaveBeenCalledWith("test@example.com", expect.any(String), "Jane");
    expect(createSession).toHaveBeenCalledWith(7);
  });

  test("rejects duplicate or invalid account details", async () => {
    const existing = { id: 1, email: "test@example.com", password_hash: "hash", display_name: "Jane" };
    const repo = mockAuthRepo({ findCustomerByEmail: mock(() => existing) });
    const service = new AuthService(repo);

    expect(await service.registerCustomer("test@example.com", "password123", "Jane")).toBeNull();
    expect(await service.registerCustomer("not-an-email", "short", "")).toBeNull();
  });
});

describe("AuthService customer sessions", () => {
  test("verifies credentials and creates a session", async () => {
    const customer = { id: 4, email: "test@example.com", password_hash: await Bun.password.hash("password123"), display_name: "Jane" };
    const createSession = mock(() => ({ sessionId: "session-4", expiresAt: "" }));
    const service = new AuthService(mockAuthRepo({ findCustomerByEmail: mock(() => customer), createCustomerSession: createSession }));

    expect(await service.loginCustomer("TEST@example.com", "password123")).toBe("session-4");
    expect(await service.loginCustomer("test@example.com", "wrong-password")).toBeNull();
    expect(createSession).toHaveBeenCalledWith(4);
  });

  test("validates display-name updates", () => {
    const update = mock(() => {});
    const service = new AuthService(mockAuthRepo({ updateCustomerDisplayName: update }));

    expect(service.updateCustomerDisplayName(3, "  Alex  ")).toBe(true);
    expect(update).toHaveBeenCalledWith(3, "Alex");
    expect(service.updateCustomerDisplayName(3, " ")).toBe(false);
    expect(service.updateCustomerDisplayName(3, "x".repeat(81))).toBe(false);
  });
});
