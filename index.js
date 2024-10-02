import { Buffer } from 'node:buffer';

// See https://docs.github.com/en/webhooks/webhook-events-and-payloads
function buildMessage(event) {
  const messageBlock = {
    type: 'section',
    text: { type: 'mrkdwn' },
    accessory: { type: 'image' },
  };

  let user, type;

  if (['member_added', 'member_removed'].includes(event.action)) {
    user = event.membership.user;
    type = `the ${event.organization.login} organisation`;
  } else if (['added', 'removed'].includes(event.action)) {
    user = event.member;
    type = `the <${event.repository.html_url}|${event.repository.full_name}> repository`;
  }

  if (user) {
    messageBlock.accessory.image_url = user.avatar_url;
    messageBlock.accessory.alt_text = `${user.login} on GitHub`;
    messageBlock.text.text = `*<${user.html_url}|${user.login}>* `;

    switch (event.action) {
      case 'member_added':
      case 'added':
        messageBlock.text.text += 'was added to ' + type;
        break;

      case 'member_removed':
      case 'removed':
        if (user.login == event.sender.login) {
          messageBlock.text.text += 'removed themselves from ' + type;
        } else {
          messageBlock.text.text += 'was removed from ' + type;
        }
        break;
    }

    if (user.login != event.sender.login) {
      messageBlock.text.text += ` by <${event.sender.html_url}|${event.sender.login}>`;
    }

    return {
      text: messageBlock.text.text.replace(/<[^|]*\|([^>]*)>/g, '$1'),
      blocks: [messageBlock],
    };
  }
}

// https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
async function checkSignature(secret, signature, payload) {
  if (!signature) { return 'Missing signature'; }

  // sha256=xxx
  let [alg, sig, ...extra] = signature.split('=');
  if (alg != 'sha256' || !sig || extra.length) { return 'Malformed signature'; }

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {
    name: 'HMAC',
    hash: {name: 'SHA-256'},
  }, false, ['verify']);

  const signatureBytes = Buffer.from(sig, 'hex');
  const data = encoder.encode(payload);
  const verify = await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  if (!verify) { return 'Invalid signature'; }
}

export default {
  async fetch(request, env, ctx) {
    const body = await request.text();
    const error = await checkSignature(
      env.API_SECRET,
      request.headers.get('x-hub-signature-256') || '',
      body
    );
    if (error) { return new Response(error, {status: 401}); }

    const event = JSON.parse(body);
    const message = buildMessage(event);

    if (message && env.SLACK_WEBHOOK) {
      let response = await fetch(env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return new Response('KO');
  },
};
