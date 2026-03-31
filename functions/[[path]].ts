export async function onRequest(context: any) {
  const url = new URL(context.request.url);

  // Allow real static assets through (.js, .css, .png, etc.)
  if (url.pathname.includes(".")) {
    return context.next();
  }

  // Serve SPA index.html for all other routes
  return context.env.ASSETS.fetch(
    new Request(new URL("/index.html", url), context.request)
  );
}
