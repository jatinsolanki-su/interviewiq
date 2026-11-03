-- ============================================================================
-- INTERVIEWIQ — COMPLETE POSTGRESQL DATABASE SCHEMA
-- Local-First AI Technical Interview Preparation Platform
-- ============================================================================

-- Step 1: Optional vector extension for semantic resume search (RAG)
-- Run this if pgvector is installed in your PostgreSQL server.
-- If not installed, resume search falls back to keyword/text chunk matching.
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    BEGIN
        CREATE EXTENSION IF NOT EXISTS vector;
    EXCEPTION
        WHEN undefined_file THEN
            RAISE NOTICE 'pgvector extension is not installed on this server. Proceeding with fallback mode.';
    END;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_voice VARCHAR(100) DEFAULT 'en-US-Standard-C',
    speech_rate NUMERIC(3,2) DEFAULT 1.0,
    auto_submit_seconds INT DEFAULT 0,
    dark_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_settings UNIQUE(user_id)
);

-- 3. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    parsed_text TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    missing_info JSONB DEFAULT '[]'::jsonb,
    suggested_interview_topics JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Resume Chunks Table (For RAG)
CREATE TABLE IF NOT EXISTS resume_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding JSONB, -- Stored as JSON array or vector(768) if extension active
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    job_role VARCHAR(255) NOT NULL,
    interview_type VARCHAR(50) DEFAULT 'Technical',
    difficulty VARCHAR(50) DEFAULT 'Intermediate',
    experience_level VARCHAR(50) DEFAULT 'Fresher / Entry-Level',
    duration_minutes INT DEFAULT 20,
    total_questions INT DEFAULT 5,
    topics JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, paused, completed, abandoned
    current_question_index INT DEFAULT 0,
    overall_score NUMERIC(4,2),
    technical_score NUMERIC(4,2),
    communication_score NUMERIC(4,2),
    reasoning_score NUMERIC(4,2),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Interview Questions Table
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'technical',
    skill_targeted VARCHAR(100),
    source VARCHAR(50) DEFAULT 'role_requirement', -- resume, previous_answer, role_requirement
    is_follow_up BOOLEAN DEFAULT FALSE,
    parent_question_id UUID REFERENCES interview_questions(id) ON DELETE SET NULL,
    follow_up_reason TEXT,
    expected_key_points JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Interview Answers Table (Voice Spoken Transcripts)
CREATE TABLE IF NOT EXISTS interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    audio_duration_seconds INT DEFAULT 0,
    speech_confidence NUMERIC(4,2) DEFAULT 0.95,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Answer Evaluations Table
CREATE TABLE IF NOT EXISTS answer_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES interview_answers(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    score NUMERIC(4,2) NOT NULL, -- 0.0 to 10.0
    technical_correctness NUMERIC(4,2),
    communication_quality NUMERIC(4,2),
    reasoning_depth NUMERIC(4,2),
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    missing_concepts JSONB DEFAULT '[]'::jsonb,
    incorrect_statements JSONB DEFAULT '[]'::jsonb,
    improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    ideal_answer TEXT,
    algorithmic_approach TEXT,
    time_complexity VARCHAR(100),
    space_complexity VARCHAR(100),
    edge_cases JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Evidence Tracking Table (USP: Evidence-Based Adaptive Interviewing)
CREATE TABLE IF NOT EXISTS skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(150) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'resume', 'candidate_answer', 'role_requirement'
    evidence_demonstrated TEXT,
    follow_up_questions_asked INT DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'Demonstrated', 'Partially demonstrated', 'Not demonstrated', 'Insufficient evidence'
    confidence_level VARCHAR(50) DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    evaluation_score NUMERIC(4,2),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_interview_skill UNIQUE(interview_id, skill_name)
);

-- 10. Interview Reports Table
CREATE TABLE IF NOT EXISTS interview_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID UNIQUE NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score NUMERIC(4,2) NOT NULL,
    technical_score NUMERIC(4,2) NOT NULL,
    communication_score NUMERIC(4,2) NOT NULL,
    reasoning_score NUMERIC(4,2) NOT NULL,
    summary TEXT,
    key_strengths JSONB DEFAULT '[]'::jsonb,
    key_weaknesses JSONB DEFAULT '[]'::jsonb,
    missing_core_concepts JSONB DEFAULT '[]'::jsonb,
    recommended_topics JSONB DEFAULT '[]'::jsonb,
    personalized_learning_plan JSONB DEFAULT '[]'::jsonb,
    skill_gap_summary JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Question Bank Table (Curated static repository across 14 categories)
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    difficulty VARCHAR(50) NOT NULL, -- Beginner, Intermediate, Advanced
    key_concepts JSONB DEFAULT '[]'::jsonb,
    sample_answer TEXT NOT NULL,
    hints JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Bookmarked Questions Table
CREATE TABLE IF NOT EXISTS bookmarked_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_bookmark UNIQUE(user_id, question_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_resume ON resume_chunks(resume_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_interview ON interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON interview_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_evals_interview ON answer_evaluations(interview_id);
CREATE INDEX IF NOT EXISTS idx_evidence_interview ON skill_evidence(interview_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON skill_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON interview_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_qb_category ON question_bank(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarked_questions(user_id);
