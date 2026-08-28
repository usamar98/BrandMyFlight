import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ProjectMetadata = {
  url: string;
  name: string;
  tagline: string;
  faviconUrl: string | null;
};

const MAX_HTML_BYTES = 512_000;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;

  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }

  return false;
}

async function assertPublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Use a public http or https website.");
  if (url.username || url.password) throw new Error("Website credentials are not supported.");
  if (url.port && !['80', '443'].includes(url.port)) throw new Error("Only standard website ports are supported.");
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("Use a public website.");

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Use a public website.");
  }
}

function normalizeInput(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol);
}

function getAttribute(tag: string, attribute: string) {
  const quoted = new RegExp(`${attribute}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(tag)?.[2];
  if (quoted !== undefined) return quoted;
  return new RegExp(`${attribute}\\s*=\\s*([^\\s>]+)`, "i").exec(tag)?.[1] ?? null;
}

function findMeta(html: string, keys: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = (getAttribute(tag, "property") ?? getAttribute(tag, "name") ?? "").toLowerCase();
    if (keys.includes(key)) {
      const content = getAttribute(tag, "content");
      if (content) return decodeHtml(content);
    }
  }
  return "";
}

function findFavicon(html: string, baseUrl: URL) {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const link of links) {
    const rel = (getAttribute(link, "rel") ?? "").toLowerCase();
    if (rel.includes("icon")) {
      const href = getAttribute(link, "href");
      if (href) {
        try {
          return new URL(href, baseUrl).toString();
        } catch {
          continue;
        }
      }
    }
  }
  return new URL("/favicon.ico", baseUrl).toString();
}

async function readLimitedHtml(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let html = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_HTML_BYTES) {
      await reader.cancel();
      break;
    }
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

export async function fetchProjectMetadata(input: string): Promise<ProjectMetadata> {
  let url = normalizeInput(input);

  for (let redirect = 0; redirect < 4; redirect += 1) {
    await assertPublicUrl(url);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(7_000),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "BrandMyFlight-Metadata/1.0",
      },
      cache: "no-store",
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The website returned an invalid redirect.");
      url = new URL(location, url);
      continue;
    }

    if (!response.ok) throw new Error("We could not read that website.");
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("That URL is not a website page.");
    }

    const html = await readLimitedHtml(response);
    const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
    const name = findMeta(html, ["og:site_name", "og:title", "twitter:title"]) || decodeHtml(titleTag) || url.hostname.replace(/^www\./, "");
    const tagline = findMeta(html, ["og:description", "twitter:description", "description"]);

    const discoveredFavicon = findFavicon(html, url);
    let faviconUrl: string | null = null;
    try {
      const favicon = new URL(discoveredFavicon);
      await assertPublicUrl(favicon);
      faviconUrl = favicon.toString();
    } catch {
      faviconUrl = null;
    }

    return {
      url: url.toString(),
      name: name.slice(0, 90),
      tagline: (tagline || `Discover ${name}.`).slice(0, 180),
      faviconUrl,
    };
  }

  throw new Error("The website redirected too many times.");
}
