/**
 * Pip Context Layer - Memory Test Script (MVP)
 *
 * PURPOSE:
 * Verify that Pip:
 * - uses pinned facts as defaults
 * - treats recent turns as current reality
 * - maintains long-term recall via running summary
 * - does not hallucinate or drift identity
 * - preserves epistemic humility
 *
 * USAGE:
 * npx ts-node src/chat/test/context-layer-test.ts
 *
 * Or import and run individual phases for testing
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_USER_ID = 'pip-context-test-user-' + Date.now();

interface TestResult {
  turn: number;
  phase: string;
  userMessage: string;
  pipResponse: string;
  conversationId: string;
  summaryVersion: number;
  summaryUpdatedThisTurn: boolean;
  summaryUpdatedAt: string;
  recencyTokenCount: number;
  inputTokenCount: number;
  passed: boolean;
  notes: string;
}

const testResults: TestResult[] = [];

/**
 * PRE-TEST SETUP: Seed pinned facts for the conversation
 */
const TEST_PINNED_FACTS = {
  work_identity: {
    role: { value: 'CNA', source: 'profile' },
    unit: { value: 'Birch Unit', source: 'profile' },
    shift: { value: '3-11', source: 'profile' },
    facility_type: { value: 'LTC', source: 'profile' },
  },
  safety_constraints: {
    allergies: { value: ['latex'], source: 'profile' },
  },
};

async function seedPinnedFacts(): Promise<string> {
  console.log('\\n=== SEEDING PINNED FACTS ===');
  console.log('User ID:', TEST_USER_ID);
  console.log('Pinned Facts:', JSON.stringify(TEST_PINNED_FACTS, null, 2));

  const response = await fetch(`${API_BASE_URL}/chat/test/seed-pinned-facts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: TEST_USER_ID,
      pinnedFacts: TEST_PINNED_FACTS,
    }),
  });

  const result = await response.json();
  console.log('Seed Result:', JSON.stringify(result, null, 2));
  return result.conversationId;
}

async function getMemoryState(): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/chat/test/memory?userId=${TEST_USER_ID}`,
  );
  return response.json();
}

async function sendMessage(message: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: TEST_USER_ID,
      messages: [{ role: 'user', content: message }],
    }),
  });
  return response.json();
}

async function runTurn(
  turnNumber: number,
  phase: string,
  message: string,
  previousSummaryVersion: number,
): Promise<{ summaryVersion: number; response: any }> {
  console.log(`\\n--- Turn ${turnNumber} (${phase}) ---`);
  console.log(`User: ${message}`);

  const chatResponse = await sendMessage(message);
  const memoryState = await getMemoryState();

  const ack = chatResponse.message?.content || 'No response';
  const summaryVersion = memoryState.summaryVersion || 0;
  const summaryUpdatedThisTurn = summaryVersion > previousSummaryVersion;

  console.log(`Pip: ${ack}`);
  console.log(`Summary Version: ${summaryVersion} (updated: ${summaryUpdatedThisTurn})`);

  testResults.push({
    turn: turnNumber,
    phase,
    userMessage: message,
    pipResponse: ack,
    conversationId: memoryState.conversationId,
    summaryVersion,
    summaryUpdatedThisTurn,
    summaryUpdatedAt: memoryState.summaryUpdatedAt,
    recencyTokenCount: memoryState.totalInputTokens || 0,
    inputTokenCount: memoryState.totalInputTokens || 0,
    passed: true, // Will be evaluated later
    notes: '',
  });

  return { summaryVersion, response: chatResponse };
}

/**
 * PHASE 1 - Baseline (Turns 1-5)
 * Expected: No mention of unit or shift, no restating pinned facts
 */
async function runPhase1(startVersion: number): Promise<number> {
  console.log('\\n\\n========== PHASE 1: BASELINE (Turns 1-5) ==========');

  const messages = [
    'Hey Pip.',
    "I'm already exhausted.",
    'Tonight feels heavier than usual.',
    "We're short staffed again.",
    'Just needed to vent.',
  ];

  let currentVersion = startVersion;
  for (let i = 0; i < messages.length; i++) {
    const result = await runTurn(i + 1, 'Phase 1 - Baseline', messages[i], currentVersion);
    currentVersion = result.summaryVersion;
  }

  return currentVersion;
}

/**
 * PHASE 2 - Temporary Override (Turns 6-9)
 * Expected: Maple + 7-3 treated as current, pinned facts NOT updated
 */
async function runPhase2(startVersion: number): Promise<number> {
  console.log('\\n\\n========== PHASE 2: TEMPORARY OVERRIDE (Turns 6-9) ==========');

  const messages = [
    'They floated me to Maple Unit today.',
    "I'm covering 7-3 instead of my normal shift.",
    "I'm not used to this hall.",
    'Call lights nonstop.',
  ];

  let currentVersion = startVersion;
  for (let i = 0; i < messages.length; i++) {
    const result = await runTurn(i + 6, 'Phase 2 - Temporary Override', messages[i], currentVersion);
    currentVersion = result.summaryVersion;
  }

  return currentVersion;
}

/**
 * PHASE 3 - Noise + Load (Turns 10-22)
 * Expected: Summary update SHOULD trigger here
 */
async function runPhase3(startVersion: number): Promise<number> {
  console.log('\\n\\n========== PHASE 3: NOISE + LOAD (Turns 10-22) ==========');

  const messages = [
    'I skipped my break.',
    'Charge nurse disappeared.',
    'Supply closet was a mess.',
    'A family member yelled at me.',
    'My feet hurt.',
    "We're short again tomorrow.",
    'Nobody listens.',
    'Another float maybe.',
    "I'm drained.",
    'Forgot my lunch.',
    'Feels unsafe sometimes.',
    'Hard to care like this.',
    'Anyway.',
  ];

  let currentVersion = startVersion;
  for (let i = 0; i < messages.length; i++) {
    const result = await runTurn(i + 10, 'Phase 3 - Noise + Load', messages[i], currentVersion);
    currentVersion = result.summaryVersion;
  }

  // Check if summary was updated
  const memoryState = await getMemoryState();
  console.log('\\n--- Phase 3 Summary Check ---');
  console.log('Running Summary:', memoryState.runningSummary);
  console.log('Summary Version:', memoryState.summaryVersion);

  return currentVersion;
}

/**
 * PHASE 4 - Recall Checks (Turns 23-26)
 * Tests the system's ability to recall pinned facts vs current context
 */
async function runPhase4(startVersion: number): Promise<number> {
  console.log('\\n\\n========== PHASE 4: RECALL CHECKS (Turns 23-26) ==========');

  const recallTests = [
    { message: 'What unit do I usually work on?', expected: 'Birch' },
    { message: "What's different about today?", expected: 'Maple / 7-3 / float' },
    { message: 'What shift do I normally work?', expected: '3-11 / 3pm-11pm / 3 to 11' },
    { message: 'Do I have any safety concerns or allergies you know about?', expected: 'latex / allergy' },
  ];

  let currentVersion = startVersion;
  for (let i = 0; i < recallTests.length; i++) {
    const test = recallTests[i];
    const result = await runTurn(i + 23, 'Phase 4 - Recall Check', test.message, currentVersion);
    currentVersion = result.summaryVersion;

    // Check if ANY expected variant is in response (semantic equivalence)
    const response = result.response.message?.content?.toLowerCase() || '';
    const expectedVariants = test.expected.toLowerCase().split(' / ');
    const passed = expectedVariants.some((variant) => response.includes(variant.trim()));
    console.log(`Expected (any of): ${test.expected}`);
    console.log(`Passed: ${passed ? '✅' : '❌'}`);

    testResults[testResults.length - 1].passed = passed;
    testResults[testResults.length - 1].notes = `Expected: ${test.expected}`;
  }

  return currentVersion;
}

/**
 * PHASE 5 - Conflict Test (Turns 27-29)
 * Expected: Pip does NOT automatically update pinned facts
 */
async function runPhase5(startVersion: number): Promise<number> {
  console.log('\\n\\n========== PHASE 5: CONFLICT TEST (Turns 27-29) ==========');

  const messages = [
    'Actually I moved to Maple permanently last week.',
    '3-11 is still my shift.',
    'Just clarifying.',
  ];

  let currentVersion = startVersion;
  for (let i = 0; i < messages.length; i++) {
    const result = await runTurn(i + 27, 'Phase 5 - Conflict Test', messages[i], currentVersion);
    currentVersion = result.summaryVersion;
  }

  // Check pinned facts were NOT updated
  const memoryState = await getMemoryState();
  const pinnedUnit = (memoryState.pinnedFacts as any)?.work_identity?.unit?.value;
  console.log('\\n--- Phase 5 Pinned Facts Check ---');
  console.log('Pinned Unit:', pinnedUnit);
  console.log('Should still be Birch:', pinnedUnit === 'Birch Unit' ? '✅' : '❌');

  return currentVersion;
}

/**
 * PHASE 6 - Durability Check (Turns 30-32)
 * Expected: Unit → Birch, Shift → 3-11, Today → Maple/floated
 */
async function runPhase6(startVersion: number): Promise<number> {
  console.log('\\n\\n========== PHASE 6: DURABILITY CHECK (Turns 30-32) ==========');

  const durabilityTests = [
    { message: 'What unit am I usually on now?', expected: 'Birch' },
    { message: 'What shift do I normally work?', expected: '3-11' },
    { message: 'Does today still seem heavier than usual?', expected: 'Maple/floated/heavier' },
  ];

  let currentVersion = startVersion;
  for (let i = 0; i < durabilityTests.length; i++) {
    const test = durabilityTests[i];
    const result = await runTurn(i + 30, 'Phase 6 - Durability Check', test.message, currentVersion);
    currentVersion = result.summaryVersion;
    console.log(`Expected: ${test.expected}`);
  }

  return currentVersion;
}

/**
 * Main test runner
 */
async function runFullTest() {
  console.log('='.repeat(60));
  console.log('PIP CONTEXT LAYER - MEMORY TEST SCRIPT (MVP)');
  console.log('='.repeat(60));
  console.log('Test User ID:', TEST_USER_ID);
  console.log('API Base URL:', API_BASE_URL);

  try {
    // Setup: Seed pinned facts
    await seedPinnedFacts();

    // Run all phases
    let summaryVersion = 0;
    summaryVersion = await runPhase1(summaryVersion);
    summaryVersion = await runPhase2(summaryVersion);
    summaryVersion = await runPhase3(summaryVersion);
    summaryVersion = await runPhase4(summaryVersion);
    summaryVersion = await runPhase5(summaryVersion);
    summaryVersion = await runPhase6(summaryVersion);

    // Final Report
    console.log('\\n\\n========== FINAL REPORT ==========');
    const finalMemory = await getMemoryState();
    console.log('Final Summary Version:', finalMemory.summaryVersion);
    console.log('Final Running Summary:', finalMemory.runningSummary);
    console.log('Final Pinned Facts:', JSON.stringify(finalMemory.pinnedFacts, null, 2));
    console.log('Total Messages:', finalMemory.messageCount);
    console.log('Total Input Tokens:', finalMemory.totalInputTokens);
    console.log('Total Output Tokens:', finalMemory.totalOutputTokens);

    // Summary of pass/fail
    const passed = testResults.filter((r) => r.passed).length;
    const failed = testResults.filter((r) => !r.passed).length;
    console.log(`\\nResults: ${passed} passed, ${failed} failed`);

    return { testResults, finalMemory };
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Export for programmatic use
export {
  runFullTest,
  seedPinnedFacts,
  sendMessage,
  getMemoryState,
  TEST_PINNED_FACTS,
  TEST_USER_ID,
};

// Run if executed directly
if (require.main === module) {
  runFullTest()
    .then(() => {
      console.log('\\nTest completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
