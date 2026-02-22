const FONT_EXTENSIONS = new Set(["ttf", "otf", "woff", "woff2"]);

const FONTS_DOMAIN = "https://fonts.popopop.top";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /api/fonts – list font files stored in R2
    if (url.pathname === "/api/fonts") {
      return handleListFonts(env);
    }

    // Everything else is served by the static assets (public/)
    return new Response(null, { status: 404 });
  },
};

async function handleListFonts(env) {
  try {
    const listed = await env.FONTS_BUCKET.list();

    const fonts = listed.objects
      .map((obj) => {
        const file = obj.key;
        const ext = file.split(".").pop().toLowerCase();
        if (!FONT_EXTENSIONS.has(ext)) return null;
        return {
          file,
          name: file.replace(/\.[^.]+$/, ""),
          url: `${FONTS_DOMAIN}/${encodeURIComponent(file)}`,
        };
      })
      .filter(Boolean);

    return Response.json(fonts);
  } catch (err) {
    console.error("Error listing fonts from R2:", err);
    return Response.json({ error: "Failed to list fonts" }, { status: 500 });
  }
}
