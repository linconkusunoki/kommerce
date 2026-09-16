import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { SqliteAuthRepository } from "../../repositories/AuthRepository.ts";
import { createTestDb } from "./helpers.ts";

let db: Database;
let repo: SqliteAuthRepository;

beforeEach(() => {
  db = createTestDb();
  repo = new SqliteAuthRepository(db);
});

describe("SqliteAuthRepository customer accounts", () => {
  test("creates and finds a customer by email", () => {
    const id = repo.createCustomer("jane@example.com", "hash", "Jane");

    expect(repo.findCustomerByEmail("jane@example.com")).toMatchObject({
      id,
      email: "jane@example.com",
      password_hash: "hash",
      display_name: "Jane",
    });
  });

  test("creates, finds, and deletes customer sessions", () => {
    const id = repo.createCustomer("jane@example.com", "hash", "Jane");
    const session = repo.createCustomerSession(id);

    expect(repo.findCustomerSession(session.sessionId)).toMatchObject({ id, email: "jane@example.com" });
    repo.deleteCustomerSession(session.sessionId);
    expect(repo.findCustomerSession(session.sessionId)).toBeNull();
  });

  test("updates a customer display name", () => {
    const id = repo.createCustomer("jane@example.com", "hash", "Jane");
    repo.updateCustomerDisplayName(id, "Janet");
    expect(repo.findCustomerByEmail("jane@example.com")?.display_name).toBe("Janet");
  });
});
