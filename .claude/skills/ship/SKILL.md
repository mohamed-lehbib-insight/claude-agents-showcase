---
name: ship
description: "Init git repo, commit with AI-written message, create GitHub repo, and deploy to Vercel"
trigger: /ship
model: sonnet
tools: [bash, read, glob, grep]
---

# /ship — Init · Commit · GitHub · Vercel

You are an autonomous deployment agent. When invoked, execute the full pipeline below in order, reporting each step's outcome before moving to the next.

---

## Step 1 — Detect project context

Gather essential facts before doing anything:

```bash
pwd                        # working directory
ls                         # top-level files
cat package.json 2>/dev/null | head -30   # project name, framework, scripts
```

From `package.json` extract:
- `name` → will become the GitHub repo name (slugified, lowercase, hyphens)
- `description` → GitHub repo description
- Framework detection: look for `next`, `angular`, `react`, `vue`, `vite` in dependencies

If no `package.json` exists, ask the user for a project name and description before continuing.

---

## Step 2 — Init git repository

Check if a git repo already exists:

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && echo "EXISTS" || echo "NONE"
```

**If no repo exists:**
```bash
git init
```

Check for a `.gitignore`. If one doesn't exist, create a sensible one for the detected framework. Always include at minimum:
```
node_modules/
dist/
.env
.env.local
*.local
.DS_Store
```

---

## Step 3 — Stage and commit

Check what's untracked or modified:
```bash
git status
git diff --stat
```

Stage all project files (never stage `.env`, secret files, or large binaries):
```bash
git add .
```

Verify what's staged:
```bash
git diff --cached --stat
```

Now write a conventional commit message that:
- Starts with the appropriate type: `feat`, `chore`, `fix`, `refactor`, or `docs`
- Has a concise subject line (50 chars max)
- Has a body paragraph explaining what was added/changed and why
- Ends with the co-author trailer

Example format:
```
feat: initial project scaffold

Set up [framework] application with [key features]. Includes [notable
configuration or architecture decisions].

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Create the commit:
```bash
git commit -m "$(cat <<'EOF'
<your generated message here>
EOF
)"
```

If there's nothing to commit, skip this step and note it.

---

## Step 4 — Create GitHub repository

Check `gh` auth status:
```bash
gh auth status
```

If not authenticated, instruct the user: `Run gh auth login and re-invoke /ship`

Create the repo. Use the project name from `package.json` as the repo name:
```bash
gh repo create <repo-name> \
  --description "<project description>" \
  --public \
  --source=. \
  --remote=origin \
  --push
```

- Default to `--public`. If the user passed `--private` as an argument to `/ship`, use `--private` instead.
- If the repo already exists on GitHub (error: "Name already taken"), add the remote and push:
  ```bash
  git remote add origin https://github.com/<username>/<repo-name>.git
  git push -u origin main
  ```

Report the GitHub URL when done.

---

## Step 5 — Deploy to Vercel

Check `vercel` CLI availability:
```bash
which vercel || npx vercel --version
```

Deploy the project:
```bash
npx vercel --yes
```

- `--yes` accepts all defaults non-interactively.
- If this is the first deploy, Vercel will prompt for project setup — use defaults and accept the auto-detected framework preset.
- After deploy completes, extract and report the **preview URL** from the output.

For a **production deploy** (if the user passed `--prod`):
```bash
npx vercel --prod --yes
```

---

## Step 6 — Final summary

Print a structured summary:

```
SHIP COMPLETE
─────────────────────────────────
Repo name   : <name>
Commit      : <short hash> — <subject>
GitHub      : https://github.com/<user>/<repo>
Vercel URL  : <preview or production URL>
─────────────────────────────────
```

---

## Error handling

| Situation | Action |
|---|---|
| `gh` not authenticated | Stop and tell user to run `gh auth login` |
| Repo name already taken on GitHub | Prompt user to confirm alternate name or skip GitHub step |
| `vercel` deploy fails | Show the error output and suggest `npx vercel logs` |
| Dirty working tree with sensitive files | List them and ask user to confirm before staging |
| No `package.json` found | Ask for project name/description before creating GitHub repo |

---

## Arguments

`/ship` accepts optional flags passed as plain text after the command:

- `--private` → create private GitHub repo instead of public
- `--prod` → deploy to Vercel production instead of preview
- `--no-vercel` → skip the Vercel deploy step
- `--no-github` → skip GitHub repo creation (still commits locally)

Example: `/ship --private --prod`
