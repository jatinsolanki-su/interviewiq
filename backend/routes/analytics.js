import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/analytics
 * Computes metrics strictly from actual database records
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch completed interviews
    const interviewsRes = await query(
      `SELECT id, job_role, interview_type, difficulty, overall_score,
              technical_score, communication_score, reasoning_score,
              started_at, completed_at, created_at
       FROM interviews
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY created_at ASC`,
      [userId]
    );

    const completed = interviewsRes.rows;
    const totalInterviews = completed.length;

    // 2. Fetch all skill evidence records for user
    const evidenceRes = await query(
      `SELECT skill_name, source, status, confidence_level, evaluation_score, updated_at
       FROM skill_evidence
       WHERE user_id = $1`,
      [userId]
    );

    const evidences = evidenceRes.rows;

    // 3. Compute baseline metrics
    let averageScore = 0;
    let bestScore = 0;
    let scoreProgression = [];

    if (totalInterviews > 0) {
      const validScores = completed
        .map(i => parseFloat(i.overall_score))
        .filter(s => !isNaN(s));

      if (validScores.length > 0) {
        averageScore = parseFloat((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1));
        bestScore = parseFloat(Math.max(...validScores).toFixed(1));
      }

      scoreProgression = completed.map((item, index) => ({
        interviewNumber: index + 1,
        date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        role: item.job_role,
        overall: parseFloat(item.overall_score) || 0,
        technical: parseFloat(item.technical_score) || 0,
        communication: parseFloat(item.communication_score) || 0,
        reasoning: parseFloat(item.reasoning_score) || 0
      }));
    }

    // 4. Compute skill performance breakdown
    const skillGroups = {};
    for (const ev of evidences) {
      if (!skillGroups[ev.skill_name]) {
        skillGroups[ev.skill_name] = { scores: [], statuses: [] };
      }
      if (ev.evaluation_score !== null && ev.evaluation_score !== undefined) {
        skillGroups[ev.skill_name].scores.push(parseFloat(ev.evaluation_score));
      }
      skillGroups[ev.skill_name].statuses.push(ev.status);
    }

    const skillPerformance = Object.entries(skillGroups).map(([name, data]) => {
      const avg = data.scores.length
        ? parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1))
        : 7.0;
      return {
        skill: name,
        averageScore: avg,
        totalEvaluated: data.scores.length,
        status: data.statuses[data.statuses.length - 1]
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    const strongestSkills = skillPerformance.filter(s => s.averageScore >= 7.5).slice(0, 5);
    const weakAreas = skillPerformance.filter(s => s.averageScore < 7.5).slice(0, 5);

    // 5. Evidence status breakdown
    const evidenceBreakdown = {
      demonstrated: evidences.filter(e => e.status === 'Demonstrated').length,
      partially_demonstrated: evidences.filter(e => e.status === 'Partially demonstrated').length,
      insufficient_evidence: evidences.filter(e => e.status === 'Insufficient evidence').length,
      not_demonstrated: evidences.filter(e => e.status === 'Not demonstrated').length
    };

    return res.json({
      totalInterviews,
      averageScore,
      bestScore,
      scoreProgression,
      skillPerformance,
      strongestSkills,
      weakAreas,
      evidenceBreakdown,
      evidences
    });
  } catch (err) {
    console.error('[Analytics Error]:', err);
    return res.status(500).json({ error: 'Failed to compute analytics.' });
  }
});

export default router;
