const FONT_EXTENSIONS = new Set(["ttf", "otf", "woff", "woff2"]);

const MIME_TYPES = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /api/fonts – list font files stored in R2
    if (url.pathname === "/api/fonts") {
      return handleListFonts(env);
    }

    // GET /fonts/<file> – serve a font file from R2
    if (url.pathname.startsWith("/fonts/")) {
      return handleGetFont(url.pathname, env);
    }

    // Everything else is served by the static assets (public/)
    return new Response(null, { status: 404 });
  },
};

async function handleListFonts(env) {
  try {
    const listed = await env.FONTS_BUCKET.list({ prefix: "fonts/" });

    const fonts = listed.objects
      .map((obj) => {
        const file = obj.key.replace(/^fonts\//, "");
        const ext = file.split(".").pop().toLowerCase();
        if (!FONT_EXTENSIONS.has(ext)) return null;
        return {
          file,
          name: file.replace(/\.[^.]+$/, ""),
          url: `/fonts/${file}`,
        };
      })
      .filter(Boolean);

    return Response.json(fonts);
  } catch (err) {
    return Response.json({ error: "Failed to list fonts" }, { status: 500 });
  }
}

async function handleGetFont(pathname, env) {
  // pathname is e.g. "/fonts/MyFont.woff2"
  // R2 key is "fonts/MyFont.woff2"
  const key = pathname.slice(1); // remove leading "/"
  const fileName = key.replace(/^fonts\//, "");
  const ext = fileName.split(".").pop().toLowerCase();

  if (!FONT_EXTENSIONS.has(ext)) {
    return new Response("Not Found", { status: 404 });
  }

  const object = await env.FONTS_BUCKET.get(key);

  if (!object) {
    return new Response("Font not found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
