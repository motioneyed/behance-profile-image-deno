import { serve } from "https://deno.land/std/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts"

serve(async (req: Request) => {
  const url = new URL(req.url)
  const pathParts = url.pathname.split("/").filter(Boolean)

  if (pathParts[0] !== "behance-profile-image" || !pathParts[1]) {
    return new Response(JSON.stringify({ error: "Invalid request. Use /behance-profile-image/:username" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const username = pathParts[1]

  try {
    const response = await fetch(`https://www.behance.net/${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    })

    const html = await response.text()

    const doc = new DOMParser().parseFromString(html, "text/html")
    if (!doc) throw new Error("Failed to parse HTML")

    const script = doc.querySelector('script[id="__NEXT_DATA__"]')
    if (!script) {
      return new Response(JSON.stringify({ error: "Behance data script not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const jsonText = script.textContent || ""
    const data = JSON.parse(jsonText)

    const user = data.props?.pageProps?.profile
    const imgUrl = user?.image?.["276"] || user?.image?.["138"] || user?.image?.["100"] || user?.image?.["50"] || ""

    if (!imgUrl) {
      return new Response(JSON.stringify({ error: "Profile image not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ imageUrl: imgUrl }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Failed to fetch or parse Behance profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
