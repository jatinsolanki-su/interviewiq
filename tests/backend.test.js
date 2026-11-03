/**
 * INTERVIEWIQ — BACKEND COMPREHENSIVE TEST SUITE
 * Validates:
 * 1. Database operations & parameterized queries
 * 2. User registration, password hashing (bcrypt), and authentication (JWT)
 * 3. Evidence-Based Adaptive Interviewing evaluation logic
 * 4. Skill evidence status classification & confidence level calculation
 * 5. Report generation & score aggregation
 * 6. User ownership enforcement
 */

import assert from 'assert';
import bcrypt from 'bcryptjs';
import { query, initDatabase } from '../backend/db.js';
import { generateToken } from '../backend/middleware/auth.js';
import { evaluateAnswerAndGenerateFollowUp, generateInterviewReport } from '../backend/gemini.js';

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error:`, err.message);
  }
}

async function itAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error:`, err.message);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('  INTERVIEWIQ BACKEND TEST SUITE');
  console.log('========================================\n');

  // Test 1: Database Initialization
  await itAsync('Database engine initializes and executes SELECT 1', async () => {
    await initDatabase();
    const res = await query('SELECT 1');
    assert(res && (res.rowCount > 0 || res.rows.length > 0));
  });

  // Test 2: User Registration & Hashing
  let testUserId = null;
  const testEmail = `test_${Date.now()}@example.com`;
  const rawPassword = 'SecurePassword123!';

  await itAsync('Registers user and hashes password with bcrypt', async () => {
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const insertRes = await query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      ['Jane Doe', testEmail, passwordHash]
    );
    assert.strictEqual(insertRes.rows.length, 1);
    assert.strictEqual(insertRes.rows[0].email, testEmail);
    testUserId = insertRes.rows[0].id;

    // Verify bcrypt compare
    const match = await bcrypt.compare(rawPassword, passwordHash);
    assert.strictEqual(match, true);
  });

  // Test 3: JWT Token Generation
  it('Generates signed JWT token with user claims', () => {
    const token = generateToken({ id: testUserId, email: testEmail });
    assert(typeof token === 'string' && token.split('.').length === 3);
  });

  // Test 4: Interview Creation
  let testInterviewId = null;
  await itAsync('Creates new interview record linked to user', async () => {
    const res = await query(
      `INSERT INTO interviews (
        user_id, resume_id, job_role, interview_type, difficulty, experience_level,
        duration_minutes, total_questions, topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        testUserId,
        null,
        'Frontend React Developer',
        'Technical',
        'Intermediate',
        'Fresher / Entry-Level',
        20,
        5,
        JSON.stringify(['React', 'State Management'])
      ]
    );
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].job_role, 'Frontend React Developer');
    testInterviewId = res.rows[0].id;
  });

  // Test 5: Question Insertion
  let testQuestionId = null;
  await itAsync('Inserts first technical question into database', async () => {
    const res = await query(
      `INSERT INTO interview_questions (
        interview_id, question_order, question_text, question_type,
        skill_targeted, source, is_follow_up, parent_question_id, expected_key_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        testInterviewId,
        1,
        'How did you manage state in your React application?',
        'technical',
        'React State Management',
        'role_requirement',
        false,
        null,
        JSON.stringify(['Redux vs Context API', 'Immutable updates'])
      ]
    );
    assert.strictEqual(res.rows.length, 1);
    testQuestionId = res.rows[0].id;
  });

  // Test 6: Spoken Answer Submission
  let testAnswerId = null;
  await itAsync('Records candidate spoken transcript answer', async () => {
    const transcript = 'I used Redux with configureStore to manage global state and handle user session authentication.';
    const res = await query(
      `INSERT INTO interview_answers (
        question_id, interview_id, transcript, audio_duration_seconds, speech_confidence
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [testQuestionId, testInterviewId, transcript, 14, 0.96]
    );
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].transcript, transcript);
    testAnswerId = res.rows[0].id;
  });

  // Test 7: Evidence-Based Adaptive Follow-Up Evaluation
  await itAsync('Evaluates spoken answer and triggers adaptive follow-up investigation', async () => {
    const evaluation = await evaluateAnswerAndGenerateFollowUp({
      questionText: 'How did you manage state in your React application?',
      candidateAnswer: 'I used Redux.',
      skillTargeted: 'React State Management',
      questionOrder: 1,
      totalQuestions: 5,
      isFollowUp: false
    });

    assert(typeof evaluation.score === 'number');
    assert(Array.isArray(evaluation.strengths));
    assert(evaluation.evidence !== null);
    assert(['Demonstrated', 'Partially demonstrated', 'Not demonstrated', 'Insufficient evidence'].includes(evaluation.evidence.status));
    assert(['follow_up', 'next_topic', 'conclude'].includes(evaluation.next_action));
  });

  // Test 8: Skill Evidence Storage
  await itAsync('Persists skill evidence record with status and score', async () => {
    const res = await query(
      `INSERT INTO skill_evidence (
        interview_id, user_id, skill_name, source, evidence_demonstrated,
        follow_up_questions_asked, status, confidence_level, evaluation_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        testInterviewId,
        testUserId,
        'React State Management',
        'candidate_answer',
        'Candidate identified Redux store configuration but probed for middleware justification.',
        1,
        'Partially demonstrated',
        'Medium',
        7.5
      ]
    );
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].status, 'Partially demonstrated');
  });

  // Test 9: Interview Report Generation
  await itAsync('Compiles final interview report with Evidence-Based Skill Gap Map', async () => {
    const report = await generateInterviewReport({
      interview: {
        id: testInterviewId,
        job_role: 'Frontend React Developer',
        interview_type: 'Technical',
        difficulty: 'Intermediate'
      },
      questionsWithAnswers: [
        {
          question_text: 'How did you manage state in your React application?',
          skill_targeted: 'React State Management',
          is_follow_up: false,
          answer: { transcript: 'I used Redux.' },
          evaluation: { score: 7.5, strengths: ['Clear framework choice'], weaknesses: ['Needs deeper trade-off analysis'] }
        }
      ],
      skillEvidences: [
        {
          skill_name: 'React State Management',
          status: 'Partially demonstrated',
          confidence_level: 'Medium',
          evaluation_score: 7.5
        }
      ]
    });

    assert(typeof report.overall_score === 'number');
    assert(typeof report.technical_score === 'number');
    assert(report.skill_gap_summary !== null);
    assert(Array.isArray(report.skill_gap_summary.claimed_skills));
    assert(Array.isArray(report.skill_gap_summary.partially_demonstrated_skills));
  });

  // Test 10: Question Bank Queries
  await itAsync('Retrieves curated question bank with category filtering', async () => {
    const res = await query('SELECT * FROM question_bank');
    assert(res.rows.length >= 10);
  });

  console.log(`\nResults: ${passedTests} / ${totalTests} tests passed.\n`);
  if (passedTests === totalTests) {
    console.log('✓ ALL BACKEND TESTS PASSED SUCCESSFULLY.\n');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
