import type { AdminUser, Customer } from "./index.ts";

export type AppVariables = {
  visitorId: string;
  adminUser: AdminUser;
  customer: Customer;
};

export type AppEnv = { Variables: AppVariables };
