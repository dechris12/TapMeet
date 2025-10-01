// api/gasProxy.js
export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow all origins (change to your domain for prod)
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Respond to preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Replace with your Apps Script URL or use an env var
  const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/AKfycbyyjDVX41n36he5-KZ0Yude8NYLVllZGb0MOJ0eDDOdxQlLdesE7UjjeMG1Vw85i0zl/exec";

  try {
    // Forward the request to Google Apps Script
    const googleRes = await fetch(GAS_URL, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        // forward auth header if present
        ...(req.headers.authorization ? { "Authorization": req.headers.authorization } : {})
      },
      // safe stringify the body (Vercel parses req.body for you)
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    // Get response text (could be JSON)
    const text = await googleRes.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (err) {
      // not JSON — send raw text
      return res.status(200).send(text);
    }

    // Return proxied response
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ success: false, message: "Proxy error: " + err.message });
  }
}
