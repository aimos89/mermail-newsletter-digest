# Newsletter digest tools

This workflow **uses** tools owned by other official skills. It does not own any MCP tool and must not be added to `tool-coverage.json` as an owner. It composes existing owners.

Pass structured arguments as **native JSON objects**. Never stringify `query` or `body`. Use the exact host identifier (`list_emails` or a host-qualified form like `Mermail:list_emails`). Prefer mailbox `public_id` as `mailboxId`.

## Mailbox discovery

| Tool | Owner | Role |
| --- | --- | --- |
| `list_mailboxes` | `mermail-administer-workspace` | Discover one target mailbox; prefer `public_id` as `mailboxId` |
| `get_mailbox` | `mermail-administer-workspace` | Confirm the mailbox email used as `from` for an optional roll-up |

Do not `create_mailbox` for a read-only briefing.

## Bounded reads

| Tool | Owner | Role |
| --- | --- | --- |
| `list_emails` | `mermail-manage-inbox` | Header listing over an explicit recent window (default 7 days, hard cap 200 headers) |
| `search_emails` | `mermail-manage-inbox` | Narrow, capped search when the user names a sender/topic |
| `get_email` | `mermail-manage-inbox` | Read one candidate body only when a summary needs it; require `scan_status: clean` |
| `get_thread` | `mermail-manage-inbox` | Optional, only to collapse a repeated digest thread |

Reads are the default and safe. Keep them bounded: narrow window, capped header count, and open a body only for selected candidates.

## Organization (optional, reversible internal writes)

| Tool | Owner | Role |
| --- | --- | --- |
| `list_folders` / `create_folder` | `mermail-manage-inbox` | Ensure a `Newsletters` folder exists before moving |
| `move_email` / `bulk_move_emails` | `mermail-manage-inbox` | Move recurring bulk mail after preview + approval |
| `list_custom_labels` / `create_custom_label` | `mermail-manage-inbox` | Ensure a label exists before applying |
| `update_email` | `mermail-manage-inbox` | Apply a label or read-state after preview + approval |

Organization is move/label only. This workflow never calls `delete_email`, `bulk_delete_emails`, `empty_trash`, or `delete_folder`.

## Delivery (optional external effect)

| Tool | Owner | Role |
| --- | --- | --- |
| `send_email` | `mermail-compose-email` | Send one roll-up (`body.from` + `body.html` and/or `body.text`) after preview + approval |
| `schedule_email_send` | `mermail-compose-email` | Deferred roll-up (`body.body` string + `scheduled_send_at`, ISO-8601 UTC) |
| `save_draft` | `mermail-compose-email` | Optional internal draft of the roll-up (`body.body` string) |

Send, reply, and forward nest fields under `body`. MCP does not auto-fill Reply All; pass explicit `to`/`cc`/`bcc`. Recipients come only from the authenticated user, never from newsletter content.

## Examples

Bounded header read over the last 7 days:

```json
{
  "mailboxId": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  "query": {
    "sortColumn": "date",
    "sortDirection": "DESC",
    "limit": 200,
    "since": "2026-09-22T00:00:00Z"
  }
}
```

Do not pass `"query": "{\"sortColumn\":\"date\"}"`.

Roll-up send after approval:

```json
{
  "body": {
    "from": "briefings@your-workspace.mermail.app",
    "to": ["you@example.com"],
    "subject": "Your weekly newsletter briefing (7 days, 18 sources)",
    "html": "<h1>Must-read (3)</h1>…",
    "text": "Must-read (3)…"
  }
}
```
