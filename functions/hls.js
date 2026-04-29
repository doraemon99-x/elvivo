export async function onRequest({ request }) {
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

  const headers = new Headers()

  // 🔥 spoof header
  headers.set("user-agent", "Mozilla/5.0")
  headers.set("referer", "https://player.787200.com/")
  headers.set("origin", "https://player.787200.com")
  headers.set("accept", "*/*")
  headers.set("accept-encoding", "identity")

  const range = request.headers.get("range")
  if (range) headers.set("range", range)

  const res = await fetch(target, { headers })
  const contentType = res.headers.get("content-type") || ""

  // =========================
  // 🔥 HANDLE M3U8
  // =========================
  if (contentType.includes("mpegurl") || target.includes(".m3u8")) {
    let text = await res.text()

    const base = target.substring(0, target.lastIndexOf("/") + 1)

    text = text.split("\n").map(line => {
      if (!line || line.startsWith("#")) return line

      let absolute = line.startsWith("http")
        ? line
        : base + line

      return `/functions/hls?url=${encodeURIComponent(absolute)}`
    }).join("\n")

    return new Response(text, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      }
    })
  }

  // =========================
  // 🔥 HANDLE SEGMENT
  // =========================
  const newHeaders = new Headers(res.headers)

  newHeaders.set("Access-Control-Allow-Origin", "*")
  newHeaders.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS")
  newHeaders.set("Access-Control-Allow-Headers", "*")

  return new Response(res.body, {
    status: res.status,
    headers: newHeaders
  })
}
