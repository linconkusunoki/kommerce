import { Hono } from "hono";
import { HomePage } from "../pages/home/HomePage.tsx";
import { loadHomePage } from "../pages/home/loadHomePage.ts";
import type { Services } from "../lib/container.ts";
import type { AppEnv } from "../types/context.ts";

export function createHome(services: Services) {
  const home = new Hono<AppEnv>();
  home.get("/", (c) => c.html(<HomePage data={loadHomePage(services, c.get("visitorId"))} />));
  return home;
}
