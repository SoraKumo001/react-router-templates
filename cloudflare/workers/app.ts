import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const app = new Hono<{ Bindings: Env }>();
app.use(contextStorage());
app.use(async (c) => {
  // @ts-ignore
  const requestHandler = createRequestHandler(
    // @ts-ignore
    () => import("../build/server/index.js"),
    import.meta.env?.MODE
  );
  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
