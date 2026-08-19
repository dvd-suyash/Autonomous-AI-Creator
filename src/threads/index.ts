export class ThreadsClient {
  private accessToken: string;
  private userId: string;

  constructor(config: { accessToken: string; userId: string }) {
    this.accessToken = config.accessToken;
    this.userId = config.userId;
  }

  async postThread(text: string): Promise<string | null> {
    try {
      // Step 1: Create a media container for the text
      const createUrl = `https://graph.threads.net/v1.0/${this.userId}/threads`;
      const createParams = new URLSearchParams({
        media_type: 'TEXT',
        text: text,
        access_token: this.accessToken
      });

      const createRes = await fetch(`${createUrl}?${createParams.toString()}`, { method: 'POST' });
      const createData = await createRes.json() as any;

      if (!createData.id) {
        console.error('Threads Create Container Error:', createData);
        return null;
      }

      const creationId = createData.id;

      // Step 2: Publish the container
      const publishUrl = `https://graph.threads.net/v1.0/${this.userId}/threads_publish`;
      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: this.accessToken
      });

      const publishRes = await fetch(`${publishUrl}?${publishParams.toString()}`, { method: 'POST' });
      const publishData = await publishRes.json() as any;

      if (!publishData.id) {
        console.error('Threads Publish Error:', publishData);
        return null;
      }

      return publishData.id;
    } catch (err) {
      console.error('Failed to post to Threads:', err);
      return null;
    }
  }
}
