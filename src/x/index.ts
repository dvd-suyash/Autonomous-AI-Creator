export interface XConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export class XClient {
  private config: XConfig;

  constructor(config: XConfig) {
    this.config = config;
  }

  private percentEncode(str: string): string {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }

  private async generateOAuthSignature(method: string, url: string, params: Record<string, string>): Promise<string> {
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(k => `${this.percentEncode(k)}=${this.percentEncode(params[k])}`).join('&');
    
    const signatureBase = `${method.toUpperCase()}&${this.percentEncode(url)}&${this.percentEncode(paramString)}`;
    
    const signingKey = `${this.percentEncode(this.config.apiSecret)}&${this.percentEncode(this.config.accessTokenSecret)}`;
    
    // HMAC-SHA1 using Web Crypto
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(signatureBase)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  }

  private async getAuthorizationHeader(method: string, url: string): Promise<string> {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.config.apiKey,
      oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: this.config.accessToken,
      oauth_version: '1.0'
    };

    const signature = await this.generateOAuthSignature(method, url, oauthParams);
    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(k => `${this.percentEncode(k)}="${this.percentEncode(oauthParams[k])}"`)
      .join(', ');

    return authHeader;
  }

  async postTweet(text: string, replyToTweetId?: string): Promise<string | null> {
    const url = 'https://api.x.com/2/tweets';
    
    const body: any = { text };
    if (replyToTweetId) {
      body.reply = { in_reply_to_tweet_id: replyToTweetId };
    }

    const authHeader = await this.getAuthorizationHeader('POST', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('X API Error:', err);
      throw new Error(`X API Error: ${response.status} ${err}`);
    }

    const data: any = await response.json();
    return data?.data?.id || null;
  }

  async postThread(tweets: string[]): Promise<string[]> {
    const tweetIds: string[] = [];
    let lastTweetId: string | undefined = undefined;

    for (const text of tweets) {
      const id = await this.postTweet(text, lastTweetId);
      if (id) {
        tweetIds.push(id);
        lastTweetId = id;
      }
    }

    return tweetIds;
  }
}
