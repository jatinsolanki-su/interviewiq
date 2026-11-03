import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/reports/:interviewId
 * Fetch full interview report and evidence breakdown
 */
router.get('/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Check ownership
    const reportRes = await query(
      `SELECT r.*, i.job_role, i.interview_type, i.difficulty, i.duration_minutes, i.completed_at
       FROM interview_reports r
       JOIN interviews i ON r.interview_id = i.id
       WHERE r.interview_id = $1 AND r.user_id = $2`,
      [interviewId, req.user.id]
    );

    if (reportRes.rows.length === 0) {
      return res.status(404).json({ error: 'Interview report not found.' });
    }

    const report = reportRes.rows[0];

    // Fetch questions with answers and evaluations
    const questionsRes = await query(
      `SELECT q.*,
              a.transcript, a.audio_duration_seconds, a.submitted_at,
              e.score, e.technical_correctness, e.communication_quality, e.reasoning_depth,
              e.strengths, e.weaknesses, e.missing_concepts, e.incorrect_statements,
              e.improvement_suggestions, e.ideal_answer, e.algorithmic_approach,
              e.time_complexity, e.space_complexity, e.edge_cases
       FROM interview_questions q
       LEFT JOIN interview_answers a ON q.id = a.question_id
       LEFT JOIN answer_evaluations e ON q.id = e.question_id
       WHERE q.interview_id = $1
       ORDER BY q.question_order ASC`,
      [interviewId]
    );

    // Fetch evidence records
    const evidenceRes = await query(
      `SELECT * FROM skill_evidence WHERE interview_id = $1 ORDER BY updated_at DESC`,
      [interviewId]
    );

    return res.json({
      report,
      questions: questionsRes.rows,
      evidence: evidenceRes.rows
    });
  } catch (err) {
    console.error('[Report Fetch Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve interview report.' });
  }
});

export default router;
