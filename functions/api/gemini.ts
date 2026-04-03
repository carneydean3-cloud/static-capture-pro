let cachedToken: { accessToken: string; expiresAtMs: number } | null = null;

function json(res: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(res, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers || {}) },
    status: init?.status ?? 200,
  });
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeJson(obj: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return base64UrlEncodeBytes(bytes);
}

function pemToDer(pem: string) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(env: any) {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) return cachedToken.accessToken;

  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!env.GOOGLE_CLOUD_PROJECT_ID) throw new Error("Missing GOOGLE_CLOUD_PROJECT_ID");
  if (!env.VERTEX_LOCATION) throw new Error("Missing VERTEX_LOCATION");

  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON) as {
    client_email: string;
    private_key: string;
  };

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const unsignedJwt = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt)
  );

  const assertion = `${unsignedJwt}.${base64UrlEncodeBytes(new Uint8Array(sigBuf))}`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const tokenJson = await tokenResp.json<any>();
  if (!tokenResp.ok) throw new Error(`Token error ${tokenResp.status}: ${JSON.stringify(tokenJson)}`);

  const accessToken = tokenJson.access_token as string;
  const expiresIn = (tokenJson.expires_in as number) ?? 3600;

  cachedToken = { accessToken, expiresAtMs: now + expiresIn * 1000 };
  return accessToken;
}

export const onRequestGet = async () => {
  return json({ ok: true, message: "POST JSON to /api/gemini with { prompt: '...' }" });
};

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;

    const body = await request.json().catch(() => ({}));
    const prompt = (body.prompt || "").toString().trim();
    if (!prompt) return json({ error: "Missing prompt" }, { status: 400 });

    const model = ((body.model || "gemini-2.0-flash-lite") as string).trim();
    const temperature = typeof body.temperature === "number" ? body.temperature : 0.4;
    const maxOutputTokens = typeof body.maxOutputTokens === "number" ? body.maxOutputTokens : 2048;

    const accessToken = await getGoogleAccessToken(env);

    const vertexUrl =
      `https://${env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/` +
      `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/locations/${env.VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;

    const payload: any = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens },
    };

    if (body.system && String(body.system).trim()) {
      payload.systemInstruction = { parts: [{ text: String(body.system).trim() }] };
    }

    const resp = await fetch(vertexUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json<any>();
    if (!resp.ok) {
      return json({ error: "Vertex request failed", status: resp.status, details: data }, { status: 500 });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ?? "";

    return json({ text, raw: data });
  } catch (err: any) {
    return json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
};
