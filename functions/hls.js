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
  if (!target) return new Response("No URL", { status: 400 })

  const headers = new Headers()

  // 🔥 penting (harus sesuai request asli)
  headers.set("user-agent", "Mozilla/5.0")
  headers.set("referer", "https://player.787200.com/")
  headers.set("origin", "https://player.787200.com")
  headers.set("accept", "*/*")

  const range = request.headers.get("range")
  if (range) headers.set("range", range)

  const res = await fetch(target, { headers })

  const contentType = res.headers.get("content-type") || ""

  // 🔥 kalau m3u8 → rewrite isi
  if (contentType.includes("mpegurl")) {
    let text = await res.text()

    const base = target.substring(0, target.lastIndexOf("/") + 1)

    text = text.split("\n").map(line => {
      if (
        line.startsWith("#") ||
        line.trim() === ""
      ) return line

      // convert relative → absolute
      let absolute = line.startsWith("http")
        ? line
        : base + line

      // lewat proxy lagi
      return `/functions/hls?url=${encodeURIComponent(absolute)}`
    }).join("\n")

    return new Response(text, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }

  // 🔥 selain m3u8 (segment .ts dll)
  const newHeaders = new Headers(res.headers)
  newHeaders.set("Access-Control-Allow-Origin", "*")

  return new Response(res.body, {
    status: res.status,
    headers: newHeaders
  })
}
