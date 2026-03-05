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
    'autonomous tasks', 'parallel workflows', 'multi-agent systems', 'persistent memory', 'code at scale',
  ];
  private phraseIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;

  readonly capabilities = [
    { icon: 'autonomous', title: 'Autonomous Execution', description: 'Agents independently decompose complex tasks, write and run code, handle errors, and iterate — all without human intervention.', tag: 'CORE', color: '#00F5D4' },
    { icon: 'parallel', title: 'Parallel Orchestration', description: 'Spawn multiple sub-agents that execute simultaneously, reducing hours of sequential work to minutes of parallel processing.', tag: 'POWER', color: '#7C3AED' },
    { icon: 'memory', title: 'Persistent Memory', description: 'Agents maintain institutional knowledge across sessions — remembering patterns, conventions, and architectural decisions.', tag: 'SMART', color: '#FF6B35' },
    { icon: 'specialized', title: 'Sub-Agent Specialization', description: 'Deploy purpose-built agents with domain expertise: security auditors, UI experts, API integrators, test engineers.', tag: 'EXPERT', color: '#00F5D4' },
    { icon: 'codegen', title: 'Code Generation', description: 'Generate, refactor, and review entire codebases. From single functions to complete application architectures.', tag: 'BUILD', color: '#7C3AED' },
    { icon: 'tools', title: 'Tool Integration', description: 'Natively call bash, read files, search codebases, run tests, and interact with any API or external system.', tag: 'CONNECT', color: '#FF6B35' },
  ];

  // ── MCP-powered power skills ──────────────────────────────────────────
  readonly powerSkills = [
    {
      cmd: 'coderabbit:review',
      title: 'CodeRabbit AI Review',
      description: 'Runs a deep, multi-pass AI review on your open PR. Detects logic bugs, security holes, performance regressions, and style drift — then posts precise inline comments with fix suggestions.',
      color: '#FF6B35',
      category: 'CODE REVIEW',
      mcp: 'CodeRabbit MCP',
      pipeline: ['fetch diff', 'multi-pass scan', 'rank issues', 'post inline comments'],
      example: 'coderabbit:review → PR #142',
      icon: 'rabbit',
    },
    {
      cmd: 'playwright:test',
      title: 'Playwright E2E',
      description: 'Launches a real Chromium browser, navigates your app, and runs end-to-end test flows autonomously. Captures DOM snapshots, network logs, and screenshots on every assertion.',
      color: '#00F5D4',
      category: 'E2E TESTING',
      mcp: 'Playwright MCP',
      pipeline: ['launch browser', 'navigate', 'assert DOM', 'capture evidence'],
      example: 'playwright:test → login flow ✓',
      icon: 'playwright',
    },
    {
      cmd: 'context7:docs',
      title: 'Context7 Live Docs',
      description: "Fetches authoritative, version-pinned documentation for any library in real time. No stale training data — always the exact API surface you're running today.",
      color: '#7C3AED',
      category: 'LIVE DOCS',
      mcp: 'Context7 MCP',
      pipeline: ['resolve lib-id', 'fetch latest', 'extract API', 'inject context'],
      example: 'context7:docs → Angular 20 signals',
      icon: 'docs',
    },
    {
      cmd: 'chrome:automate',
      title: 'Claude in Chrome',
      description: 'Controls your live Chrome browser — clicks, fills forms, reads the DOM, captures screenshots, reads console logs and network requests — all from a single skill invocation.',
      color: '#FF6B35',
      category: 'BROWSER',
      mcp: 'Chrome MCP',
      pipeline: ['open tab', 'navigate', 'interact', 'extract & report'],
      example: 'chrome:automate → scrape + screenshot',
      icon: 'chrome',
    },
  ];

  // ── Built-in skills ───────────────────────────────────────────────────
  readonly skills = [
    { cmd: '/commit', title: 'Smart Commit', description: 'Stages changes, generates a conventional commit message from the diff, runs pre-commit hooks, and creates the commit.', color: '#00F5D4', category: 'GIT', steps: ['git diff', 'write message', 'run hooks', 'commit'] },
    { cmd: '/review-pr', title: 'PR Review', description: 'Fetches the pull request, analyzes all changed files for bugs, security issues, and style, then posts structured review comments.', color: '#7C3AED', category: 'GITHUB', steps: ['fetch PR', 'analyze diff', 'check security', 'post review'] },
    { cmd: '/frontend-design', title: 'Frontend Designer', description: 'Creates production-grade UI components with distinctive aesthetics — avoiding generic AI looks. Supports React, Angular, and Vue.', color: '#FF6B35', category: 'UI/UX', steps: ['parse spec', 'design system', 'generate code', 'polish'] },
    { cmd: '/claude-api', title: 'Claude API Builder', description: 'Scaffolds full Anthropic SDK integrations: streaming responses, tool use, vision inputs, and multi-turn conversations.', color: '#00F5D4', category: 'AI SDK', steps: ['pick model', 'wire tools', 'stream output', 'handle errors'] },
    { cmd: '/sentry:seer', title: 'Sentry AI Seer', description: 'Queries Sentry with natural language, triages live issues by impact, traces stack frames to source, and auto-generates fix PRs.', color: '#7C3AED', category: 'OBSERVABILITY', steps: ['nl query', 'triage', 'trace source', 'draft fix'] },
    { cmd: '/simplify', title: 'Code Simplifier', description: 'Reviews recently changed code for over-engineering, dead abstractions, and redundancy — then rewrites it leaner without breaking tests.', color: '#FF6B35', category: 'REFACTOR', steps: ['scan changes', 'detect bloat', 'rewrite lean', 'verify tests'] },
    { cmd: '/ship', title: 'Ship to Production', description: 'Initializes a git repo, generates a conventional commit message from the diff, creates a GitHub repository, and deploys the app to Vercel — all in one command.', color: '#00F5D4', category: 'DEPLOY', steps: ['git init', 'smart commit', 'gh repo create', 'vercel --prod'] },
  ];

  // ── Skill creation steps ──────────────────────────────────────────────
  readonly creationSteps = [
    {
      n: '01',
      title: 'Design the interface',
      detail: 'Before writing anything, define what your skill accepts and produces. Think of it as a CLI command with a contract.',
      hint: 'Input: a PR number or branch name\nOutput: structured review comment\nTools needed: gh, read files',
      color: '#00F5D4',
    },
    {
      n: '02',
      title: 'Create the file',
      detail: 'Skills live in .claude/skills/ at your project root. The filename becomes the default trigger slug.',
      hint: '.claude/\n  skills/\n    deploy-preview/\n      SKILL.md        ← /deploy-preview\n    db-seed/\n      SKILL.md        ← /db-seed',
      color: '#7C3AED',
    },
    {
      n: '03',
      title: 'Write YAML frontmatter',
      detail: 'The frontmatter block configures the skill metadata. Every field is optional except name.',
      hint: '---\nname: deploy-preview\ndescription: "Build & deploy preview"\ntrigger: /deploy-preview\nmodel: sonnet\n---',
      color: '#FF6B35',
    },
    {
      n: '04',
      title: 'Write the prompt body',
      detail: 'The body is the full agent instruction set. Be explicit about steps, output format, error handling, and tools to use.',
      hint: '## Goal\nDeploy a Vercel preview for the\ncurrent branch.\n\n## Steps\n1. Run `npm run build`\n2. Fix any TS errors\n3. Run `vercel --prod=false`\n4. Return the preview URL',
      color: '#00F5D4',
    },
    {
      n: '05',
      title: 'Test & iterate',
      detail: 'Run the skill with edge cases: empty input, errors, large files. Refine the prompt until behaviour is deterministic.',
      hint: '$ /deploy-preview          # basic\n$ /deploy-preview --dry-run  # dry run\n$ /deploy-preview branch=fix  # param',
      color: '#7C3AED',
    },
  ];

  // ── Frontmatter reference ─────────────────────────────────────────────
  readonly frontmatterFields = [
    { field: 'name', type: 'string', required: true,  desc: 'Unique identifier used as the slash command slug' },
    { field: 'description', type: 'string', required: false, desc: 'Short summary shown in /help listings' },
    { field: 'trigger', type: 'string', required: false, desc: 'Custom slash command override (default: /name)' },
    { field: 'model', type: 'enum',   required: false, desc: 'sonnet (default) | opus | haiku' },
    { field: 'memory', type: 'enum',   required: false, desc: 'project | user — which memory scope to load' },
    { field: 'tools', type: 'array',  required: false, desc: 'Allowlist of tools: bash, read, write, grep…' },
    { field: 'color', type: 'string', required: false, desc: 'Hex or named color for the skill card in UI' },
  ];

  // ── Best practices ────────────────────────────────────────────────────
  readonly bestPractices = [
    { type: 'do',   title: 'Single responsibility',       desc: 'Each skill does exactly one thing. Compose complex flows from multiple skills rather than bloating one.' },
    { type: 'do',   title: 'Explicit output format',      desc: 'Always specify what the skill should return — plain text, JSON, a file path, a PR comment.' },
    { type: 'do',   title: 'Define error behaviour',      desc: 'Tell the skill what to do on failure: retry, abort, or return a structured error object.' },
    { type: 'do',   title: 'Right model for the task',    desc: 'Use haiku for fast transforms, sonnet for most coding, opus only for complex multi-step reasoning.' },
    { type: 'dont', title: 'Avoid vague instructions',    desc: 'Never write "do a good job". Specify exact steps, conditions, and acceptance criteria.' },
    { type: 'dont', title: "Don't skip tool allowlists",  desc: 'Constrain the tools array to only what the skill needs — prevents unintended side effects.' },
    { type: 'dont', title: "Don't ignore edge cases",     desc: 'Test empty input, malformed data, missing files. Add explicit handling in the prompt body.' },
    { type: 'dont', title: 'Never hardcode secrets',      desc: 'Use environment variables accessed via bash. Never embed API keys or tokens in the skill file.' },
  ];

  readonly useCases = [
    { number: '01', title: 'Full-Stack Feature Development', description: 'Orchestrator agent receives a feature request, spawns a backend agent to write the API, a frontend agent for the UI, and a test agent for coverage — all running in parallel.', steps: ['Analyze requirements', 'Spawn specialized agents', 'Merge outputs', 'Run tests'], accent: '#00F5D4' },
    { number: '02', title: 'Codebase-Wide Refactoring', description: 'An agent maps the entire dependency graph, identifies breaking change patterns, then orchestrates safe refactoring across hundreds of files simultaneously.', steps: ['Map dependencies', 'Plan changes', 'Parallel edits', 'Validate integrity'], accent: '#7C3AED' },
    { number: '03', title: 'Automated Security Audit', description: 'Specialized security agent scans code for OWASP vulnerabilities, generates a detailed report, and a remediation agent patches every finding with proper validation.', steps: ['Scan codebase', 'Identify vectors', 'Generate report', 'Apply patches'], accent: '#FF6B35' },
  ];

  readonly stats = [
    { value: '10x', label: 'Faster than sequential', sub: 'via parallel agents' },
    { value: '∞', label: 'Context depth', sub: 'via persistent memory' },
    { value: '100%', label: 'Tool native', sub: 'bash, files, APIs' },
    { value: 'Zero', label: 'Human bottlenecks', sub: 'on routine tasks' },
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
}
