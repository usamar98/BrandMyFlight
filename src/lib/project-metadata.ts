import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ProjectMetadata = {
  url: string;
  name: string;
  tagline: string;
  faviconUrl: string | null;
  brandColor: string;
};

const MAX_HTML_BYTES = 512_000;
const MAX_ICON_BYTES = 128_000;
const DEFAULT_BRAND_COLOR = "#c8ff25";

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

function normalizeHexColor(value: string) {
  const match = value.trim().toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;

  const raw = match[1];
  if (raw.length === 3) {
    return `#${raw.split("").map((character) => character.repeat(2)).join("")}`;
  }

  if (raw.length === 8 && raw.slice(6) === "00") return null;
  return `#${raw.slice(0, 6)}`;
}

function colorScore(color: string) {
  const red = Number.parseInt(color.slice(1, 3), 16) / 255;
  const green = Number.parseInt(color.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(color.slice(5, 7), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
  const brightness = (red + green + blue) / 3;
  const readableBrightness = 1 - Math.abs(brightness - 0.52);
  return saturation * 0.72 + readableBrightness * 0.28;
}

function findSvgBrandColor(svg: string) {
  const colors = svg.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
  const candidates = [...new Set(colors.map(normalizeHexColor).filter((color): color is string => Boolean(color)))]
    .filter((color) => {
      const red = Number.parseInt(color.slice(1, 3), 16);
      const green = Number.parseInt(color.slice(3, 5), 16);
      const blue = Number.parseInt(color.slice(5, 7), 16);
      const average = (red + green + blue) / 3;
      return average > 18 && average < 246;
    })
    .sort((left, right) => colorScore(right) - colorScore(left));

  return candidates[0] ?? null;
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

function findProjectName(html: string, titleTag: string, hostname: string) {
  const explicitName = findMeta(html, ["application-name", "og:site_name"]);
  if (explicitName) return explicitName;

  const marketingTitle = findMeta(html, ["og:title", "twitter:title"]) || decodeHtml(titleTag);
  const titleParts = marketingTitle
    .split(/\s+[|—–]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const brandSuffix = titleParts.at(-1);

  if (brandSuffix && titleParts.length > 1 && brandSuffix.length <= 45) return brandSuffix;
  return marketingTitle || hostname.replace(/^www\./, "");
}

async function readLimitedText(response: Response, maxBytes: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let html = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      break;
    }
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

async function fetchFaviconBrandColor(input: string) {
  let url = new URL(input);

  for (let redirect = 0; redirect < 3; redirect += 1) {
    await assertPublicUrl(url);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
      headers: {
        Accept: "image/svg+xml,image/*",
        "User-Agent": "BrandMyFlight-Metadata/1.0",
      },
      cache: "no-store",
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return null;
      url = new URL(location, url);
      continue;
    }

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("svg") && !url.pathname.toLowerCase().endsWith(".svg")) return null;
    return findSvgBrandColor(await readLimitedText(response, MAX_ICON_BYTES));
  }

  return null;
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

    const html = await readLimitedText(response, MAX_HTML_BYTES);
    const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
    const name = findProjectName(html, titleTag, url.hostname);
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

    const themeColor = normalizeHexColor(findMeta(html, ["theme-color"]));
    const faviconColor = faviconUrl
      ? await fetchFaviconBrandColor(faviconUrl).catch(() => null)
      : null;

    return {
      url: url.toString(),
      name: name.slice(0, 90),
      tagline: (tagline || `Discover ${name}.`).slice(0, 180),
      faviconUrl,
      brandColor: faviconColor ?? themeColor ?? DEFAULT_BRAND_COLOR,
    };
  }

  throw new Error("The website redirected too many times.");
}
