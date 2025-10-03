export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    let cfg = {
      mode: "paused",
      retry_after: 86400,
    };

    let status = 200;
    const headers = new Headers({
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/html; charset=utf-8"
    });
    if (cfg.mode === "maintenance") {
      status = 503; headers.set("Retry-After", String(cfg.retry_after || 3600));
    } else if (cfg.mode === "gone") {
      status = 410;
    } else {
      headers.set("X-Robots-Tag", "noindex, nofollow");
    }

    const base = "https://domain-parking.gjb.workers.dev";
    const templateUrl = `${base}/index.html`;
    const upstream = await fetch(templateUrl, { cf: { cacheEverything: true } });
    
    const rewriter = new HTMLRewriter()
      .on('meta[name="robots"]', { element(e){ if (cfg.mode === "paused") e.setAttribute("content", "noindex,nofollow"); }});

    return rewriter.transform(new Response(upstream.body, { status, headers }));
  }
}
