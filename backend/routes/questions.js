import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { evaluateAnswerAndGenerateFollowUp } from '../gemini.js';

const router = express.Router();

/**
 * POST /api/interviews/:id/answers
 * Submit spoken answer transcript, trigger Evidence-Based Adaptive evaluation,
 * update skill evidence, and generate follow-up or next question.
 */
router.post('/:id/answers', authenticateToken, async (req, res) => {
  try {
    const interviewId = req.params.id;
    const { question_id, transcript, audio_duration_seconds = 0, speech_confidence = 0.95 } = req.body;

    if (!question_id || !transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Valid spoken transcript and question ID are required.' });
    }

    // 1. Verify interview belongs to user
    const interviewRes = await query(
      'SELECT * FROM interviews WHERE id = $1 AND user_id = $2',
      [interviewId, req.user.id]
    );

    if (interviewRes.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const interview = interviewRes.rows[0];

    // 2. Fetch current question
    const questionRes = await query(
      'SELECT * FROM interview_questions WHERE id = $1 AND interview_id = $2',
      [question_id, interviewId]
    );

    if (questionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const currentQuestion = questionRes.rows[0];

    // 3. Save spoken transcript answer in PostgreSQL
    const answerRes = await query(
      `INSERT INTO interview_answers (
        question_id, interview_id, transcript, audio_duration_seconds, speech_confidence
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [question_id, interviewId, transcript.trim(), audio_duration_seconds, speech_confidence]
    );

    const savedAnswer = answerRes.rows[0];

    // 4. Retrieve candidate resume context if linked
    let resumeContext = null;
    if (interview.resume_id) {
      const rRes = await query('SELECT * FROM resumes WHERE id = $1', [interview.resume_id]);
      if (rRes.rows.length > 0) resumeContext = rRes.rows[0];
    }

    // 5. Retrieve count of already asked questions for this interview
    const allQuestionsRes = await query(
      'SELECT id, is_follow_up FROM interview_questions WHERE interview_id = $1',
      [interviewId]
    );
    const totalAskedSoFar = allQuestionsRes.rows.length;

    // 6. Execute Evidence-Based Adaptive Evaluation via Gemini
    const evaluation = await evaluateAnswerAndGenerateFollowUp({
      questionText: currentQuestion.question_text,
      candidateAnswer: transcript.trim(),
      skillTargeted: currentQuestion.skill_targeted,
      questionOrder: currentQuestion.question_order,
      totalQuestions: interview.total_questions,
      resumeContext,
      isFollowUp: currentQuestion.is_follow_up
    });

    console.log('[Interview Evaluation]', {
  score: evaluation.score,
  next_action: evaluation.next_action,
  follow_up_question: evaluation.follow_up_question,
  next_question_text: evaluation.next_question_text,
  totalAskedSoFar,
  targetQuestions: interview.total_questions
});

    // 7. Store answer evaluation in PostgreSQL
    const evalRes = await query(
      `INSERT INTO answer_evaluations (
        answer_id, question_id, interview_id, score, technical_correctness,
        communication_quality, reasoning_depth, strengths, weaknesses,
        missing_concepts, incorrect_statements, improvement_suggestions,
        ideal_answer, algorithmic_approach, time_complexity, space_complexity, edge_cases
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        savedAnswer.id,
        currentQuestion.id,
        interviewId,
        evaluation.score,
        evaluation.technical_correctness,
        evaluation.communication_quality,
        evaluation.reasoning_depth,
        JSON.stringify(evaluation.strengths || []),
        JSON.stringify(evaluation.weaknesses || []),
        JSON.stringify(evaluation.missing_concepts || []),
        JSON.stringify(evaluation.incorrect_statements || []),
        JSON.stringify(evaluation.improvement_suggestions || []),
        evaluation.ideal_answer || '',
        evaluation.algorithmic_approach || null,
        evaluation.time_complexity || null,
        evaluation.space_complexity || null,
        JSON.stringify(evaluation.edge_cases || [])
      ]
    );

    const savedEval = evalRes.rows[0];

    // 8. Track skill evidence in PostgreSQL (USP requirement)
    const evidenceSkill = evaluation.evidence?.skill_name || currentQuestion.skill_targeted || 'Core Engineering';
    const evidenceStatus = evaluation.evidence?.status || 'Demonstrated';
    const evidenceConfidence = evaluation.evidence?.confidence_level || 'Medium';

    await query(
      `INSERT INTO skill_evidence (
        interview_id, user_id, skill_name, source, evidence_demonstrated,
        follow_up_questions_asked, status, confidence_level, evaluation_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (interview_id, skill_name) DO UPDATE SET
        evidence_demonstrated = EXCLUDED.evidence_demonstrated,
        follow_up_questions_asked = skill_evidence.follow_up_questions_asked + (CASE WHEN $6 > 0 THEN 1 ELSE 0 END),
        status = EXCLUDED.status,
        confidence_level = EXCLUDED.confidence_level,
        evaluation_score = EXCLUDED.evaluation_score,
        updated_at = CURRENT_TIMESTAMP`,
      [
        interviewId,
        req.user.id,
        evidenceSkill,
        currentQuestion.source || 'candidate_answer',
        evaluation.evidence?.evidence_demonstrated || 'Verbal explanation provided during technical questioning.',
        currentQuestion.is_follow_up ? 1 : 0,
        evidenceStatus,
        evidenceConfidence,
        evaluation.score
      ]
    );

    // 9. Determine next step: Adaptive follow-up vs New question vs Complete
    console.log('[Next Question Decision]', {
  currentQuestion: currentQuestion.question_order,
  totalAskedSoFar,
  targetQuestions: interview.total_questions,
  nextAction: evaluation.next_action
});
    let nextQuestion = null;
    let isFinished = false;

    // Check if we reached the maximum configured questions
    if (totalAskedSoFar >= interview.total_questions && evaluation.next_action !== 'follow_up') {
      isFinished = true;
    } else if (totalAskedSoFar >= (interview.total_questions + 2)) {
      // Hard cap to avoid endless interviews even with follow-ups
      isFinished = true;
    } else if (evaluation.next_action === 'follow_up' && evaluation.follow_up_question) {
      // Create adaptive follow-up question
      const nextOrder = currentQuestion.question_order + 1;
      const fqRes = await query(
        `INSERT INTO interview_questions (
          interview_id, question_order, question_text, question_type,
          skill_targeted, source, is_follow_up, parent_question_id, follow_up_reason, expected_key_points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          interviewId,
          nextOrder,
          evaluation.follow_up_question,
          'follow_up',
          evidenceSkill,
          'candidate_answer',
          true,
          currentQuestion.id,
          evaluation.follow_up_reason || 'Investigating technical claims and depth of understanding',
          JSON.stringify(['Detailed justification', 'Trade-off analysis', 'Edge-case handling'])
        ]
      );
      nextQuestion = fqRes.rows[0];
    } else if (evaluation.next_action === 'next_topic' && evaluation.next_question_text) {
      // Create next topic question
      const nextOrder = currentQuestion.question_order + 1;
      const nqRes = await query(
        `INSERT INTO interview_questions (
          interview_id, question_order, question_text, question_type,
          skill_targeted, source, is_follow_up, parent_question_id, expected_key_points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          interviewId,
          nextOrder,
          evaluation.next_question_text,
          'technical',
          evaluation.next_skill_targeted || 'Engineering Competency',
          'role_requirement',
          false,
          null,
          JSON.stringify(['Architectural approach', 'Operational constraints'])
        ]
      );
      nextQuestion = nqRes.rows[0];
    } else {
      isFinished = true;
    }

    return res.json({
      answer: savedAnswer,
      evaluation: savedEval,
      nextQuestion,
      isFinished
    });
  } catch (err) {
    console.error('[Answer Processing Error]:', err);
    return res.status(500).json({ error: 'Failed to process spoken answer evaluation.' });
  }
});

export default router;
