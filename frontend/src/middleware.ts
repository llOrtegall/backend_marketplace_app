import { getSession } from "auth-astro/server";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const isProtectedRoute = context.url.pathname === "/dashboard";

  if (!isProtectedRoute) {
    return next();
  }

  const isAuthed = await getSession(context.request);

  if (!isAuthed) {
    return context.redirect("/");
  }

  return next();
});