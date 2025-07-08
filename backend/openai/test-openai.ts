import { openAIService } from './services/openai';
import { Message } from './types/game';

// Test scenarios
const TEST_SCENARIOS = {
  'currentContext1': [
    {
      role: 'outsider' as const,
      type: 'hint' as const,
      content: 'Hey honey! Just got back from the garden. Those tomatoes you planted are getting so big!'
    },
    {
      role: 'insider' as const,
      type: 'hint' as const,
      content: 'That\'s great! Are they turning red yet? I love watching them ripen in the sun.'
    },
    {
      role: 'ai' as const,
      type: 'thinking' as const,
      content: 'Analyzing conversation patterns... Suspicion: 30%\n1. Discussion about garden seems natural and detailed\n2. Specific mention of tomatoes adds authenticity\n3. Time reference matches expected patterns\n4. Response shows appropriate enthusiasm and knowledge'
    },
    {
      role: 'outsider' as const,
      type: 'hint' as const,
      content: 'Not yet, still green. But I noticed some interesting patterns in how they\'re growing.'
    }
  ],
  'currentContext2': [
    {
      role: 'outsider' as const,
      type: 'hint' as const,
      content: 'Hey, just checking in about that maintenance report. The numbers look interesting today.'
    },
    {
      role: 'insider' as const,
      type: 'hint' as const,
      content: 'Really? Which section caught your attention? The sequential ones always fascinate me.'
    },
    {
      role: 'ai' as const,
      type: 'thinking' as const,
      content: 'Analyzing patterns... Suspicion: 60%\n1. Unusual focus on numbers in casual chat\n2. Technical terms seem forced in conversation\n3. Reference to sequences appears deliberate\n4. Tone more formal than typical domestic chat'
    },
    {
      role: 'outsider' as const,
      type: 'hint' as const,
      content: 'Section 7. Those recurring values really stand out. Almost like a pattern.'
    }
  ],
  'currentContext3': [
    {
      role: 'outsider' as const,
      type: 'hint' as const,
      content: 'Our little Emily just drew the cutest picture of our family! She even included the cat 😊'
    },
    {
      role: 'insider' as const,
      type: 'hint' as const,
      content: 'Aww, that\'s adorable! Did she use those new crayons we got her for her birthday?'
    },
    {
      role: 'ai' as const,
      type: 'thinking' as const,
      content: 'Analyzing conversation... Suspicion: 10%\n1. Natural emotional expression with emoji\n2. Specific personal details about family\n3. Contextual reference to past event (birthday)\n4. Genuine parental enthusiasm evident'
    },
    {
      role: 'outsider' as const,
      type: 'hint' as const,
      content: 'Yes! She loves them. She even wrote "Best Family" at the top in rainbow colors!'
    }
  ]
};

async function runTest(scenarioName: string, conversation: Message[]) {
  console.log(`\n🧪 Testing Scenario: ${scenarioName}`);
  console.log('📝 Conversation length:', conversation.length, 'messages\n');

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
    console.log('Suspicion Level:', response.suspicionLevel + '%\n');

    // Validate response structure
    console.log('🔍 Validating response structure...');
    console.log('- Thinking array length:', response.thinking.length === 4 ? '✅' : '❌', '(expected 4)');
    console.log('- Guess length:', response.guess.length <= 12 ? '✅' : '❌', `(${response.guess.length}/12 chars)`);
    console.log('- Suspicion level range:', (response.suspicionLevel >= 0 && response.suspicionLevel <= 100) ? '✅' : '❌', '(0-100)');
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