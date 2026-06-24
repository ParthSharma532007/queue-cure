// test.js
// Unit tests for Clinic Queue Manager state and wait time calculations

const assert = require('assert');

// We reproduce the exact logic used in server.js to calculate wait times:
function calculateWaitTimes(queue, serving, avgConsultationTimeSetting, actualConsultationTimes, now) {
  let avg = avgConsultationTimeSetting;
  if (actualConsultationTimes.length > 0) {
    const sum = actualConsultationTimes.reduce((a, b) => a + b, 0);
    avg = parseFloat((sum / actualConsultationTimes.length).toFixed(1));
  }

  let remainingTime = avg;
  if (serving && serving.calledAt) {
    const timeSpent = (now - serving.calledAt) / (60 * 1000);
    remainingTime = Math.max(1, avg - timeSpent); // Minimum 1 minute remaining
  } else if (!serving) {
    remainingTime = 0; // If no one is being served, first in line gets seen immediately
  }

  return queue.map((patient, index) => {
    let waitTime = 0;
    if (index === 0) {
      waitTime = Math.round(remainingTime);
    } else {
      waitTime = Math.round(remainingTime + index * avg);
    }
    return {
      ...patient,
      estimatedWait: waitTime
    };
  });
}

console.log('🧪 Starting automated mathematical unit checks...');

// Test 1: Default configuration (no active serving patient, no consultation logs)
try {
  const queue = [{ name: 'A', token: '01' }, { name: 'B', token: '02' }];
  const results = calculateWaitTimes(queue, null, 10, [], Date.now());
  
  assert.strictEqual(results[0].estimatedWait, 0, 'First patient wait should be 0 when nobody is being served');
  assert.strictEqual(results[1].estimatedWait, 10, 'Second patient wait should equal average target time');
  console.log('✅ Test 1 Passed: Correct wait times when no patient is currently being served.');
} catch (e) {
  console.error('❌ Test 1 Failed:', e.message);
  process.exit(1);
}

// Test 2: Serving active patient with default average target
try {
  const now = Date.now();
  // Patient C was called 4 minutes ago
  const serving = { name: 'C', token: '03', calledAt: now - (4 * 60 * 1000) }; 
  const queue = [{ name: 'A', token: '01' }, { name: 'B', token: '02' }];
  const results = calculateWaitTimes(queue, serving, 10, [], now);
  
  // Remaining time = avg (10) - time spent (4) = 6 minutes.
  // Patient 0 (index 0) estimatedWait = 6 minutes.
  // Patient 1 (index 1) estimatedWait = 6 + 10 = 16 minutes.
  assert.strictEqual(results[0].estimatedWait, 6, 'Patient 1 wait should be 6 mins');
  assert.strictEqual(results[1].estimatedWait, 16, 'Patient 2 wait should be 16 mins');
  console.log('✅ Test 2 Passed: Correct remaining wait calculations with active patient.');
} catch (e) {
  console.error('❌ Test 2 Failed:', e.message);
  process.exit(1);
}

// Test 3: Rolling average calculations based on real consultation durations
try {
  // Last 3 actual consultations took 8 mins, 6 mins, and 10 mins
  const actualConsultationTimes = [8, 6, 10]; // Avg = 8
  const now = Date.now();
  const serving = { name: 'C', token: '03', calledAt: now - (3 * 60 * 1000) }; // Called 3 mins ago
  const queue = [{ name: 'A', token: '01' }, { name: 'B', token: '02' }];
  
  const results = calculateWaitTimes(queue, serving, 15, actualConsultationTimes, now);
  
  // Rolling average = (8 + 6 + 10) / 3 = 8 mins. Setting (15) should be ignored.
  // Remaining time of serving = max(1, 8 - 3) = 5 mins.
  // Patient 0: 5 mins
  // Patient 1: 5 + 8 = 13 mins
  assert.strictEqual(results[0].estimatedWait, 5, 'Patient 1 wait should be 5 mins under rolling average of 8');
  assert.strictEqual(results[1].estimatedWait, 13, 'Patient 2 wait should be 13 mins under rolling average of 8');
  console.log('✅ Test 3 Passed: Correct rolling average wait calculations using historical data.');
} catch (e) {
  console.error('❌ Test 3 Failed:', e.message);
  process.exit(1);
}

console.log('🎉 All math tests passed successfully!');
process.exit(0);
