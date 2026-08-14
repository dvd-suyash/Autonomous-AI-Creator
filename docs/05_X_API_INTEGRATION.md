# X.com (Twitter) API Integration

## Overview

The agent posts directly to X.com using the X API v2. The free tier provides 1,500 tweets per month, which is more than sufficient for our 6 tweets/week cadence (~26/month for single tweets, up to ~100/month if every post is a thread).

## Setup Requirements

### Step 1: Create a Developer Account
1. Go to https://developer.x.com/
2. Sign up for a developer account (use the X account you want to post from)
3. Create a new Project and App
4. Select "Free" access tier

### Step 2: Generate Authentication Keys
You need 4 keys from the developer portal:

| Key | Where to Find | Purpose |
|---|---|---|
| `API_KEY` | App Settings → Keys and Tokens | Identifies your app |
| `API_SECRET` | App Settings → Keys and Tokens | App authentication |
| `ACCESS_TOKEN` | App Settings → Keys and Tokens → Generate | User-level access |
| `ACCESS_TOKEN_SECRET` | App Settings → Keys and Tokens → Generate | User-level authentication |

**IMPORTANT**: Set the App permissions to **Read and Write** before generating the access tokens. If you generate tokens first and then change permissions, you must regenerate the tokens.

### Step 3: Store as Cloudflare Worker Secrets
```bash
npx wrangler secret put X_API_KEY
npx wrangler secret put X_API_SECRET
npx wrangler secret put X_ACCESS_TOKEN
npx wrangler secret put X_ACCESS_TOKEN_SECRET
```

## API Endpoints Used

### Post a Tweet
```
POST https://api.x.com/2/tweets
Content-Type: application/json
Authorization: OAuth 1.0a

{
  "text": "Your tweet content here"
}
```

### Post a Thread (Reply Chain)
Post the first tweet, then reply to it:
```
POST https://api.x.com/2/tweets
{
  "text": "Second tweet in thread",
  "reply": {
    "in_reply_to_tweet_id": "<first_tweet_id>"
  }
}
```

### Self-Reply (Sparingly)
Same as thread reply, but to the last tweet in the chain. Only used 1-2 times per week.

## OAuth 1.0a Authentication

The X API v2 free tier requires OAuth 1.0a for user-context requests. This involves:

1. Generating a signature base string from the HTTP method, URL, and parameters
2. Signing it with HMAC-SHA1 using the consumer secret and token secret
3. Including the signature in the Authorization header

This must be implemented from scratch in the Worker since we can't use Node.js libraries. The implementation will:
- Generate a nonce and timestamp
- Build the parameter string (alphabetically sorted)
- Create the signature base string
- HMAC-SHA1 sign using the Web Crypto API (available in Workers)
- Construct the Authorization header

## Rate Limits (Free Tier)

| Endpoint | Limit | Our Usage |
|---|---|---|
| POST /2/tweets | 1,500/month | ~100/month (threads) |
| POST /2/tweets | 17 requests/15 min | Max ~8 per cycle (long thread) |

We are well within all limits.

## Error Handling

| Error | Action |
|---|---|
| 401 Unauthorized | Log error, skip posting, store content for retry next cycle |
| 403 Forbidden | Check app permissions, log error |
| 429 Too Many Requests | Log rate limit, content saved, will post on next cycle |
| 503 Service Unavailable | Retry once after 5s, then skip and save |

Critical rule: **Never lose content.** If posting fails, the generated content is stored in the `posts` table with `x_tweet_id = NULL` and retried on the next cycle.

## Content Formatting

### Character Limits
- Single tweet: 280 characters (English)
- Thread: Each tweet in thread ≤ 280 characters
- The content generation LLM is explicitly instructed about these limits

### Thread Splitting
For Format B (Deep Thread), the LLM generates content as a JSON array of strings, each ≤ 270 characters (10 char buffer for safety). The posting logic iterates through the array, posting each as a reply to the previous.
