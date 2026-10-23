# Streak Keeper setup and limits

The workflow in .github/workflows/streak-keeper.yml checks three times per day and creates at most one durable heartbeat commit per Europe/Berlin calendar day. It no longer adds and then removes a temporary README line. The heartbeat is kept at .github/streak-keeper/heartbeat.json, so later checks can recognize the day's successful run and avoid duplicate commits.

## Email alert setup (required for email delivery)

In GitHub, open Higer23/snapchat → Settings → Secrets and variables → Actions → New repository secret and add:

- MAIL_USERNAME: the Gmail address used to send alerts.
- MAIL_APP_PASSWORD: a Gmail App Password (not the normal account password; Gmail 2-Step Verification must be enabled).
- ALERT_EMAIL: the destination address that should receive failure alerts.

The workflow sends an email when its keeper job fails. If the secrets are absent or SMTP is unavailable, email delivery cannot work; the failure-notification job will also fail and the Actions run will show why.

## Schedule

The workflow checks at 05:17, 11:23, and 17:37 UTC. That is approximately 07:17/13:23/19:37 in Germany during summer time and 06:17/12:23/18:37 during winter time. The non-round minutes reduce (but do not eliminate) the chance of scheduler contention.

## Important limitations

No GitHub Actions workflow can promise 100% uptime. GitHub can delay or drop scheduled runs, disable Actions, or experience an outage. A failed workflow can send an email only if the workflow starts and the mail secrets/network are available. This automation improves resilience; it cannot guarantee an unbroken contribution streak.

GitHub counts commits only when account attribution and repository/branch requirements are met. The workflow uses the GitHub-provided noreply address for Higer23 and pushes to main, but the profile graph may take time to update. Confirm the noreply address in GitHub account email settings if contributions do not appear.

## Test

Open Actions → Streak Keeper → Run workflow and run with force_commit=false. The run should either create and verify today's heartbeat commit or report that today's heartbeat already exists. Use force_commit=true only when you intentionally want another heartbeat commit on the same day.
