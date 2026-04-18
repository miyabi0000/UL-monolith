import dns from 'dns/promises';
import net from 'net';

/**
 * SSRF 対策: プライベート / 予約 IP 範囲を検出する。
 * 以下の範囲を拒否対象とする:
 *   IPv4: 0/8, 10/8, 127/8, 169.254/16 (link-local/AWS メタデータ),
 *         172.16/12, 192.168/16, 100.64/10 (CGNAT), 224/4 (multicast)
 *   IPv6: ::, ::1 (loopback), fc00::/7 (ULA), fe80::/10 (link-local),
 *         ::ffff:0:0/96 (IPv4 mapped) は内部 IPv4 として再判定
 */
const PRIVATE_IPV4_PATTERNS: Array<[number, number, number, number, number]> = [
  // [A, B, C, D, prefix]
  [0, 0, 0, 0, 8],
  [10, 0, 0, 0, 8],
  [100, 64, 0, 0, 10],
  [127, 0, 0, 0, 8],
  [169, 254, 0, 0, 16],
  [172, 16, 0, 0, 12],
  [192, 168, 0, 0, 16],
  [224, 0, 0, 0, 4],
];

function ipv4InCidr(ip: string, cidr: [number, number, number, number, number]): boolean {
  const [a, b, c, d] = ip.split('.').map(Number);
  if ([a, b, c, d].some(n => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [ca, cb, cc, cd, prefix] = cidr;
  const ipInt = (a << 24) | (b << 16) | (c << 8) | d;
  const cidrInt = (ca << 24) | (cb << 16) | (cc << 8) | cd;
  const mask = prefix === 0 ? 0 : (-1 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (cidrInt & mask);
}

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    return PRIVATE_IPV4_PATTERNS.some(cidr => ipv4InCidr(ip, cidr));
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fe8') || lower.startsWith('fe9') ||
        lower.startsWith('fea') || lower.startsWith('feb')) return true; // fe80::/10
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
    // IPv4-mapped IPv6: ::ffff:a.b.c.d
    const mappedMatch = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedMatch) return PRIVATE_IPV4_PATTERNS.some(c => ipv4InCidr(mappedMatch[1], c));
    return false;
  }
  return true; // IP でない文字列は安全側に倒して拒否
}

/**
 * 外部 URL が SSRF 的に安全か検証する。
 * - プロトコルは http/https のみ
 * - 解決された全 IP がパブリックであること
 *
 * DNS 再バインディング攻撃には完全対応していない（事前解決 IP と
 * 実際の接続時 IP が異なる可能性あり）。必要なら custom http.Agent
 * の lookup フックで接続時検証を追加する。
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed');
  }
  const hostname = url.hostname;
  if (!hostname) throw new Error('URL missing hostname');

  // ホスト名が IP リテラルの場合はその場で判定
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Private or reserved IP is not allowed');
    return url;
  }

  // localhost 等の特別な名前を早期拒否
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === 'metadata.google.internal') {
    throw new Error('Private hostname is not allowed');
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) throw new Error('Hostname did not resolve');
  for (const r of records) {
    if (isPrivateIp(r.address)) {
      throw new Error('Hostname resolves to a private or reserved IP');
    }
  }
  return url;
}
