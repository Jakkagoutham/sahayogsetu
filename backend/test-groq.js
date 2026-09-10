const { classifyProblem, evaluateSolution } = require('./src/services/groqService');

async function test() {
  console.log('Testing Groq Classification...');
  const triage = await classifyProblem(
    'Frequent electrical transformer burning in farming belt',
    '3 phase power transformer fails every fortnight, burning water submersible motors for 30 farmers.',
    'Nagapattinam, Tamil Nadu'
  );
  console.log('Classification Result:', JSON.stringify(triage, null, 2));

  console.log('\nTesting Groq Solution Evaluation with 6-parameter SIH weightage...');
  const evaluation = await evaluateSolution(
    {
      title: 'Frequent electrical transformer burning in farming belt',
      description: '3 phase power transformer fails every fortnight',
      category: 'Agriculture',
      level: 'Mandal',
      maxResolutionDays: 15
    },
    {
      teamName: 'AgriVolt Pioneers',
      institution: 'PSG College of Technology, Coimbatore',
      description: 'IoT-based phase load balancing module with phase unbalance cut-off relay and automatic thermal oil level sensor with LoRaWAN transmission to local EB substation.',
      implementationTimeDays: 8,
      estimatedBudget: '₹ 18,500'
    }
  );
  console.log('Evaluation Result:', JSON.stringify(evaluation, null, 2));
}

test();
