import type { AdminUser } from "./index.ts";

export type AppVariables = {
  visitorId: string;
  adminUser: AdminUser;
};

export type AppEnv = { Variables: AppVariables };
