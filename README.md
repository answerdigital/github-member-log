# GitHub Member Log

A simple Cloudflare Worker to receive a [GitHub Webhook](https://docs.github.com/en/webhooks) and
send member/collaborator add/remove events to Slack.

## Deploy With Cloudflare

Requires the following:

* GitHub organisation with admin access to set up webhooks
* Slack workspace with an incoming webhook to post to a channel
* A [Cloudflare](https://www.cloudflare.com/) account

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/answerdigital/github-member-log)

## Manual Deploy

Clone this repository and set the following environment variables:

* `CF_ACCOUNT_ID` - the Cloudflare account ID from your dashboard
* `CF_API_TOKEN` - a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) - use the "Edit Cloudflare Workers" template
* `API_SECRET` - the shared secret that will be used to sign the GitHub payloads
* `SLACK_WEBHOOK` - the Slack incoming webhook URL

You can also change `wrangler.toml` to alter the worker name or define custom routes.

## GitHub Setup

Create a Github webhook and set the following settings:

* Payload URL - your worker URL (e.g. https://github-member-log.ACCOUNT.workers.dev) or custom route
* Content type - application/json
* Secret - the shared secret from above
* Events to trigger the webhook:
  * Collaborator add, remove, or changed
  * Organizations
