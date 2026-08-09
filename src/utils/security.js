// Security Utility for SSRF Protection and Sanitization
/**
 * Validates a URL to ensure it is not pointing to a local or private IP address.
 * This is a critical protection against Server-Side Request Forgery (SSRF).
 */
export function isSafeUrl(urlString) {
    try {
        const url = new URL(urlString);
        // Only allow HTTP/HTTPS
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return false;
        }
        const hostname = url.hostname;
        // Reject localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
            return false;
        }
        // Basic heuristic to block internal IPv4 ranges (10.x.x.x, 172.16.x.x to 172.31.x.x, 192.168.x.x)
        // Note: In a production worker, we'd want a more robust IP parser or DNS resolution check,
        // but Cloudflare Workers environments don't expose low-level DNS resolve naturally without fetch overhead.
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = hostname.match(ipv4Regex);
        if (match) {
            const p1 = parseInt(match[1], 10);
            const p2 = parseInt(match[2], 10);
            if (p1 === 10 || // 10.0.0.0/8
                (p1 === 172 && p2 >= 16 && p2 <= 31) || // 172.16.0.0/12
                (p1 === 192 && p2 === 168) // 192.168.0.0/16
            ) {
                return false;
            }
        }
        // Block metadata endpoints (169.254.169.254)
        if (hostname === '169.254.169.254') {
            return false;
        }
        return true;
    }
    catch (e) {
        // If URL parsing fails, it's unsafe
        return false;
    }
}
/**
 * Strips dangerous HTML tags and scripts from content before passing it to the LLM.
 * This helps mitigate Prompt Injection and XSS if the content were displayed.
 */
export function sanitizeContent(content) {
    // Strip <script> tags completely including content
    let safeContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip style tags
    safeContent = safeContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // Strip all other HTML tags
    safeContent = safeContent.replace(/<\/?[^>]+(>|$)/g, '');
    // Basic trim and normalize spaces
    safeContent = safeContent.replace(/\s+/g, ' ').trim();
    // Truncate to reasonable length to prevent massive token burns (e.g., 20k chars)
    return safeContent.substring(0, 20000);
}
