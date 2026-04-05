/**
 * Feature Development Command
 *
 * Structured 7-phase approach to feature development:
 * 1. Plan & Design
 * 2. Architecture Design
 * 3. Create Test Cases
 * 4. Implementation
 * 5. Testing
 * 6. Code Review
 * 7. Deployment
 */

import { CommandDefinition, CommandContext, CommandResult } from '../../../core/src/conversation/types';
import { CommunicationManager, WorkflowPhase, WorkflowCheckpoint } from '../../../core/src/guardrails/communication';

interface FeaturePlan {
  name: string;
  description: string;
  phase: number;
  tasks: string[];
  completed: boolean;
}

interface PhaseCheckpoint {
  number: number;
  name: string;
  criteriaMet: string[];
  blockers: string[];
  requiresApproval: boolean;
}

/**
 * Main feature-dev command
 */
export const featureDevCommand: CommandDefinition = {
  name: 'feature-dev',
  description: 'Start guided feature development workflow',
  aliases: ['feature', 'feat'],
  args: {
    name: {
      type: 'string',
      description: 'Feature name',
      required: true,
    },
    description: {
      type: 'string',
      description: 'Feature description',
      required: false,
    },
    phase: {
      type: 'number',
      description: 'Start from specific phase (1-7)',
      required: false,
      default: 1,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const featureName = args.name as string;
    const description = (args.description as string) || 'No description provided';
    const startPhase = (args.phase as number) || 1;
    const commManager = new CommunicationManager();

    context.output(`\n🚀 Starting Feature Development: ${featureName}\n`);
    context.output(`📝 Description: ${description}\n\n`);

    const phases = [
      {
        number: 1,
        name: 'Plan & Design',
        description: 'Define requirements and high-level design',
        questions: [
          'What problem does this feature solve?',
          'Who will use this feature?',
          'What are the key requirements?',
          'Are there any constraints or dependencies?',
        ],
        checkpoint: {
          number: 1,
          name: 'Requirements Approved',
          criteriaMet: [
            'Requirements document created',
            'Stakeholders consulted',
            'Success criteria defined',
          ],
          blockers: [] as string[],
          requiresApproval: true,
        },
      },
      {
        number: 2,
        name: 'Architecture Design',
        description: 'Design the technical architecture',
        questions: [
          'Which files/components need to be created?',
          'How will this integrate with existing code?',
          'What are the data models?',
          'What are the API contracts?',
        ],
        checkpoint: {
          number: 2,
          name: 'Architecture Design Approved',
          criteriaMet: [
            'Architecture diagram created',
            'Component structure defined',
            'Integration points documented',
          ],
          blockers: [] as string[],
          requiresApproval: true,
        },
      },
      {
        number: 3,
        name: 'Create Test Cases',
        description: 'Plan and create comprehensive tests',
        questions: [
          'What are the happy path scenarios?',
          'What edge cases need to be tested?',
          'What error conditions should be handled?',
          'What integration tests are needed?',
        ],
        checkpoint: {
          number: 3,
          name: 'Test Plan Reviewed',
          criteriaMet: [
            'Unit test cases written',
            'Integration test plan created',
            'Test coverage target defined',
          ],
          blockers: [] as string[],
          requiresApproval: false,
        },
      },
      {
        number: 4,
        name: 'Implementation',
        description: 'Write the actual feature code',
        questions: [
          'Should we start with core logic or UI?',
          'Are there external dependencies?',
          'What patterns should we follow?',
          'Do we need refactoring first?',
        ],
        checkpoint: {
          number: 4,
          name: 'Implementation Complete',
          criteriaMet: [
            'All code written',
            'No TypeScript errors',
            'All files follow conventions',
          ],
          blockers: [] as string[],
          requiresApproval: false,
        },
      },
      {
        number: 5,
        name: 'Testing',
        description: 'Run and validate all tests',
        questions: [
          'Are all tests passing?',
          'Is coverage sufficient?',
          'Have we tested edge cases?',
          'Do integration tests pass?',
        ],
        checkpoint: {
          number: 5,
          name: 'All Tests Passing',
          criteriaMet: [
            'Unit tests: 100% passing',
            'Integration tests: 100% passing',
            'Coverage: ≥80%',
          ],
          blockers: [] as string[],
          requiresApproval: false,
        },
      },
      {
        number: 6,
        name: 'Code Review',
        description: 'Get feedback and improve code quality',
        questions: [
          'Does code follow project conventions?',
          'Are there performance issues?',
          'Is documentation complete?',
          'Are there security concerns?',
        ],
        checkpoint: {
          number: 6,
          name: 'Code Review Approved',
          criteriaMet: [
            'Code quality: A- or better',
            'No security issues',
            'Documentation complete',
          ],
          blockers: [] as string[],
          requiresApproval: true,
        },
      },
      {
        number: 7,
        name: 'Deployment',
        description: 'Prepare for production deployment',
        questions: [
          'Is the feature complete and tested?',
          'Are there any breaking changes?',
          'Do we need database migrations?',
          'Is rollback strategy documented?',
        ],
        checkpoint: {
          number: 7,
          name: 'Ready for Production',
          criteriaMet: [
            'Feature complete and tested',
            'Release notes prepared',
            'Rollback plan documented',
          ],
          blockers: [] as string[],
          requiresApproval: true,
        },
      },
    ];

    // Display current phase and workflow with checkpoints
    context.output('📋 Feature Development Phases with Checkpoints:\n');

    for (const phase of phases) {
      const marker = phase.number < startPhase ? '✅' : phase.number === startPhase ? '▶️' : '⭕';
      const bold = phase.number === startPhase ? '\x1b[1m' : '';
      const reset = phase.number === startPhase ? '\x1b[0m' : '';

      context.output(`${marker} ${bold}Phase ${phase.number}: ${phase.name}${reset}`);
      context.output(`   ${phase.description}\n`);

      // Show checkpoint requirements
      if (phase.checkpoint) {
        const approvalTag = phase.checkpoint.requiresApproval ? '🔒' : '✓';
        context.output(`   ${approvalTag} Checkpoint: ${phase.checkpoint.name}\n`);
        context.output(`   Criteria:\n`);
        for (const criterion of phase.checkpoint.criteriaMet) {
          context.output(`     ◦ ${criterion}\n`);
        }
      }

      if (phase.number === startPhase) {
        context.output(`\n📌 Current Phase: ${phase.name}\n`);
        context.output('Key questions to consider:\n');
        for (const question of phase.questions) {
          context.output(`  • ${question}\n`);
        }
        context.output('\n');

        // Show checkpoint details
        if (phase.checkpoint && phase.checkpoint.requiresApproval) {
          context.output(`🔒 This phase requires approval before advancing.\n`);
          context.output(`   You'll need to confirm when all criteria are met.\n\n`);
        }
      }
    }

    context.output(`
🎯 Next Steps:

1. Review the current phase requirements above
2. Make decisions and implement
3. Track progress with /feature-status
4. Move to next phase when checkpoint criteria are met
5. Confirm phase completion to advance

Use the Main Agent to help with implementation:
- "Create the component for this feature"
- "Write tests for this functionality"
- "Review this code for issues"
- "Deploy this feature"

Phase Management:
- /feature-status              - Show current progress
- /feature-plan "Feature Name" - View detailed plan
- /feature-dev --phase ${startPhase + 1} - Advance to next phase (when approved)

Happy coding! 🚀
`);

    return {
      success: true,
      message: `Started feature development for: ${featureName}`,
      shouldContinueConversation: true,
    };
  },
};

/**
 * Feature status command
 */
export const featureStatusCommand: CommandDefinition = {
  name: 'feature-status',
  description: 'Show current feature development status',
  aliases: ['fstatus'],

  handler: async (args, context): Promise<CommandResult> => {
    context.output('\n📊 Feature Development Status\n');

    context.output(`
Current Feature: [Feature name from context]
Current Phase: 3/7 (Create Test Cases)
Progress: 42%

✅ Completed Phases:
  1. Plan & Design ............ [3 tasks]
  2. Architecture Design ....... [5 tasks]

▶️  In Progress:
  3. Create Test Cases ........ [2/7 tasks done]

⭕ Pending:
  4. Implementation
  5. Testing
  6. Code Review
  7. Deployment

🎯 Recent Activity:
  • Completed requirements document
  • Designed API contracts
  • Started writing unit tests

💡 Suggestions:
  • Continue with test creation
  • Review architecture with team
  • Start implementation this week
`);

    return {
      success: true,
      message: 'Feature status displayed',
      shouldContinueConversation: false,
    };
  },
};

/**
 * Feature plan command
 */
export const featurePlanCommand: CommandDefinition = {
  name: 'feature-plan',
  description: 'Create a detailed feature plan',
  aliases: ['fplan'],
  args: {
    feature: {
      type: 'string',
      description: 'Feature name',
      required: true,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const featureName = args.feature as string;

    context.output(`\n📝 Creating Feature Plan for: ${featureName}\n`);

    const plan = `
# Feature Plan: ${featureName}

## Overview
- **Status**: Planning
- **Priority**: Medium
- **Effort**: Medium (3-5 days)
- **Owner**: TBD

## Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

## Technical Design
### Architecture
- Components/modules to create
- Integration points
- Data models

### Implementation Details
- Key algorithms
- Performance considerations
- Error handling

## Testing Strategy
### Unit Tests
- Core logic tests
- Edge case handling

### Integration Tests
- Component interaction
- External API calls

### E2E Tests
- User workflows
- System behavior

## Acceptance Criteria
- [ ] All requirements met
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Security reviewed

## Timeline
- Phase 1 (Plan): 1 day
- Phase 2 (Design): 1 day
- Phase 3 (Tests): 1 day
- Phase 4 (Implement): 2 days
- Phase 5 (Test): 1 day
- Phase 6 (Review): 1 day
- Phase 7 (Deploy): 0.5 day

## Risks & Mitigation
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

## Dependencies
- [Dependency 1]
- [Dependency 2]

## Rollback Plan
[Describe rollback strategy]
`;

    context.output(plan);

    return {
      success: true,
      message: `Feature plan created for ${featureName}`,
      shouldContinueConversation: false,
    };
  },
};

export const featureDevCommands = [featureDevCommand, featureStatusCommand, featurePlanCommand];
