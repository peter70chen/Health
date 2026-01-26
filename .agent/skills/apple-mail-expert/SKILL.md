---
name: Apple Mail Expert
description: A comprehensive skill for managing Apple Mail on macOS via AppleScript. Allows listing, reading, searching, and creating email drafts.
---

# Apple Mail Expert Skill

This skill empowers the Agent to interact with the native macOS Mail application. It accesses the user's Inbox directly to retrieve email information and draft responses.

## Capabilities

1.  **List Unread Emails**: Fetches a summary of the most recent unread emails.
    *   **Script**: `scripts/list_unread.scpt`
    *   **Usage**: `osascript scripts/list_unread.scpt [limit]` (default limit is 10)
    
2.  **Read Email Content**: Retrieves the full body of a specific email.
    *   **Script**: `scripts/read_email.scpt`
    *   **Usage**: `osascript scripts/read_email.scpt [message_index]`
    
3.  **Search Emails**: Searches for emails by sender or subject.
    *   **Script**: `scripts/search_mail.scpt`
    *   **Usage**: `osascript scripts/search_mail.scpt "search query"`
    
4.  **Draft New Email**: Creates a new email draft with specified recipient, subject, and content.
    *   **Script**: `scripts/create_draft.scpt`
    *   **Usage**: `osascript scripts/create_draft.scpt "recipient@example.com" "Subject Line" "Message Body Content"`

## Important Notes

*   **Privacy**: This skill runs locally. It does not send email data to any external server other than the Agent provider for processing.
*   **Permissions**: The first time this skill is used, macOS might prompt the user to grant "AntiGravity" (or the terminal app) permission to control "Mail". The user **must click OK**.
*   **Performance**: Querying large inboxes can be slow. Scripts are optimized to fetch `top N` results.

## Examples

### Check recent unread mails
```bash
osascript ~/.gemini/antigravity/skills/apple-mail-expert/scripts/list_unread.scpt 5
```

### Draft a reply
```bash
osascript ~/.gemini/antigravity/skills/apple-mail-expert/scripts/create_draft.scpt "peter@example.com" "Re: Meeting" "Hi Peter,\n\nConfirmed for tomorrow.\n\nBest,\nAI"
```

5.  **Advanced Search**: Filters emails by BOTH Sender and Subject.
    *   **Script**: `scripts/search_advanced.scpt`
    *   **Usage**: `osascript scripts/search_advanced.scpt "[Sender]" "[Subject]" [days]`

## Knowledge Base & Patterns

### 1. Finding Koo Foundation (和信醫院) Salary Emails
*   **Challenge**: Searching for Chinese "薪" (Salary) fails because official subjects are in English.
*   **Pattern**:
    *   **Sender**: `gracechen@kfsyscc.org` (or domain `@kfsyscc.org`)
    *   **Subject**: Format is `yyyy-MM-Salary` (e.g., `2026-01-Salary`)
*   **Solution**: Use `search_advanced.scpt` with:
    *   Sender: `kfsyscc`
    *   Subject: `Salary`
    *   Days: `90` (Quarterly check recommended)


