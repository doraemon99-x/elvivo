export async function onRequest({ request }) {
  // 🔥 Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
        "Access-Control-Allow-Headers": "*",
      }
    })
  }

  const url = new URL(request.url)
  const target = url.searchParams.get("url")

  if (!target) {
    return new Response("No URL", { status: 400 })
  }

  // 🔥 Header spoof (WAJIB untuk vivo200)
  const headers = new Headers()
  headers.set("user-agent", "Mozilla/5.0")
  headers.set("referer", "https://player.787200.com/")
  headers.set("origin", "https://player.787200.com")
  headers.set("accept", "*/*")
  headers.set("accept-encoding", "identity")

  // support range (video chunk)
  const range = request.headers.get("range")
  if (range) headers.set("range", range)

  const res = await fetch(target, { headers })
  const contentType = res.headers.get("content-type") || ""

  // =====================================================
  // 🔥 HANDLE M3U8 (REWRITE PLAYLIST)
  // =====================================================
  if (contentType.includes("mpegurl") || target.includes(".m3u8")) {
    let text = await res.text()

    const base = target.substring(0, target.lastIndexOf("/") + 1)

    text = text.split("\n").map(line => {
      if (!line || line.startsWith("#")) return line

      // convert ke absolute URL
      let absolute = line.startsWith("http")
        ? line
        : base + line

      // 🔥 route ulang lewat proxy
      return `/functions/hls?url=${encodeURIComponent(absolute)}`
    }).join("\n")

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      }
    })
  }

  // =====================================================
  // 🔥 HANDLE SEGMENT (.ts / .aac / dll)
  // =====================================================
  const newHeaders = new Headers(res.headers)

  newHeaders.set("Access-Control-Allow-Origin", "*")
  newHeaders.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS")
  newHeaders.set("Access-Control-Allow-Headers", "*")

  return new Response(res.body, {
    status: res.status,
    headers: newHeaders
  })
}
