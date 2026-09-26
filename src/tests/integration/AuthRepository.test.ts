import { beforeEach, describe, expect, test } from "bun:test";
import { PostgresAuthRepository } from "../../repositories/AuthRepository.ts";
import { createTestDb, postgresAvailable } from "./helpers.ts";
import type { SQL } from "bun";

const integrationDescribe = postgresAvailable ? describe : describe.skip;
let db: SQL;
let repo: PostgresAuthRepository;

beforeEach(async () => {
  db = await createTestDb();
  repo = new PostgresAuthRepository(db);
});

integrationDescribe("PostgresAuthRepository customer accounts", () => {
  test("creates and finds a customer by email", async () => {
    const id = await repo.createCustomer("jane@example.com", "hash", "Jane");

    expect(await repo.findCustomerByEmail("jane@example.com")).toMatchObject({
      id,
      email: "jane@example.com",
      password_hash: "hash",
      display_name: "Jane",
    });
  });

  test("creates, finds, and deletes customer sessions", async () => {
    const id = await repo.createCustomer("jane@example.com", "hash", "Jane");
    const session = await repo.createCustomerSession(id);

    expect(await repo.findCustomerSession(session.sessionId)).toMatchObject({ id, email: "jane@example.com" });
    await repo.deleteCustomerSession(session.sessionId);
    expect(await repo.findCustomerSession(session.sessionId)).toBeNull();
  });

  test("updates a customer display name", async () => {
    const id = await repo.createCustomer("jane@example.com", "hash", "Jane");
    await repo.updateCustomerDisplayName(id, "Janet");
    expect((await repo.findCustomerByEmail("jane@example.com"))?.display_name).toBe("Janet");
  });
});
