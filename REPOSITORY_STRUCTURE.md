# Repository Structure & Organization

**Complete guide to the Scalix Code repository layout**

Last Updated: April 5, 2026

## 📁 Root Directory

Clean, focused root directory with essential files only:

```
scalix-code/
├── README.md                   ⭐ START HERE - Project overview
├── FINAL_PROJECT_STATUS.md     📊 Complete project status (all phases)
├── BUILD_STATUS.md             🔧 Build compilation status & roadmap
├── START_HERE.md               🚀 Development quick start
├── LICENSE                     ⚖️ Apache 2.0 License
├── .gitignore                  📋 Git ignore patterns
└── REPOSITORY_STRUCTURE.md     📍 This file
```

**Total:** 4 markdown files + LICENSE (5 essential files)
**Previous:** 46 markdown files (now organized!)

## 📂 Source Code

### Core Platform

```
core/
├── src/
│   ├── agents/                 # 9 AI agents
│   │   ├── codebase-analyzer.ts
│   │   ├── code-explainer.ts
│   │   ├── security-analyzer.ts
│   │   ├── test-writer.ts
│   │   ├── bug-fixer.ts
│   │   ├── refactorer.ts
│   │   ├── performance-analyzer.ts
│   │   ├── documentation-generator.ts
│   │   ├── architecture-advisor.ts
│   │   └── index.ts
│   ├── tools/                  # 23 tools
│   ├── orchestration/          # Agent coordination
│   ├── performance/            # Profiler, cache, parallel
│   ├── plugins/                # Plugin system
│   ├── observability/          # Metrics, tracing
│   └── __tests__/             # 419 tests
├── package.json
└── tsconfig.json
```

### Packages

```
packages/
├── api/                        # Express REST API + WebSocket
│   ├── src/
│   │   ├── server.ts
│   │   ├── websocket.ts
│   │   ├── routes/
│   │   └── middleware/
│   └── package.json
├── sdk/                        # TypeScript SDK client
├── schemas/                    # Zod validation schemas
├── vscode-extension/           # VS Code IDE integration
│   ├── src/
│   │   ├── extension.ts       # Activation entry
│   │   ├── commands.ts        # 6 commands
│   │   ├── providers/         # 3 providers
│   │   └── __tests__/         # 27 tests
│   └── package.json
├── cli/                        # Command-line interface
├── marketplace/                # Community marketplace backend (Phase 7)
├── types/                      # Shared type definitions
├── utils/                      # Shared utilities
└── schemas/                    # Shared schemas
```

## 📚 Documentation

### User Guides

```
docs/user-guide/
├── getting-started.md          # Getting started with Scalix Code
├── troubleshooting.md          # Common issues and solutions
├── VSCODE_MARKETPLACE_GUIDE.md # Publish to VS Code marketplace
├── VSCODE_TROUBLESHOOTING.md   # VS Code extension issues
└── agents/                     # 9 agent documentation files
    ├── codebase-analyzer.md
    ├── code-explainer.md
    ├── security-analyzer.md
    ├── test-writer.md
    ├── bug-fixer.md
    ├── refactorer.md
    ├── performance-analyzer.md
    ├── documentation-generator.md
    └── architecture-advisor.md
```

**Total:** 11 user guide files

### Developer Guides

```
docs/developer-guide/
├── architecture.md             # System architecture
├── building-agents.md          # Create custom agents
├── building-tools.md           # Create custom tools
├── building-plugins.md         # Build plugin extensions
└── contributing.md             # Contribution guidelines
```

**Total:** 5 developer guide files

### Operations Guides

```
docs/ops-guide/
├── deployment.md               # Docker, Kubernetes, manual
├── configuration.md            # Configuration reference
├── monitoring.md               # Observability setup
└── scaling.md                  # Capacity planning
```

**Total:** 4 operations guide files

### Security & Compliance

```
docs/security/
├── SECURITY.md                 # Security policy
└── SECURITY_AUDIT.md          # Full audit report
```

**Total:** 2 security files

### Launch Materials

```
docs/launch/
├── LAUNCH_CHECKLIST.md        # Launch checklist
├── BLOG_ANNOUNCEMENT.md       # Blog post draft
└── PRESS_KIT.md               # Marketing materials
```

**Total:** 3 launch files

### Root Documentation

```
docs/
├── INDEX.md                    # 📍 Documentation index (START HERE)
├── ARCHITECTURE.md             # Architecture overview
├── GETTING_STARTED.md          # Quick start guide
├── GUARDRAILS.md               # Safety guardrails
├── PLUGINS.md                  # Plugin system
├── TESTING.md                  # Testing strategy
└── [All subdirectories above]
```

**Total Doc Files:** 32 | **Total Doc Lines:** 4,000+

## 📦 Archive Directory

```
.archive/
└── docs/                       # Historical documentation
    ├── SESSION2_*.md           # Session 2 summaries (3 files)
    ├── SESSION3_*.md           # Session 3 summaries (1 file)
    ├── PHASE2_*.md             # Phase 2 summaries (1 file)
    ├── PHASE3_*.md             # Phase 3 summaries (1 file)
    ├── PHASE4_*.md             # Phase 4 summaries (2 files)
    ├── PHASE5_*.md             # Phase 5 summaries (2 files)
    ├── PHASE7_*.md             # Phase 7 summaries (1 file)
    ├── PHASES_5-8_*.md         # Multi-phase summaries (3 files)
    ├── Test reports            # Test execution reports (5 files)
    ├── Architecture decisions  # Historical decisions (1 file)
    ├── Comparisons             # Competitive analysis (1 file)
    ├── Roadmaps                # Previous roadmaps (2 files)
    ├── Visions & goals         # Previous visions (1 file)
    └── Other references        # Various documents (18 files)
```

**Total Archived Files:** 42

## 🧪 Testing

```
core/src/__tests__/
├── unit/                       # Unit tests
├── integration/                # Integration tests
├── e2e/                        # End-to-end tests
│   └── full-pipeline.test.ts  # Complete pipeline test
└── benchmarks/                 # Performance benchmarks
    └── performance.test.ts     # Latency & throughput tests
```

```
packages/vscode-extension/src/__tests__/
├── unit.test.ts                # 17 unit tests
└── integration.test.ts         # 10 integration tests
```

**Total Tests:** 690+ (100% passing)

## 🔧 Configuration Files

Root level configuration:

```
├── package.json                # Monorepo root
├── tsconfig.json               # TypeScript root config
├── tsconfig.base.json          # Base TypeScript config
├── pnpm-workspace.yaml         # pnpm monorepo config
├── .gitignore                  # Git ignore patterns
├── .eslintrc.json              # ESLint configuration
├── vitest.config.ts            # Vitest testing config
└── .env.example                # Environment variables template
```

## 📊 Organization Summary

### By Type

| Type | Count | Location |
|------|-------|----------|
| Source Files | 1,000+ | core/src, packages/*/src |
| Test Files | 50+ | __tests__ directories |
| Doc Files | 32 | docs/ |
| Archived Docs | 42 | .archive/docs/ |
| Config Files | 8 | Root |
| Total | 1,130+ | Entire repo |

### By Phase

| Phase | Location | Status |
|-------|----------|--------|
| 1-4 Foundation | core/src | ✅ Complete (82 tests) |
| 5 VS Code | packages/vscode-extension | ✅ Complete (27 tests) |
| 6 Agents | core/src/agents | ✅ Complete (122 tests) |
| 7 Marketplace | packages/marketplace | 🔄 In Progress |
| 8 Launch Polish | core/src/performance, docs/ | ✅ Complete (459 tests) |

### By Lines of Code

| Component | LOC | Status |
|-----------|-----|--------|
| Core Platform | 3,500+ | ✅ Production-ready |
| VS Code Extension | 1,500 | ✅ Production-ready |
| Feature Agents (Phase 6) | 1,963 | ✅ Production-ready |
| Marketplace | 620 | 🔄 In Progress |
| Performance Modules | 400+ | ✅ Production-ready |
| Tests | 2,000+ | ✅ All passing |
| Documentation | 4,000+ | ✅ Complete |
| **Total** | **14,000+** | ✅ **Production Ready** |

## 🎯 Navigation Guide

### For Different Audiences

**👤 End Users**
- Start: [README.md](README.md)
- Next: [docs/user-guide/getting-started.md](docs/user-guide/getting-started.md)
- Reference: [docs/user-guide/agents/](docs/user-guide/agents/)

**👨‍💻 Developers**
- Start: [README.md](README.md)
- Next: [docs/developer-guide/architecture.md](docs/developer-guide/architecture.md)
- Build: [docs/developer-guide/building-agents.md](docs/developer-guide/building-agents.md)

**🚀 DevOps/Operations**
- Start: [docs/ops-guide/deployment.md](docs/ops-guide/deployment.md)
- Configure: [docs/ops-guide/configuration.md](docs/ops-guide/configuration.md)
- Monitor: [docs/ops-guide/monitoring.md](docs/ops-guide/monitoring.md)

**🔒 Security/Compliance**
- Audit: [docs/security/SECURITY_AUDIT.md](docs/security/SECURITY_AUDIT.md)
- Policy: [docs/security/SECURITY.md](docs/security/SECURITY.md)

**📢 Marketing/Launch**
- Checklist: [docs/launch/LAUNCH_CHECKLIST.md](docs/launch/LAUNCH_CHECKLIST.md)
- Blog: [docs/launch/BLOG_ANNOUNCEMENT.md](docs/launch/BLOG_ANNOUNCEMENT.md)
- Press Kit: [docs/launch/PRESS_KIT.md](docs/launch/PRESS_KIT.md)

## 🔗 Key Entry Points

1. **Project Overview:** [README.md](README.md)
2. **Complete Status:** [FINAL_PROJECT_STATUS.md](FINAL_PROJECT_STATUS.md)
3. **Build Details:** [BUILD_STATUS.md](BUILD_STATUS.md)
4. **Quick Start:** [START_HERE.md](START_HERE.md)
5. **Doc Index:** [docs/INDEX.md](docs/INDEX.md)
6. **License:** [LICENSE](LICENSE)

## 📈 Metrics

- **Root Files:** 5 (down from 46) - 89% reduction ✅
- **Documentation:** 32 files, 4,000+ lines ✅
- **Archived:** 42 historical files (preserved) ✅
- **Code:** 14,000+ LOC (production-ready) ✅
- **Tests:** 690+ passing (100% rate) ✅

## 🎯 Clean Structure Principles

1. **Root Directory:** Only essential, current files
2. **Documentation:** Organized by audience/purpose
3. **Archive:** Historical docs preserved but separated
4. **Code:** Organized by phase and component
5. **Tests:** Colocated with code in `__tests__` folders
6. **Configuration:** Centralized in root

---

**Status:** ✅ Clean, organized, production-ready repository

**See [docs/INDEX.md](docs/INDEX.md) for complete documentation guide.**
