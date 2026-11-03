/**
 * Database connection layer for InterviewIQ.
 * Uses native PostgreSQL with 'pg' package.
 * Implements graceful local fallback store if PostgreSQL service is not yet started,
 * ensuring the web preview works immediately while allowing native PostgreSQL execution.
 */

import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// PostgreSQL pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'interviewiq',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool = null;
let useRealPostgres = false;

// In-memory / file-persisted local fallback store
const LOCAL_STORE_FILE = path.resolve(process.cwd(), '.local_db_store.json');

const localStore = {
  users: [],
  user_settings: [],
  resumes: [],
  resume_chunks: [],
  interviews: [],
  interview_questions: [],
  interview_answers: [],
  answer_evaluations: [],
  skill_evidence: [],
  interview_reports: [],
  question_bank: [],
  bookmarked_questions: []
};

// Seed static question bank into local store
function seedDefaultQuestions() {
  const seeds = [
    {
      id: '11111111-1111-1111-1111-111111111101',
      category: 'JavaScript',
      title: 'Event Loop and Asynchronous Execution',
      question: 'Can you explain how the JavaScript event loop works, specifically distinguishing between the microtask queue and the macrotask (callback) queue?',
      difficulty: 'Intermediate',
      key_concepts: ['Event Loop', 'Microtasks (Promises)', 'Macrotasks (setTimeout)', 'Call Stack'],
      sample_answer: 'JavaScript is single-threaded. Synchronous code executes immediately on the Call Stack. Microtasks (Promise callbacks, queueMicrotask) are prioritized and emptied entirely after each task before the engine picks the next macrotask (setTimeout, setInterval). This guarantees microtasks resolve without interleaving rendering.',
      hints: ['Think about what happens when Promise.then and setTimeout(..., 0) run concurrently']
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      category: 'JavaScript',
      title: 'Closures and Memory Leaks',
      question: 'What is a closure in JavaScript, how does lexical scoping enable it, and in what scenarios can closures lead to unintended memory retention?',
      difficulty: 'Advanced',
      key_concepts: ['Lexical Scope', 'Closures', 'Garbage Collection', 'Memory Leaks'],
      sample_answer: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment. Memory leaks occur if outer variables remain captured in long-lived closures like dangling event listeners or global caches that the garbage collector cannot sweep.',
      hints: ['Consider functions returned from other functions that hold onto large objects']
    },
    {
      id: '11111111-1111-1111-1111-111111111103',
      category: 'React',
      title: 'State Management Trade-offs: Redux vs Context API',
      question: 'When would you choose Redux or Zustand over React Context API for global state, and what performance bottleneck does Context API introduce under high update frequencies?',
      difficulty: 'Intermediate',
      key_concepts: ['State Management', 'Redux', 'Zustand', 'Context API', 'Re-renders'],
      sample_answer: 'React Context is meant for low-frequency global values like themes or auth user. When a Context provider updates, all consuming components re-render. Redux and Zustand provide fine-grained selector subscriptions, preventing unnecessary re-renders under high frequency.',
      hints: ['Focus on selector subscriptions vs full subtree re-renders']
    },
    {
      id: '11111111-1111-1111-1111-111111111104',
      category: 'React',
      title: 'React Fiber Reconciliation and Virtual DOM',
      question: 'How does React reconciler (Fiber) differ from the classic stack reconciler, and how does it prioritize urgent updates over background rendering?',
      difficulty: 'Advanced',
      key_concepts: ['Virtual DOM', 'Fiber Tree', 'Concurrent Rendering', 'Scheduling'],
      sample_answer: 'Fiber broke down reconciliation into incremental units of work. While the old stack reconciler was synchronous, Fiber allows work to be paused, aborted, or prioritized based on deadlines using cooperative scheduling.',
      hints: ['Mention interruptible units of work and requestIdleCallback scheduling']
    },
    {
      id: '11111111-1111-1111-1111-111111111105',
      category: 'Node.js',
      title: 'Event Loop Phases and Libuv Thread Pool',
      question: 'Describe the phases of the Node.js event loop and explain what tasks are offloaded to the libuv thread pool versus what is handled asynchronously by the OS kernel.',
      difficulty: 'Advanced',
      key_concepts: ['Libuv', 'Thread Pool', 'Timers Phase', 'Poll Phase', 'File I/O'],
      sample_answer: 'Node.js event loop operates across Timers, Pending Callbacks, Poll, and Check phases. Non-blocking network sockets are handled by OS kernel via epoll/kqueue. Blocking file I/O, DNS lookups, and crypto tasks are offloaded to the libuv thread pool.',
      hints: ['Differentiate network I/O from disk I/O and crypto operations']
    },
    {
      id: '11111111-1111-1111-1111-111111111106',
      category: 'DSA',
      title: 'LRU Cache Design and Algorithmic Complexity',
      question: 'How would you design a Least Recently Used (LRU) Cache that supports O(1) time complexity for both get and put operations? Which data structures would you combine?',
      difficulty: 'Advanced',
      key_concepts: ['LRU Cache', 'Doubly Linked List', 'Hash Map', 'O(1) Access'],
      sample_answer: 'An LRU Cache combines a Hash Map and a Doubly Linked List. The Hash Map provides O(1) lookup. The Doubly Linked List maintains access order with most recent at head and least recent at tail. Removing and inserting nodes is O(1).',
      hints: ['Why cannot an array provide O(1) removal from the middle?']
    },
    {
      id: '11111111-1111-1111-1111-111111111107',
      category: 'DBMS',
      title: 'ACID Properties and Transaction Isolation Levels',
      question: 'Define the ACID properties and explain what anomalies occur under different SQL transaction isolation levels.',
      difficulty: 'Intermediate',
      key_concepts: ['ACID', 'Atomicity', 'Isolation Levels', 'Dirty Reads', 'Phantom Reads'],
      sample_answer: 'ACID guarantees Atomicity, Consistency, Isolation, and Durability. Isolation levels prevent anomalies: Read Uncommitted permits dirty reads; Read Committed prevents dirty reads; Repeatable Read prevents non-repeatable reads; Serializable prevents phantom reads.',
      hints: ['Map isolation levels to dirty read, non-repeatable read, and phantom read']
    },
    {
      id: '11111111-1111-1111-1111-111111111108',
      category: 'System Design',
      title: 'Designing a Scalable Rate Limiter',
      question: 'How would you design a distributed rate limiter for an API receiving 100,000 requests per second? Compare Token Bucket and Sliding Window algorithms.',
      difficulty: 'Advanced',
      key_concepts: ['Rate Limiter', 'Token Bucket', 'Sliding Window', 'Redis Lua Scripts'],
      sample_answer: 'A distributed rate limiter uses Redis with sliding window counters or token buckets. Race conditions between API servers are solved with atomic Redis Lua scripts.',
      hints: ['Consider memory consumption and burst traffic handling']
    },
    {
      id: '11111111-1111-1111-1111-111111111109',
      category: 'Python',
      title: 'Global Interpreter Lock (GIL) and Concurrency',
      question: 'What is Python Global Interpreter Lock (GIL), what problem does it solve in CPython, and how do you achieve true CPU parallelism in Python applications?',
      difficulty: 'Intermediate',
      key_concepts: ['GIL', 'CPython', 'Multiprocessing vs Multithreading', 'Reference Counting'],
      sample_answer: 'The GIL is a mutex in CPython that protects access to Python objects, preventing multiple native threads from executing bytecodes simultaneously. For CPU-bound tasks, developers use multiprocessing module or process pools to bypass the GIL.',
      hints: ['Differentiate CPU-bound vs I/O-bound concurrency in Python']
    },
    {
      id: '11111111-1111-1111-1111-111111111110',
      category: 'Java',
      title: 'JVM Memory Model and Generational Garbage Collection',
      question: 'Explain the Java Virtual Machine memory layout (Heap vs Stack, Young Generation vs Old Generation) and how generational garbage collection works.',
      difficulty: 'Intermediate',
      key_concepts: ['JVM', 'Heap vs Stack', 'Young Gen', 'Tenured Gen', 'Minor GC'],
      sample_answer: 'Stack holds thread execution frames and local variables. Heap stores objects. Generational GC leverages the weak generational hypothesis: new objects are allocated in Eden, survive Minor GC into Survivor spaces, and get promoted to Old Generation after reaching age threshold.',
      hints: ['Mention Eden, Survivor, and Tenured spaces']
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      category: 'OOP',
      title: 'SOLID Principles in Practice',
      question: 'Walk through the SOLID principles with a concrete real-world software architecture example illustrating Open/Closed and Dependency Inversion principles.',
      difficulty: 'Intermediate',
      key_concepts: ['SOLID', 'Open/Closed', 'Dependency Inversion', 'Interface Segregation'],
      sample_answer: 'Open/Closed: software should be open for extension, closed for modification. For example, a PaymentProcessor delegates to IPaymentGateway interface rather than if-else branches. Adding new gateways does not touch existing processor code.',
      hints: ['Use a payment gateway or notification provider example']
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      category: 'Operating Systems',
      title: 'Processes vs Threads and Context Switching',
      question: 'Contrast a process and a thread. What happens during a CPU context switch between two threads in the same process versus two different processes?',
      difficulty: 'Intermediate',
      key_concepts: ['Process vs Thread', 'Virtual Memory', 'TLB Cache', 'Context Switch Overhead'],
      sample_answer: 'A process is an isolated environment with its own address space. A thread shares memory with sibling threads. Process context switch requires saving registers and swapping page tables, invalidating the TLB cache. Thread switch only saves registers and stack pointer.',
      hints: ['Mention virtual address space and TLB cache invalidation']
    },
    {
      id: '11111111-1111-1111-1111-111111111113',
      category: 'Computer Networks',
      title: 'TCP Three-Way Handshake and Congestion Control',
      question: 'Explain the mechanics of the TCP 3-way handshake and describe how TCP sliding window and congestion avoidance prevent network congestion.',
      difficulty: 'Intermediate',
      key_concepts: ['TCP Handshake', 'SYN/ACK', 'Sliding Window', 'Flow Control', 'AIMD'],
      sample_answer: 'Handshake: SYN -> SYN-ACK -> ACK. Flow control uses receiver window (rwnd). Congestion control uses congestion window (cwnd) with Slow Start and Additive Increase Multiplicative Decrease (AIMD).',
      hints: ['Distinguish flow control from congestion control']
    },
    {
      id: '11111111-1111-1111-1111-111111111114',
      category: 'SQL',
      title: 'B-Tree Indexing and Query Plan Optimization',
      question: 'How does a B-Tree index accelerate SQL queries, when does a database optimizer decide on a sequential scan over an index scan, and what is a covering index?',
      difficulty: 'Intermediate',
      key_concepts: ['B-Tree', 'Index Scan', 'Sequential Scan', 'Covering Index', 'Selectivity'],
      sample_answer: 'A B-Tree enables O(log N) lookup. An optimizer chooses a sequential scan when table is small or selectivity is low (matches large % of rows). A covering index contains all requested columns, enabling Index-Only scan without touching heap tables.',
      hints: ['Explain Index-Only scan with a covering index']
    },
    {
      id: '11111111-1111-1111-1111-111111111115',
      category: 'HR',
      title: 'Handling Workplace Disagreements and Priorities',
      question: 'Tell me about a time you disagreed with a senior engineer or product manager on a technical decision. How did you advocate for your point while maintaining team alignment?',
      difficulty: 'Beginner',
      key_concepts: ['Conflict Resolution', 'Technical Communication', 'STAR Method', 'Alignment'],
      sample_answer: 'Focus on objective data and trade-offs. Frame the debate around user impact, latency metrics, or maintenance costs. Listen actively to counter-perspectives, build a proof-of-concept, and commit to team decisions.',
      hints: ['Use the STAR method: Situation, Task, Action, Result']
    },
    {
      id: '11111111-1111-1111-1111-111111111116',
      category: 'Behavioral',
      title: 'Overcoming Critical Production Failures',
      question: 'Describe a scenario where code you deployed introduced a serious bug or outage. What immediate steps did you take to mitigate the incident, and what preventative mechanisms did you institute?',
      difficulty: 'Intermediate',
      key_concepts: ['Incident Management', 'Accountability', 'Root Cause Analysis', 'Postmortem'],
      sample_answer: 'Demonstrate ownership and composure. Priority 1 is mitigating user impact (revert deployment or feature flag toggle). Communicate transparently, conduct a blameless postmortem, and institute automated regression tests and health-check rollbacks.',
      hints: ['Emphasize accountability and systematic prevention over blaming']
    }
  ];

  if (localStore.question_bank.length === 0) {
    localStore.question_bank = seeds;
  }
}

// Load store from disk if present
try {
  if (fs.existsSync(LOCAL_STORE_FILE)) {
    const data = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf8'));
    Object.assign(localStore, data);
  }
} catch (e) {
  // ignore
}
seedDefaultQuestions();

function persistLocalStore() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    // ignore
  }
}

// Initialize database connection
export async function initDatabase() {
  try {
    pool = new Pool(poolConfig);
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    useRealPostgres = true;
    console.log(`[Database] Successfully connected to PostgreSQL at ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
    return true;
  } catch (err) {
    useRealPostgres = false;
    console.warn(`[Database] Notice: PostgreSQL is not running or unreachable at ${poolConfig.host}:${poolConfig.port}.`);
    console.warn(`[Database] Operating in seamless local-first fallback mode. Your data is stored safely.`);
    console.warn(`[Database] To use native PostgreSQL on your machine, follow instructions in SETUP_LOCAL.txt.`);
    return false;
  }
}

/**
 * Universal query function.
 * When real PostgreSQL is connected, executes pool.query.
 * Otherwise, resolves against local in-memory/file store with high fidelity.
 */
export async function query(text, params = []) {
  if (useRealPostgres && pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (pgError) {
      console.error('[PostgreSQL Error]:', pgError.message);
      throw pgError;
    }
  }

  // --- Fallback In-Memory Engine ---
  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  // 1. SELECT 1 / health check
  if (lower === 'select 1') {
    return { rows: [{ '?column?': 1 }], rowCount: 1 };
  }

  // 2. USERS: INSERT INTO users
  if (lower.startsWith('insert into users')) {
    const [fullName, email, passwordHash] = params;
    const existing = localStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }
    const newUser = {
      id: crypto.randomUUID(),
      full_name: fullName,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.users.push(newUser);
    persistLocalStore();
    return { rows: [newUser], rowCount: 1 };
  }

  // 3. USERS: SELECT * FROM users WHERE email = $1
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where email =')) {
    const email = params[0]?.toLowerCase();
    const user = localStore.users.find(u => u.email === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 4. USERS: SELECT * FROM users WHERE id = $1
  if (lower.startsWith('select') && lower.includes('from users') && lower.includes('where id =')) {
    const id = params[0];
    const user = localStore.users.find(u => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 5. RESUMES: INSERT INTO resumes
  if (lower.startsWith('insert into resumes')) {
    const [userId, filename, filePath, fileSize, parsedText, skills, experience, education, projects, strengths, missingInfo, suggestedTopics] = params;
    const newResume = {
      id: crypto.randomUUID(),
      user_id: userId,
      filename,
      file_path: filePath,
      file_size: fileSize,
      parsed_text: parsedText,
      skills: typeof skills === 'string' ? JSON.parse(skills) : skills,
      experience: typeof experience === 'string' ? JSON.parse(experience) : experience,
      education: typeof education === 'string' ? JSON.parse(education) : education,
      projects: typeof projects === 'string' ? JSON.parse(projects) : projects,
      strengths: typeof strengths === 'string' ? JSON.parse(strengths) : strengths,
      missing_info: typeof missingInfo === 'string' ? JSON.parse(missingInfo) : missingInfo,
      suggested_interview_topics: typeof suggestedTopics === 'string' ? JSON.parse(suggestedTopics) : suggestedTopics,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.resumes.push(newResume);
    persistLocalStore();
    return { rows: [newResume], rowCount: 1 };
  }

  // 6. RESUMES: SELECT * FROM resumes WHERE user_id = $1
  if (lower.startsWith('select') && lower.includes('from resumes') && lower.includes('where user_id =')) {
    const userId = params[0];
    const userResumes = localStore.resumes
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: userResumes, rowCount: userResumes.length };
  }

  // 7. RESUMES: SELECT * FROM resumes WHERE id = $1
  if (lower.startsWith('select') && lower.includes('from resumes') && lower.includes('where id =')) {
    const id = params[0];
    const resume = localStore.resumes.find(r => r.id === id);
    return { rows: resume ? [resume] : [], rowCount: resume ? 1 : 0 };
  }

  // 8. RESUMES: DELETE FROM resumes WHERE id = $1 AND user_id = $2
  if (lower.startsWith('delete from resumes')) {
    const [id, userId] = params;
    const index = localStore.resumes.findIndex(r => r.id === id && r.user_id === userId);
    if (index !== -1) {
      localStore.resumes.splice(index, 1);
      localStore.resume_chunks = localStore.resume_chunks.filter(c => c.resume_id !== id);
      persistLocalStore();
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  // 9. RESUME CHUNKS: INSERT
  if (lower.startsWith('insert into resume_chunks')) {
    const [resumeId, userId, chunkIndex, chunkText, embedding] = params;
    const chunk = {
      id: crypto.randomUUID(),
      resume_id: resumeId,
      user_id: userId,
      chunk_index: chunkIndex,
      chunk_text: chunkText,
      embedding: embedding ? (typeof embedding === 'string' ? JSON.parse(embedding) : embedding) : null,
      created_at: new Date().toISOString()
    };
    localStore.resume_chunks.push(chunk);
    persistLocalStore();
    return { rows: [chunk], rowCount: 1 };
  }

  // 10. RESUME CHUNKS: SELECT FOR RESUME
  if (lower.startsWith('select') && lower.includes('from resume_chunks')) {
    const resumeId = params[0];
    const chunks = localStore.resume_chunks.filter(c => c.resume_id === resumeId);
    return { rows: chunks, rowCount: chunks.length };
  }

  // 11. INTERVIEWS: INSERT
  if (lower.startsWith('insert into interviews')) {
    const [userId, resumeId, jobRole, interviewType, difficulty, experienceLevel, durationMinutes, totalQuestions, topics] = params;
    const newInterview = {
      id: crypto.randomUUID(),
      user_id: userId,
      resume_id: resumeId || null,
      job_role: jobRole,
      interview_type: interviewType,
      difficulty,
      experience_level: experienceLevel,
      duration_minutes: durationMinutes,
      total_questions: totalQuestions,
      topics: typeof topics === 'string' ? JSON.parse(topics) : topics,
      status: 'in_progress',
      current_question_index: 0,
      overall_score: null,
      technical_score: null,
      communication_score: null,
      reasoning_score: null,
      started_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString()
    };
    localStore.interviews.push(newInterview);
    persistLocalStore();
    return { rows: [newInterview], rowCount: 1 };
  }

  // 12. INTERVIEWS: SELECT BY ID
  if (lower.startsWith('select') && lower.includes('from interviews') && lower.includes('where id =')) {
    const id = params[0];
    const interview = localStore.interviews.find(i => i.id === id);
    return { rows: interview ? [interview] : [], rowCount: interview ? 1 : 0 };
  }

  // 13. INTERVIEWS: SELECT BY USER_ID
  if (lower.startsWith('select') && lower.includes('from interviews') && lower.includes('where user_id =')) {
    const userId = params[0];
    const list = localStore.interviews
      .filter(i => i.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: list, rowCount: list.length };
  }

  // 14. INTERVIEWS: UPDATE STATUS / SCORES
  if (lower.startsWith('update interviews')) {
    const id = params[params.length - 1]; // usually id is last parameter in WHERE id = $...
    const interview = localStore.interviews.find(i => i.id === id);
    if (interview) {
      if (lower.includes('status = $1') && params.length === 2) {
        interview.status = params[0];
      }
      if (lower.includes('overall_score')) {
        // [overall, technical, communication, reasoning, status, completedAt, id]
        interview.overall_score = params[0];
        interview.technical_score = params[1];
        interview.communication_score = params[2];
        interview.reasoning_score = params[3];
        interview.status = params[4];
        interview.completed_at = params[5];
      }
      if (lower.includes('current_question_index')) {
        interview.current_question_index = params[0];
      }
      persistLocalStore();
      return { rows: [interview], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 15. INTERVIEWS: DELETE
  if (lower.startsWith('delete from interviews')) {
    const [id, userId] = params;
    const index = localStore.interviews.findIndex(i => i.id === id && i.user_id === userId);
    if (index !== -1) {
      localStore.interviews.splice(index, 1);
      localStore.interview_questions = localStore.interview_questions.filter(q => q.interview_id !== id);
      localStore.interview_answers = localStore.interview_answers.filter(a => a.interview_id !== id);
      localStore.answer_evaluations = localStore.answer_evaluations.filter(e => e.interview_id !== id);
      localStore.skill_evidence = localStore.skill_evidence.filter(ev => ev.interview_id !== id);
      localStore.interview_reports = localStore.interview_reports.filter(r => r.interview_id !== id);
      persistLocalStore();
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  // 16. QUESTIONS: INSERT INTO interview_questions
  if (lower.startsWith('insert into interview_questions')) {
    const [interviewId, order, text, type, skill, source, isFollowUp, parentId, followUpReason, expectedPoints] = params;
    const newQuestion = {
      id: crypto.randomUUID(),
      interview_id: interviewId,
      question_order: order,
      question_text: text,
      question_type: type || 'technical',
      skill_targeted: skill,
      source: source || 'role_requirement',
      is_follow_up: Boolean(isFollowUp),
      parent_question_id: parentId || null,
      follow_up_reason: followUpReason || null,
      expected_key_points: typeof expectedPoints === 'string' ? JSON.parse(expectedPoints) : (expectedPoints || []),
      created_at: new Date().toISOString()
    };
    localStore.interview_questions.push(newQuestion);
    persistLocalStore();
    return { rows: [newQuestion], rowCount: 1 };
  }

  // 17. QUESTIONS: SELECT FOR INTERVIEW
  if (lower.startsWith('select') && lower.includes('from interview_questions') && lower.includes('where interview_id =')) {
    const interviewId = params[0];
    const questions = localStore.interview_questions
      .filter(q => q.interview_id === interviewId)
      .sort((a, b) => a.question_order - b.question_order);
    return { rows: questions, rowCount: questions.length };
  }

  // 18. ANSWERS: INSERT INTO interview_answers
  if (lower.startsWith('insert into interview_answers')) {
    const [questionId, interviewId, transcript, duration, confidence] = params;
    const newAnswer = {
      id: crypto.randomUUID(),
      question_id: questionId,
      interview_id: interviewId,
      transcript,
      audio_duration_seconds: duration || 0,
      speech_confidence: confidence || 0.95,
      submitted_at: new Date().toISOString()
    };
    localStore.interview_answers.push(newAnswer);
    persistLocalStore();
    return { rows: [newAnswer], rowCount: 1 };
  }

  // 19. EVALUATIONS: INSERT INTO answer_evaluations
  if (lower.startsWith('insert into answer_evaluations')) {
    const [
      answerId, questionId, interviewId, score, tech, comm, reasoning,
      strengths, weaknesses, missing, incorrect, suggestions, ideal,
      algorithmicApproach, timeComplexity, spaceComplexity, edgeCases
    ] = params;

    const evaluation = {
      id: crypto.randomUUID(),
      answer_id: answerId,
      question_id: questionId,
      interview_id: interviewId,
      score: parseFloat(score),
      technical_correctness: parseFloat(tech),
      communication_quality: parseFloat(comm),
      reasoning_depth: parseFloat(reasoning),
      strengths: typeof strengths === 'string' ? JSON.parse(strengths) : (strengths || []),
      weaknesses: typeof weaknesses === 'string' ? JSON.parse(weaknesses) : (weaknesses || []),
      missing_concepts: typeof missing === 'string' ? JSON.parse(missing) : (missing || []),
      incorrect_statements: typeof incorrect === 'string' ? JSON.parse(incorrect) : (incorrect || []),
      improvement_suggestions: typeof suggestions === 'string' ? JSON.parse(suggestions) : (suggestions || []),
      ideal_answer: ideal,
      algorithmic_approach: algorithmicApproach || null,
      time_complexity: timeComplexity || null,
      space_complexity: spaceComplexity || null,
      edge_cases: typeof edgeCases === 'string' ? JSON.parse(edgeCases) : (edgeCases || []),
      created_at: new Date().toISOString()
    };
    localStore.answer_evaluations.push(evaluation);
    persistLocalStore();
    return { rows: [evaluation], rowCount: 1 };
  }

  // 20. SKILL EVIDENCE: UPSERT / INSERT
  if (lower.startsWith('insert into skill_evidence') || lower.startsWith('insert into skill_evidence')) {
    const [interviewId, userId, skillName, source, evidence, followUps, status, confidence, score, notes] = params;
    const existingIndex = localStore.skill_evidence.findIndex(
      e => e.interview_id === interviewId && e.skill_name.toLowerCase() === skillName.toLowerCase()
    );

    const record = {
      id: existingIndex !== -1 ? localStore.skill_evidence[existingIndex].id : crypto.randomUUID(),
      interview_id: interviewId,
      user_id: userId,
      skill_name: skillName,
      source: source || 'role_requirement',
      evidence_demonstrated: evidence || '',
      follow_up_questions_asked: parseInt(followUps || 0, 10),
      status: status || 'Insufficient evidence',
      confidence_level: confidence || 'Medium',
      evaluation_score: score !== null && score !== undefined ? parseFloat(score) : null,
      notes: notes || '',
      updated_at: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      localStore.skill_evidence[existingIndex] = record;
    } else {
      localStore.skill_evidence.push(record);
    }
    persistLocalStore();
    return { rows: [record], rowCount: 1 };
  }

  // 21. SKILL EVIDENCE: SELECT FOR INTERVIEW
  if (lower.startsWith('select') && lower.includes('from skill_evidence') && lower.includes('where interview_id =')) {
    const interviewId = params[0];
    const items = localStore.skill_evidence.filter(e => e.interview_id === interviewId);
    return { rows: items, rowCount: items.length };
  }

  // 22. SKILL EVIDENCE: SELECT FOR USER
  if (lower.startsWith('select') && lower.includes('from skill_evidence') && lower.includes('where user_id =')) {
    const userId = params[0];
    const items = localStore.skill_evidence.filter(e => e.user_id === userId);
    return { rows: items, rowCount: items.length };
  }

  // 23. REPORTS: INSERT / UPSERT
  if (lower.startsWith('insert into interview_reports')) {
    const [
      interviewId, userId, overallScore, techScore, commScore, reasoningScore,
      summary, strengths, weaknesses, missing, recommendedTopics, learningPlan, skillGapSummary
    ] = params;

    const report = {
      id: crypto.randomUUID(),
      interview_id: interviewId,
      user_id: userId,
      overall_score: parseFloat(overallScore),
      technical_score: parseFloat(techScore),
      communication_score: parseFloat(commScore),
      reasoning_score: parseFloat(reasoningScore),
      summary,
      key_strengths: typeof strengths === 'string' ? JSON.parse(strengths) : strengths,
      key_weaknesses: typeof weaknesses === 'string' ? JSON.parse(weaknesses) : weaknesses,
      missing_core_concepts: typeof missing === 'string' ? JSON.parse(missing) : missing,
      recommended_topics: typeof recommendedTopics === 'string' ? JSON.parse(recommendedTopics) : recommendedTopics,
      personalized_learning_plan: typeof learningPlan === 'string' ? JSON.parse(learningPlan) : learningPlan,
      skill_gap_summary: typeof skillGapSummary === 'string' ? JSON.parse(skillGapSummary) : skillGapSummary,
      created_at: new Date().toISOString()
    };

    const exIdx = localStore.interview_reports.findIndex(r => r.interview_id === interviewId);
    if (exIdx !== -1) {
      localStore.interview_reports[exIdx] = report;
    } else {
      localStore.interview_reports.push(report);
    }
    persistLocalStore();
    return { rows: [report], rowCount: 1 };
  }

  // 24. REPORTS: SELECT BY INTERVIEW ID
  if (lower.startsWith('select') && lower.includes('from interview_reports') && lower.includes('where interview_id =')) {
    const interviewId = params[0];
    const report = localStore.interview_reports.find(r => r.interview_id === interviewId);
    return { rows: report ? [report] : [], rowCount: report ? 1 : 0 };
  }

  // 25. QUESTION BANK: SELECT
  if (lower.startsWith('select') && lower.includes('from question_bank')) {
    let list = [...localStore.question_bank];
    if (params.length > 0 && lower.includes('where category =')) {
      list = list.filter(q => q.category.toLowerCase() === params[0].toLowerCase());
    }
    return { rows: list, rowCount: list.length };
  }

  // 26. BOOKMARKS: SELECT / INSERT / DELETE
  if (lower.startsWith('select') && lower.includes('from bookmarked_questions')) {
    const userId = params[0];
    const bookmarks = localStore.bookmarked_questions.filter(b => b.user_id === userId);
    return { rows: bookmarks, rowCount: bookmarks.length };
  }
  if (lower.startsWith('insert into bookmarked_questions')) {
    const [userId, questionId, notes] = params;
    const existing = localStore.bookmarked_questions.find(b => b.user_id === userId && b.question_id === questionId);
    if (existing) {
      return { rows: [existing], rowCount: 1 };
    }
    const bookmark = {
      id: crypto.randomUUID(),
      user_id: userId,
      question_id: questionId,
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    localStore.bookmarked_questions.push(bookmark);
    persistLocalStore();
    return { rows: [bookmark], rowCount: 1 };
  }
  if (lower.startsWith('delete from bookmarked_questions')) {
    const [userId, questionId] = params;
    const idx = localStore.bookmarked_questions.findIndex(b => b.user_id === userId && b.question_id === questionId);
    if (idx !== -1) {
      localStore.bookmarked_questions.splice(idx, 1);
      persistLocalStore();
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  // Default empty return
  return { rows: [], rowCount: 0 };
}

export function isUsingRealPostgres() {
  return useRealPostgres;
}
