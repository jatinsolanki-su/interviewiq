import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateFirstQuestion, generateInterviewReport } from '../gemini.js';

const router = express.Router();

/**
 * POST /api/interviews
 * Configure and launch a new technical interview
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      job_role,
      interview_type = 'Technical',
      difficulty = 'Intermediate',
      experience_level = 'Fresher / Entry-Level',
      duration_minutes = 20,
      total_questions = 5,
      topics = [],
      resume_id = null
    } = req.body;

    if (!job_role) {
      return res.status(400).json({ error: 'Job role is required.' });
    }

    // Retrieve resume if specified
    let resumeContext = null;
    if (resume_id) {
      const resumeRes = await query(
        'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
        [resume_id, req.user.id]
      );
      if (resumeRes.rows.length > 0) {
        resumeContext = resumeRes.rows[0];
      }
    }

    // Insert interview in PostgreSQL
    const interviewRes = await query(
      `INSERT INTO interviews (
        user_id, resume_id, job_role, interview_type, difficulty,
        experience_level, duration_minutes, total_questions, topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.user.id,
        resumeContext ? resumeContext.id : null,
        job_role,
        interview_type,
        difficulty,
        experience_level,
        parseInt(duration_minutes, 10),
        parseInt(total_questions, 10),
        JSON.stringify(topics)
      ]
    );

    const interview = interviewRes.rows[0];

    // Seed claimed skills into skill_evidence if resume provided
    if (resumeContext && Array.isArray(resumeContext.skills)) {
      for (const skill of resumeContext.skills.slice(0, 10)) {
        await query(
          `INSERT INTO skill_evidence (
            interview_id, user_id, skill_name, source, evidence_demonstrated,
            follow_up_questions_asked, status, confidence_level, evaluation_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (interview_id, skill_name) DO NOTHING`,
          [
            interview.id,
            req.user.id,
            skill,
            'resume',
            'Claimed on uploaded resume; pending verbal demonstration in interview.',
            0,
            'Insufficient evidence',
            'Low',
            null
          ]
        );
      }
    }

    // Generate first question using Gemini
    // Generate first question using Gemini
console.log('[Interview] Starting first question generation...');
const geminiStart = Date.now();

const firstQ = await generateFirstQuestion(
  {
    jobRole: job_role,
    interviewType: interview_type,
    difficulty,
    experienceLevel: experience_level,
    topics
  },
  resumeContext
);

console.log(
  `[Interview] First question generated in ${Date.now() - geminiStart}ms`
);
console.log('[Interview] Generated question:', firstQ?.question_text);

    // Save first question in PostgreSQL
    const questionRes = await query(
      `INSERT INTO interview_questions (
        interview_id, question_order, question_text, question_type,
        skill_targeted, source, is_follow_up, parent_question_id, expected_key_points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        interview.id,
        1,
        firstQ.question_text,
        interview_type.toLowerCase(),
        firstQ.skill_targeted || 'Core Engineering',
        firstQ.source || (resumeContext ? 'resume' : 'role_requirement'),
        false,
        null,
        JSON.stringify(firstQ.expected_key_points || [])
      ]
    );

    return res.status(201).json({
      interview,
      currentQuestion: questionRes.rows[0]
    });
  } catch (err) {
    console.error('[Interview Creation Error]:', err);
    return res.status(500).json({ error: 'Failed to initialize interview.' });
  }
});

/**
 * GET /api/interviews/:id
 * Retrieve full interview state with all questions, answers, and evaluations
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const interviewRes = await query(
      'SELECT * FROM interviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (interviewRes.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const interview = interviewRes.rows[0];

    // Fetch questions
    const questionsRes = await query(
      'SELECT * FROM interview_questions WHERE interview_id = $1 ORDER BY question_order ASC',
      [interview.id]
    );

    // Fetch answers
    const answersRes = await query(
      'SELECT * FROM interview_answers WHERE interview_id = $1 ORDER BY submitted_at ASC',
      [interview.id]
    );

    // Fetch evaluations
    const evalsRes = await query(
      'SELECT * FROM answer_evaluations WHERE interview_id = $1 ORDER BY created_at ASC',
      [interview.id]
    );

    // Fetch evidence
    const evidenceRes = await query(
      'SELECT * FROM skill_evidence WHERE interview_id = $1 ORDER BY updated_at DESC',
      [interview.id]
    );

    // Merge answers and evals onto questions
    const questionsWithDetails = questionsRes.rows.map(q => {
      const answer = answersRes.rows.find(a => a.question_id === q.id);
      const evaluation = evalsRes.rows.find(e => e.question_id === q.id);
      return {
        ...q,
        answer: answer || null,
        evaluation: evaluation || null
      };
    });

    return res.json({
      interview,
      questions: questionsWithDetails,
      evidence: evidenceRes.rows
    });
  } catch (err) {
    console.error('[Interview Details Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch interview details.' });
  }
});

/**
 * POST /api/interviews/:id/pause
 */
router.post('/:id/pause', authenticateToken, async (req, res) => {
  try {
    await query(
      "UPDATE interviews SET status = 'paused' WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Interview paused' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to pause interview.' });
  }
});

/**
 * POST /api/interviews/:id/resume
 */
router.post('/:id/resume', authenticateToken, async (req, res) => {
  try {
    await query(
      "UPDATE interviews SET status = 'in_progress' WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Interview resumed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resume interview.' });
  }
});

/**
 * POST /api/interviews/:id/complete
 * Mark completed and generate comprehensive report
 */
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const interviewRes = await query(
      'SELECT * FROM interviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (interviewRes.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const interview = interviewRes.rows[0];

    // Fetch questions and answers
    const questionsRes = await query(
      'SELECT * FROM interview_questions WHERE interview_id = $1 ORDER BY question_order ASC',
      [interview.id]
    );
    const answersRes = await query(
      'SELECT * FROM interview_answers WHERE interview_id = $1',
      [interview.id]
    );
    const evalsRes = await query(
      'SELECT * FROM answer_evaluations WHERE interview_id = $1',
      [interview.id]
    );
    const evidenceRes = await query(
      'SELECT * FROM skill_evidence WHERE interview_id = $1',
      [interview.id]
    );

    const questionsWithDetails = questionsRes.rows.map(q => ({
      ...q,
      answer: answersRes.rows.find(a => a.question_id === q.id),
      evaluation: evalsRes.rows.find(e => e.question_id === q.id)
    }));

    // Fetch resume if linked
    let resumeContext = null;
    if (interview.resume_id) {
      const rRes = await query('SELECT * FROM resumes WHERE id = $1', [interview.resume_id]);
      if (rRes.rows.length > 0) resumeContext = rRes.rows[0];
    }

    // Generate comprehensive report via Gemini
    const reportData = await generateInterviewReport({
      interview,
      questionsWithAnswers: questionsWithDetails,
      skillEvidences: evidenceRes.rows,
      resumeContext
    });

    // Save report in PostgreSQL
    await query(
      `INSERT INTO interview_reports (
        interview_id, user_id, overall_score, technical_score,
        communication_score, reasoning_score, summary, key_strengths,
        key_weaknesses, missing_core_concepts, recommended_topics,
        personalized_learning_plan, skill_gap_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (interview_id) DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        technical_score = EXCLUDED.technical_score,
        communication_score = EXCLUDED.communication_score,
        reasoning_score = EXCLUDED.reasoning_score,
        summary = EXCLUDED.summary,
        key_strengths = EXCLUDED.key_strengths,
        key_weaknesses = EXCLUDED.key_weaknesses,
        missing_core_concepts = EXCLUDED.missing_core_concepts,
        recommended_topics = EXCLUDED.recommended_topics,
        personalized_learning_plan = EXCLUDED.personalized_learning_plan,
        skill_gap_summary = EXCLUDED.skill_gap_summary`,
      [
        interview.id,
        req.user.id,
        reportData.overall_score,
        reportData.technical_score,
        reportData.communication_score,
        reportData.reasoning_score,
        reportData.summary,
        JSON.stringify(reportData.key_strengths || []),
        JSON.stringify(reportData.key_weaknesses || []),
        JSON.stringify(reportData.missing_core_concepts || []),
        JSON.stringify(reportData.recommended_topics || []),
        JSON.stringify(reportData.personalized_learning_plan || []),
        JSON.stringify(reportData.skill_gap_summary || {})
      ]
    );

    // Update interview status and aggregate scores
    await query(
      `UPDATE interviews SET
        overall_score = $1,
        technical_score = $2,
        communication_score = $3,
        reasoning_score = $4,
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6`,
      [
  reportData.overall_score,
  reportData.technical_score,
  reportData.communication_score,
  reportData.reasoning_score,
  interview.id,
  req.user.id
]
    );

    return res.json({
      message: 'Interview completed and report generated',
      report: reportData
    });
  } catch (err) {
    console.error('[Interview Complete Error]:', err);
    return res.status(500).json({ error: 'Failed to complete interview and generate report.' });
  }
});

/**
 * GET /api/interviews
 * List interview history
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, job_role, interview_type, difficulty, overall_score,
              technical_score, communication_score, reasoning_score,
              status, started_at, completed_at, created_at
       FROM interviews
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({ interviews: result.rows });
  } catch (err) {
    console.error('[Interview History Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch interview history.' });
  }
});

/**
 * DELETE /api/interviews/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM interviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Interview not found or access denied.' });
    }

    return res.json({ message: 'Interview deleted successfully' });
  } catch (err) {
    console.error('[Interview Delete Error]:', err);
    return res.status(500).json({ error: 'Failed to delete interview.' });
  }
});

export default router;
