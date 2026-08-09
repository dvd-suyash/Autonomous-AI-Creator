// src/discovery/index.ts
import { isSafeUrl, sanitizeContent } from '../utils/security';
export async function discoverCandidates(db, agentId) {
    const stats = { totalScanned: 0, newInserted: 0, sourceBreakdown: {} };
    try {
        const candidatesToInsert = [];
        // Helper to fetch a reddit feed
        async function fetchReddit(subreddit, sort, limit, minScore, sourceType) {
            try {
                const url = sort === 'new'
                    ? `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`
                    : `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=day`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const posts = data?.data?.children || [];
                    for (const post of posts) {
                        const d = post.data;
                        if (d && d.url && d.title && d.score >= minScore) {
                            candidatesToInsert.push({ url: d.url, title: d.title, source_type: sourceType });
                        }
                    }
                }
            }
            catch (e) {
                console.error(`Reddit ${subreddit}/${sort} Error`, e);
            }
        }
        // 1. Hacker News - Top Stories
        try {
            const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            if (hnRes.ok) {
                const ids = (await hnRes.json()).slice(0, 3);
                for (const id of ids) {
                    const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    if (itemRes.ok) {
                        const item = await itemRes.json();
                        if (item && item.url && item.title && item.score >= 50) {
                            candidatesToInsert.push({ url: item.url, title: item.title, source_type: 'HN_TOP' });
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('HN Top Error', e);
        }
        // 2. Hacker News - New Stories (fresh content that rotates frequently)
        try {
            const hnNewRes = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
            if (hnNewRes.ok) {
                const ids = (await hnNewRes.json()).slice(0, 3);
                for (const id of ids) {
                    const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    if (itemRes.ok) {
                        const item = await itemRes.json();
                        if (item && item.url && item.title && item.score >= 3) {
                            candidatesToInsert.push({ url: item.url, title: item.title, source_type: 'HN_NEW' });
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('HN New Error', e);
        }
        // 3. Hacker News - Best Stories
        try {
            const hnBestRes = await fetch('https://hacker-news.firebaseio.com/v0/beststories.json');
            if (hnBestRes.ok) {
                const ids = (await hnBestRes.json()).slice(0, 3);
                for (const id of ids) {
                    const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    if (itemRes.ok) {
                        const item = await itemRes.json();
                        if (item && item.url && item.title && item.score >= 50) {
                            candidatesToInsert.push({ url: item.url, title: item.title, source_type: 'HN_BEST' });
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('HN Best Error', e);
        }
        // 4-9. Reddit - Multiple subreddits (top + new)
        await fetchReddit('technology', 'top', 10, 50, 'R_TECH_TOP');
        await fetchReddit('technology', 'new', 10, 3, 'R_TECH_NEW');
        await fetchReddit('programming', 'top', 10, 50, 'R_PROG_TOP');
        await fetchReddit('programming', 'new', 10, 3, 'R_PROG_NEW');
        await fetchReddit('artificial', 'top', 10, 20, 'R_AI_TOP');
        await fetchReddit('science', 'top', 10, 100, 'R_SCI_TOP');
        // 10. Dev.to
        try {
            const devRes = await fetch('https://dev.to/api/articles?top=1&per_page=10');
            if (devRes.ok) {
                const articles = await devRes.json();
                for (const article of articles) {
                    if (article && article.url && article.title && article.positive_reactions_count >= 20) {
                        candidatesToInsert.push({ url: article.url, title: article.title, source_type: 'DEV_TO' });
                    }
                }
            }
        }
        catch (e) {
            console.error('Dev.to Error', e);
        }
        // Track total scanned
        stats.totalScanned = candidatesToInsert.length;
        // Count per source
        for (const item of candidatesToInsert) {
            stats.sourceBreakdown[item.source_type] = (stats.sourceBreakdown[item.source_type] || 0) + 1;
        }
        // Process and insert filtered candidates
        // De-duplicate: skip URLs seen in the last 2 hours (allows frequent re-evaluation)
        for (const item of candidatesToInsert) {
            if (!isSafeUrl(item.url))
                continue;
            const existing = await db.prepare("SELECT id FROM sources WHERE agent_id = ? AND url = ? AND discovered_at > datetime('now', '-2 hours')").bind(agentId, item.url).first();
            if (existing)
                continue;
            const cleanTitle = sanitizeContent(item.title);
            const sourceId = crypto.randomUUID();
            const now = new Date().toISOString();
            await db.prepare("INSERT INTO sources (id, agent_id, url, source_type, title, status, discovered_at) VALUES (?, ?, ?, ?, ?, 'DISCOVERED', ?)").bind(sourceId, agentId, item.url, item.source_type, cleanTitle, now).run();
            const candidateId = crypto.randomUUID();
            await db.prepare("INSERT INTO candidates (id, agent_id, title, status, discovered_at) VALUES (?, ?, ?, 'PENDING', ?)").bind(candidateId, agentId, cleanTitle, now).run();
            await db.prepare("INSERT INTO candidate_sources (candidate_id, source_id, relationship) VALUES (?, ?, 'PRIMARY')").bind(candidateId, sourceId).run();
            stats.newInserted++;
        }
    }
    catch (error) {
        console.error('Discovery Error:', error);
    }
    return stats;
}
