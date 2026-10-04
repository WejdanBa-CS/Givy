/**
 * Optional FCM push (legacy HTTP). If FCM_SERVER_KEY is unset, no-op.
 * Local/dev safe — never throws to callers.
 */

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendFcmPush(
  tokens: string[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  const key = process.env.FCM_SERVER_KEY?.trim();
  if (!key || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Batch in chunks of 500 (FCM multicast limit for legacy)
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    try {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration_ids: chunk,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data ?? {},
          priority: "high",
        }),
      });
      if (!res.ok) {
        failed += chunk.length;
        continue;
      }
      const json = (await res.json()) as {
        success?: number;
        failure?: number;
      };
      sent += json.success ?? 0;
      failed += json.failure ?? 0;
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}
