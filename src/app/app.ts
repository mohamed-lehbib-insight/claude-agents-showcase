import { Component, signal, AfterViewInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  readonly typedText = signal('');
  readonly activeCreationTab = signal(0);

  private readonly phrases = [
    'best practices', 'context engineering', 'skill creation', 'agent workflows', 'token optimization',
  ];
  private phraseIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  // ── /init terminal demo ──────────────────────────────────────────────────
  readonly initLines = [
    { type: 'prompt', text: '$ claude' },
    { type: 'gap', text: '' },
    { type: 'system', text: '✓  Reading project structure...' },
    { type: 'warn',   text: '⚠  No CLAUDE.md found in project root' },
    { type: 'info',   text: '?  Create CLAUDE.md with project context? [Y/n]' },
    { type: 'input',  text: 'Y' },
    { type: 'gap', text: '' },
    { type: 'success', text: '✓  CLAUDE.md created' },
    { type: 'success', text: '✓  Detected: Angular 20 · Tailwind CSS v4 · TypeScript' },
    { type: 'success', text: '✓  Context loaded. Claude is ready.' },
    { type: 'gap', text: '' },
    { type: 'muted',  text: '  Type a task or /help for commands' },
    { type: 'cursor', text: '> ' },
  ];

  readonly claudeMdLines = [
    { key: '# Architecture',    val: '' },
    { key: '- Framework',       val: 'Angular 20 standalone · OnPush · Signals' },
    { key: '- Styles',          val: 'Tailwind v4 via postcss.config.json' },
    { key: '- State',           val: 'No NgRx — Signals only' },
    { key: '',                   val: '' },
    { key: '# Conventions',     val: '' },
    { key: '- Components',      val: 'kebab-case filenames, standalone only' },
    { key: '- Commits',         val: 'conventional commits (feat/fix/chore)' },
    { key: '',                   val: '' },
    { key: '# Known Issues',    val: '' },
    { key: '- Zone.js',         val: 'conflicts with RxJS v8 — avoid subscribe()' },
  ];

  // ── Context & prompt engineering ─────────────────────────────────────────
  readonly atMentions = [
    { mention: '@src/app/auth.service.ts', desc: 'Reference a specific file', color: '#00F5D4' },
    { mention: '@src/app/',               desc: 'Reference an entire directory', color: '#7C3AED' },
    { mention: '@README.md',              desc: 'Provide project documentation', color: '#FF6B35' },
    { mention: '@package.json',           desc: 'Share dependencies & scripts', color: '#00F5D4' },
    { mention: '@CLAUDE.md',             desc: 'Load architecture conventions', color: '#7C3AED' },
  ];

  readonly promptWeak = {
    text: 'Fix the auth bug',
    issues: ['No file reference', 'No error description', 'No expected behavior', 'Claude must guess'],
  };

  readonly promptStrong = {
    parts: [
      { text: 'The login form in ', color: '#8888aa' },
      { text: '@src/app/auth/login.component.ts', color: '#00F5D4' },
      { text: ' throws ', color: '#8888aa' },
      { text: "TypeError: Cannot read property 'token' of undefined", color: '#FF6B35' },
      { text: ' when the email field is submitted empty.\n\n', color: '#8888aa' },
      { text: 'Expected:', color: '#00F5D4' },
      { text: ' show inline validation error.\n', color: '#8888aa' },
      { text: 'Actual:', color: '#FF6B35' },
      { text: ' app crashes.\n\nFix and add a unit test for the empty-email case.', color: '#8888aa' },
    ],
    highlights: ['@file reference', 'Exact error', 'Expected vs Actual', 'Asks for test'],
  };

  // ── Git workflow ──────────────────────────────────────────────────────────
  readonly gitCycle = [
    { phase: '01', title: 'Describe one task',         detail: 'One focused goal + @file references. No multi-step mega-prompts.', color: '#00F5D4' },
    { phase: '02', title: 'Review every diff',          detail: 'Read the changes before accepting. Never auto-approve large batches.', color: '#7C3AED' },
    { phase: '03', title: '/commit verified changes',   detail: 'One commit per logical unit. AI-generated conventional message from diff.', color: '#FF6B35' },
    { phase: '04', title: '/clear between tasks',       detail: 'Free context tokens. Long sessions degrade quality exponentially.', color: '#00F5D4' },
  ];

  readonly gitTerminalLines = [
    { type: 'prompt',  text: '> Review @src/app/auth.service.ts — add JWT refresh token auto-rotation' },
    { type: 'think',   text: '⟳  Reading auth.service.ts (142 lines)...' },
    { type: 'action',  text: '✎  src/app/auth.service.ts     +47 lines,  -3 lines' },
    { type: 'action',  text: '✎  src/app/auth.interceptor.ts +12 lines' },
    { type: 'info',    text: '↳  2 files changed · added refreshToken(), rotateKeys(), scheduleRotation()' },
    { type: 'gap', text: '' },
    { type: 'prompt',  text: '> /commit' },
    { type: 'success', text: '✓  feat(auth): add JWT refresh token with auto-rotation' },
    { type: 'muted',   text: '   2 files staged · 59 insertions · conventional commit generated' },
    { type: 'gap', text: '' },
    { type: 'prompt',  text: '> /clear' },
    { type: 'warn',    text: '↻  Clearing context...' },
    { type: 'success', text: '✓  Done. Freed 24,816 tokens. Starting fresh.' },
    { type: 'cursor',  text: '> ' },
  ];

  // ── Token / context tips ──────────────────────────────────────────────────
  readonly tokenTips = [
    { title: '/clear between tasks',    desc: 'The single most impactful habit. Stale context causes drift and wasted tokens.', color: '#00F5D4', tag: 'CRITICAL' },
    { title: 'Scope your @mentions',    desc: 'Only include files Claude needs. Flooding context with unrelated files dilutes focus.', color: '#7C3AED', tag: 'FOCUS' },
    { title: 'Split large tasks',       desc: 'A 10-step feature = 10 single-step prompts. Each stays within optimal depth.', color: '#FF6B35', tag: 'SCOPE' },
    { title: 'CLAUDE.md for stability', desc: 'Move stable context (architecture, conventions) into CLAUDE.md instead of repeating it.', color: '#00F5D4', tag: 'MEMORY' },
  ];

  // ── Skills marketplace ────────────────────────────────────────────────────
  readonly officialSkillsRepo = 'https://github.com/anthropics/claude-code-skills';

  readonly pluginsLines = [
    { type: 'prompt', text: '> /plugins' },
    { type: 'gap', text: '' },
    { type: 'header', text: '  Installed plugins (9)' },
    { type: 'plugin', name: 'frontend-design', category: 'UI/UX',        color: '#FF6B35' },
    { type: 'plugin', name: 'code-review',     category: 'QUALITY',      color: '#7C3AED' },
    { type: 'plugin', name: 'playwright',       category: 'TESTING',      color: '#00F5D4' },
    { type: 'plugin', name: 'coderabbit',       category: 'CODE REVIEW',  color: '#FF6B35' },
    { type: 'plugin', name: 'context7',         category: 'LIVE DOCS',    color: '#7C3AED' },
    { type: 'plugin', name: 'sentry',           category: 'OBSERVABILITY',color: '#00F5D4' },
    { type: 'gap', text: '' },
    { type: 'info',   text: '  Install: /plugin-install <name>' },
    { type: 'link',   text: '  Marketplace: github.com/anthropics/claude-code-skills' },
    { type: 'cursor', text: '> ' },
  ];

  readonly marketplaceSkills = [
    { name: 'frontend-design', cmd: '/frontend-design',  desc: 'Production-grade UI with distinctive aesthetics for React, Angular, Vue', category: 'UI/UX',         color: '#FF6B35' },
    { name: 'code-review',     cmd: '/code-review',      desc: 'Deep review: bugs, security holes, performance regressions, style drift',  category: 'QUALITY',      color: '#7C3AED' },
    { name: 'playwright',      cmd: '/playwright:test',  desc: 'Launch a real browser and run E2E test flows with DOM snapshots',          category: 'TESTING',      color: '#00F5D4' },
    { name: 'coderabbit',      cmd: '/coderabbit:review',desc: 'Multi-pass AI review posted as inline PR comments with fix suggestions',   category: 'CODE REVIEW',  color: '#FF6B35' },
    { name: 'context7',        cmd: '/context7:docs',    desc: 'Fetch version-pinned live docs for any library — no stale training data',  category: 'LIVE DOCS',    color: '#7C3AED' },
    { name: 'sentry',          cmd: '/sentry:seer',      desc: 'Query Sentry issues in natural language and auto-generate fix PRs',        category: 'OBSERVABILITY',color: '#00F5D4' },
  ];

  // My own skills
  readonly mySkills = [
    { cmd: '/ship',            title: 'Ship',             desc: 'Git init + smart commit + GitHub repo + Vercel deploy in one command', color: '#00F5D4', category: 'DEPLOY'   },
    { cmd: '/commit',          title: 'Smart Commit',     desc: 'Stages changes, generates conventional commit from diff, runs hooks',  color: '#7C3AED', category: 'GIT'     },
    { cmd: '/review-pr',       title: 'PR Review',        desc: 'Fetches PR, analyzes all changed files for bugs, security, style',    color: '#FF6B35', category: 'GITHUB'  },
    { cmd: '/frontend-design', title: 'UI Designer',      desc: 'Production-grade UI components with distinctive, non-generic aesthetics',color: '#FF6B35',category: 'UI/UX'  },
    { cmd: '/simplify',        title: 'Simplifier',       desc: 'Detects over-engineering and rewrites lean without breaking tests',   color: '#7C3AED', category: 'REFACTOR'},
    { cmd: '/claude-api',      title: 'Claude API Builder',desc: 'Scaffolds full Anthropic SDK integrations with streaming and tools', color: '#00F5D4', category: 'AI SDK'  },
  ];

  // ── Chrome extension ──────────────────────────────────────────────────────
  readonly chromeUseCase = [
    { step: '01', action: 'Open the failing page in Chrome',                tool: 'Browser',    color: '#00F5D4' },
    { step: '02', action: 'chrome:automate reads console errors & network', tool: 'Chrome MCP', color: '#7C3AED' },
    { step: '03', action: 'DOM snapshot + full-page screenshot captured',   tool: 'Chrome MCP', color: '#FF6B35' },
    { step: '04', action: 'Claude correlates errors with @src files',       tool: 'Analysis',   color: '#00F5D4' },
    { step: '05', action: 'Fix written and verified in the live browser',   tool: 'Playwright', color: '#7C3AED' },
    { step: '06', action: '/commit — fix shipped to staging',               tool: 'Git',        color: '#FF6B35' },
  ];

  // ── Skill creation ────────────────────────────────────────────────────────
  readonly skillBuildSteps = [
    {
      n: '01', title: 'Create the folder',
      detail: 'Each skill lives in its own directory inside .claude/skills/. The folder name becomes the default slash command.',
      hint: '.claude/\n  skills/\n    ship/\n      SKILL.md    ← /ship\n    deploy-preview/\n      SKILL.md    ← /deploy-preview',
      color: '#00F5D4',
    },
    {
      n: '02', title: 'Write YAML frontmatter',
      detail: 'Two fields are all you need: name and description. The rest is optional (model, tools allowlist).',
      hint: '---\nname: ship\ndescription: "Init, commit,\n  GitHub & Vercel deploy"\nmodel: sonnet\n---',
      color: '#7C3AED',
    },
    {
      n: '03', title: 'Write the prompt body',
      detail: 'Full agent instructions: numbered steps, tools to use, error handling, and expected output format.',
      hint: '# Ship Skill\n\nYou are a deployment agent.\nWhen invoked, in order:\n1. git init if no repo exists\n2. Stage files & commit\n3. gh repo create --push\n4. vercel --prod --yes',
      color: '#FF6B35',
    },
    {
      n: '04', title: 'Test with edge cases',
      detail: 'Run the skill with empty input, bad state, missing files. Iterate the prompt until behaviour is deterministic.',
      hint: '/ship\n/ship --prod\n/ship --private --prod\n/ship --no-github\n/ship --no-vercel',
      color: '#00F5D4',
    },
  ];

  // ── Agents ────────────────────────────────────────────────────────────────
  readonly agentTypes = [
    { role: 'Orchestrator', desc: 'Top-level agent. Decomposes goals, assigns work to sub-agents, and synthesizes their outputs into one result.', color: '#00F5D4', tag: 'CORE' },
    { role: 'Specialist',   desc: 'Domain-expert sub-agent with focused tools: security auditor, UI generator, API integrator, test writer.', color: '#7C3AED', tag: 'EXPERT' },
    { role: 'Validator',    desc: 'Reviews and verifies all sub-agent outputs before they are merged, committed, or deployed.', color: '#FF6B35', tag: 'SAFETY' },
  ];

  readonly agentResources = [
    { title: 'Agent Architecture',  url: 'https://docs.anthropic.com/en/docs/claude-code', color: '#00F5D4' },
    { title: 'Sub-agent Patterns',  url: 'https://docs.anthropic.com/en/docs/claude-code', color: '#7C3AED' },
    { title: 'Persistent Memory',   url: 'https://docs.anthropic.com/en/docs/claude-code', color: '#FF6B35' },
    { title: 'Hooks & Automation',  url: 'https://docs.anthropic.com/en/docs/claude-code', color: '#00F5D4' },
  ];

  // ── Good practices ────────────────────────────────────────────────────────
  readonly goodPractices = [
    { n: '01', title: 'One task at a time',    desc: 'Break work into small, verifiable units. Never ask Claude to build an entire app in one prompt.', color: '#00F5D4', tag: 'SCOPE'  },
    { n: '02', title: 'Always @mention files', desc: 'Reference relevant files explicitly. Never assume Claude knows which file you mean.',             color: '#7C3AED', tag: 'CONTEXT'},
    { n: '03', title: 'Commit early & often',  desc: 'One commit per logical change. Use /commit for AI-generated conventional messages.',              color: '#FF6B35', tag: 'GIT'    },
    { n: '04', title: '/clear between tasks',  desc: 'Fresh context = sharper focus. Long sessions degrade quality exponentially.',                     color: '#00F5D4', tag: 'TOKENS' },
    { n: '05', title: 'Maintain CLAUDE.md',    desc: 'Document architecture decisions here. Agents load this first every session.',                     color: '#7C3AED', tag: 'MEMORY' },
    { n: '06', title: 'Review before accept',  desc: 'Always read the diff. Claude is powerful but fallible. You own every line of code.',             color: '#FF6B35', tag: 'SAFETY' },
  ];

  // ── Bad practices ─────────────────────────────────────────────────────────
  readonly badPractices = [
    { severity: 'CRITICAL', title: 'Vague mega-prompts',       example: '"Build me a full SaaS app"',                    impact: 'Unfocused output, impossible to verify, guaranteed token waste',             color: '#FF6B35' },
    { severity: 'HIGH',     title: 'No file context',           example: '"Fix the auth bug"',                            impact: 'Wrong file targeted, regressions introduced, 3× token waste',               color: '#FF6B35' },
    { severity: 'HIGH',     title: 'Never clearing context',    example: 'Hours-long session, no /clear',                 impact: 'Context poisoning, degraded responses, token budget exhausted mid-task',    color: '#7C3AED' },
    { severity: 'HIGH',     title: 'Auto-accepting all changes',example: 'Approve without reading diffs',                 impact: 'Unreviewed code in production, silent regressions, security vulnerabilities', color: '#7C3AED' },
    { severity: 'MEDIUM',   title: 'Repeating context every prompt', example: '"As I mentioned, we use Angular..."',      impact: 'Token waste + confusion — put stable context in CLAUDE.md instead',          color: '#00F5D4' },
    { severity: 'MEDIUM',   title: 'Committing generated code blindly', example: '"Just commit everything Claude wrote"', impact: 'No ownership of the codebase, silent bugs, loss of code review culture',   color: '#00F5D4' },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.startTyping();
  }

  ngOnDestroy(): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
  }

  private startTyping(): void {
    const current = this.phrases[this.phraseIndex];
    const speed = this.isDeleting ? 50 : 100;
    if (!this.isDeleting && this.charIndex <= current.length) {
      this.typedText.set(current.substring(0, this.charIndex++));
    } else if (this.isDeleting && this.charIndex >= 0) {
      this.typedText.set(current.substring(0, this.charIndex--));
    }
    if (!this.isDeleting && this.charIndex > current.length) {
      this.typingTimer = setTimeout(() => { this.isDeleting = true; this.startTyping(); }, 1800);
      return;
    }
    if (this.isDeleting && this.charIndex < 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      this.charIndex = 0;
      this.typingTimer = setTimeout(() => this.startTyping(), 300);
      return;
    }
    this.typingTimer = setTimeout(() => this.startTyping(), speed);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  colorToRgb(hex: string): string {
    if (hex === '#00F5D4') return '0,245,212';
    if (hex === '#7C3AED') return '124,58,237';
    return '255,107,53';
  }

  setTab(i: number): void {
    this.activeCreationTab.set(i);
  }

  badMediaTab = 0;
  fullscreenOpen = false;

  openFullscreen() { this.fullscreenOpen = true; }
  closeFullscreen() { this.fullscreenOpen = false; }

  severityColor(s: string): string {
    if (s === 'CRITICAL') return '#FF6B35';
    if (s === 'HIGH') return '#f59e0b';
    return '#8888aa';
  }

  severityBg(s: string): string {
    if (s === 'CRITICAL') return 'rgba(255,107,53,0.1)';
    if (s === 'HIGH') return 'rgba(245,158,11,0.1)';
    return 'rgba(136,136,170,0.08)';
  }
}
