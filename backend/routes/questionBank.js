import express from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/questions
 * Search and filter curated question bank
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;

    const questionsRes = await query('SELECT * FROM question_bank ORDER BY created_at ASC');
    let questions = questionsRes.rows;

    // Fetch user bookmarks
    const bookmarksRes = await query(
      'SELECT question_id FROM bookmarked_questions WHERE user_id = $1',
      [req.user.id]
    );
    const bookmarkedIds = new Set(bookmarksRes.rows.map(b => b.question_id));

    // Filter by category
    if (category && category !== 'All') {
      questions = questions.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'All') {
      questions = questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // Filter by search keyword
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      questions = questions.filter(q =>
        q.title.toLowerCase().includes(term) ||
        q.question.toLowerCase().includes(term) ||
        (Array.isArray(q.key_concepts) && q.key_concepts.some(k => k.toLowerCase().includes(term)))
      );
    }

    const enriched = questions.map(q => ({
      ...q,
      is_bookmarked: bookmarkedIds.has(q.id)
    }));

    return res.json({ questions: enriched });
  } catch (err) {
    console.error('[Question Bank Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve question bank.' });
  }
});

/**
 * POST /api/questions/:id/bookmark
 * Toggle question bookmark for authenticated user
 */
router.post('/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;

    // Check if currently bookmarked
    const checkRes = await query(
      'SELECT id FROM bookmarked_questions WHERE user_id = $1 AND question_id = $2',
      [req.user.id, questionId]
    );

    if (checkRes.rows.length > 0) {
      await query(
        'DELETE FROM bookmarked_questions WHERE user_id = $1 AND question_id = $2',
        [req.user.id, questionId]
      );
      return res.json({ is_bookmarked: false, message: 'Bookmark removed' });
    } else {
      await query(
        'INSERT INTO bookmarked_questions (user_id, question_id) VALUES ($1, $2)',
        [req.user.id, questionId]
      );
      return res.json({ is_bookmarked: true, message: 'Question bookmarked' });
    }
  } catch (err) {
    console.error('[Bookmark Error]:', err);
    return res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

/**
 * GET /api/questions/bookmarked
 * Fetch only bookmarked questions for user
 */
router.get('/bookmarked', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT q.*, b.created_at as bookmarked_at
       FROM bookmarked_questions b
       JOIN question_bank q ON b.question_id = q.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.json({ bookmarkedQuestions: result.rows.map(q => ({ ...q, is_bookmarked: true })) });
  } catch (err) {
    console.error('[Get Bookmarks Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch bookmarked questions.' });
  }
});

export default router;
