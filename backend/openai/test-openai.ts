import { openAIService } from './services/openai';
import { Turn } from './types/game';

// Test scenarios using new turn-based format
const TEST_SCENARIOS = {
  'simple_hint': [
    {
      type: 'encoder_hint' as const,
      content: 'It grows in gardens and is red when ripe'
    }
  ],
  'conversation_with_failed_guesses': [
    {
      type: 'encoder_hint' as const,
      content: 'It grows in gardens and is red when ripe'
    },
    {
      type: 'ai_analysis' as const,
      thinking: [
        'Garden reference suggests plant.',
        'Red color when ripe indicates fruit.',
        'Common garden fruits are likely.',
        'Tomato fits these characteristics.'
      ],
      guess: 'strawberry'
    },
    {
      type: 'decoder_guess' as const,
      guess: 'apple'
    },
    {
      type: 'encoder_hint' as const,
      content: 'It has seeds on the inside, not outside'
    }
  ],
  'multiple_rounds': [
    {
      type: 'encoder_hint' as const,
      content: 'You drink it hot in the morning'
    },
    {
      type: 'ai_analysis' as const,
      thinking: [
        'Hot morning drink suggests coffee.',
        'Could also be tea.',
        'Coffee is most common.',
        'Fits the description perfectly.'
      ],
      guess: 'coffee'
    },
    {
      type: 'decoder_guess' as const,
      guess: 'tea'
    },
    {
      type: 'encoder_hint' as const,
      content: 'It comes from beans that are roasted'
    },
    {
      type: 'ai_analysis' as const,
      thinking: [
        'Roasted beans clearly indicates coffee.',
        'Coffee beans are roasted.',
        'Previous hint also suggested coffee.',
        'This confirms it is coffee.'
      ],
      guess: 'coffee'
    },
    {
      type: 'decoder_guess' as const,
      guess: 'espresso'
    }
  ]
};

async function runTest(scenarioName: string, conversation: Turn[]) {
  console.log(`\n🧪 Testing Scenario: ${scenarioName}`);
  console.log('📝 Conversation length:', conversation.length, 'turns\n');

  try {
    // Call OpenAI service
    const startTime = Date.now();
    const response = await openAIService.analyzeConversation(conversation);
    const duration = Date.now() - startTime;

    console.log('✅ Response received in', duration, 'ms\n');
    console.log('AI Thinking:');
    response.thinking.forEach((thought, i) => {
      console.log(`${i + 1}. ${thought}`);
    });
    console.log('\nAI Guess:', response.guess);

    // Validate response structure
    console.log('\n🔍 Validating response structure...');
    console.log('- Thinking array length:', response.thinking.length === 4 ? '✅' : '❌', '(expected 4)');
    console.log('- Guess length:', response.guess.length >= 3 && response.guess.length <= 12 ? '✅' : '❌', `(${response.guess.length}/3-12 chars)`);
    console.log('- Guess is lowercase:', response.guess === response.guess.toLowerCase() ? '✅' : '❌', '(should be lowercase)');
    console.log('- Thinking sentence lengths:', response.thinking.every(t => t.split(' ').length <= 12) ? '✅' : '❌', '(max 12 words)');

    return true;
  } catch (error) {
    console.error(`❌ Test failed for scenario "${scenarioName}":`, error);
    return false;
  }
}

async function testOpenAIIntegration() {
  console.log('🚀 Starting OpenAI Integration Tests...\n');

  let passedTests = 0;
  const totalTests = Object.keys(TEST_SCENARIOS).length;

  for (const [name, conversation] of Object.entries(TEST_SCENARIOS)) {
    if (await runTest(name, conversation)) {
      passedTests++;
    }
    console.log('\n' + '-'.repeat(80) + '\n');
  }

  // Print summary
  console.log(`📊 Test Summary: ${passedTests}/${totalTests} scenarios passed\n`);

  // Exit with appropriate code
  if (passedTests !== totalTests) {
    console.error('❌ Some tests failed');
    process.exit(1);
  }

  console.log('✅ All tests passed successfully!');
}

// Run all tests
testOpenAIIntegration().catch(console.error); 