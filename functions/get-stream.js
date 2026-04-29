export async function onRequest() {
  try {
    // ambil halaman player asli
    const res = await fetch("https://player.787200.com/live/index.html", {
      headers: {
        "user-agent": "Mozilla/5.0"
      }
    })

    const html = await res.text()

    // 🔥 cari liveUrl di dalam HTML
    const match = html.match(/liveUrl=([^&"]+)/)

    if (!match) {
      return new Response("Stream not found", { status: 500 })
    }

    const encoded = match[1]
    const decoded = decodeURIComponent(encoded)

    return new Response(JSON.stringify({
      stream: decoded
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })

  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 })
  }
}
