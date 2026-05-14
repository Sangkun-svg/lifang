type NotificationContextValue = boolean | number | string | null | undefined;

type ServerErrorNotification = {
  context?: Record<string, NotificationContextValue>;
  error: unknown;
  title: string;
};

type SlackApiResponse = {
  error?: string;
  ok: boolean;
};

const slackPostMessageUrl = 'https://slack.com/api/chat.postMessage';
const slackRequestTimeoutMs = 5000;

function getSlackConfig() {
  return {
    channelId: process.env.SLACK_ERROR_CHANNEL_ID || process.env.SLACK_CHANNEL_ID || '',
    token: process.env.SLACK_BOT_TOKEN || process.env.SLACK_TOKEN || '',
  };
}

function isSlackApiResponse(value: unknown): value is SlackApiResponse {
  if (!value || typeof value !== 'object' || !('ok' in value)) {
    return false;
  }

  return typeof (value as { ok: unknown }).ok === 'boolean';
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

function formatContext(context: Record<string, NotificationContextValue> | undefined) {
  if (!context) {
    return '';
  }

  return Object.entries(context)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join('\n');
}

function truncateSlackText(value: string) {
  return value.length > 3900 ? `${value.slice(0, 3900)}\n...truncated` : value;
}

export async function notifyServerError({ context, error, title }: ServerErrorNotification) {
  const { channelId, token } = getSlackConfig();

  if (!token || !channelId) {
    return;
  }

  const contextText = formatContext(context);
  const errorText = formatError(error);
  const message = truncateSlackText([
    `:rotating_light: ${title}`,
    contextText ? `\n${contextText}` : '',
    `\n\`\`\`${errorText}\`\`\``,
  ].join(''));
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), slackRequestTimeoutMs);

  try {
    const response = await fetch(slackPostMessageUrl, {
      body: JSON.stringify({
        channel: channelId,
        text: message,
        unfurl_links: false,
        unfurl_media: false,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
      signal: abortController.signal,
    });
    const responseBody = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !isSlackApiResponse(responseBody) || !responseBody.ok) {
      console.error('Slack error notification failed', {
        error: isSlackApiResponse(responseBody) ? responseBody.error : 'INVALID_RESPONSE',
        status: response.status,
      });
    }
  } catch (slackError) {
    console.error('Slack error notification failed', slackError);
  } finally {
    clearTimeout(timeout);
  }
}
