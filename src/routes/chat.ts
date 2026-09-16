import { Hono } from "hono";
import type { Chat, ChatMessage } from "../chatbot.ts";

export function createChatRoute(chat: Chat) {
  const chatRoute = new Hono();

chatRoute.post("/api/chat", async (c) => {
  const body = await c.req.json<{ messages: ChatMessage[] }>();

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return c.json({ error: "messages array is required" }, 400);
  }

  try {
    const reply = await chat(body.messages);
    return c.json({ reply });
  } catch (err) {
    console.error("[chat]", err);
    return c.json({ reply: "Sorry, I'm having trouble right now. Please try again in a moment." });
  }
  });

  return chatRoute;
}
