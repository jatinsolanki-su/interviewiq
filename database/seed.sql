-- ============================================================================
-- INTERVIEWIQ — CURATED QUESTION BANK SEED FILE
-- Real, original technical interview questions across 14 categories
-- ============================================================================

INSERT INTO question_bank (id, category, title, question, difficulty, key_concepts, sample_answer, hints)
VALUES
-- 1. JavaScript
(
    gen_random_uuid(),
    'JavaScript',
    'Event Loop and Asynchronous Execution',
    'Can you explain how the JavaScript event loop works, specifically distinguishing between the microtask queue and the macrotask (callback) queue?',
    'Intermediate',
    '["Event Loop", "Microtasks (Promises)", "Macrotasks (setTimeout)", "Call Stack", "Task Queue"]'::jsonb,
    'JavaScript is single-threaded. Synchronous code executes immediately on the Call Stack. When an asynchronous operation finishes, microtasks (like Promise callbacks, queueMicrotask, MutationObserver) are prioritized and emptied entirely after each task before the engine picks the next macrotask (like setTimeout, setInterval, I/O callbacks). This guarantees that microtasks resolve in the same tick without interleaving rendering.',
    '["Think about what happens when Promise.then and setTimeout(..., 0) run concurrently", "Mention the call stack emptying first"]'::jsonb
),
(
    gen_random_uuid(),
    'JavaScript',
    'Closures and Memory Leaks',
    'What is a closure in JavaScript, how does lexical scoping enable it, and in what scenarios can closures lead to unintended memory retention?',
    'Advanced',
    '["Lexical Scope", "Closures", "Garbage Collection", "Memory Leaks", "Reference Retention"]'::jsonb,
    'A closure is the combination of a function bundled together with references to its surrounding lexical environment. It allows an inner function to access an outer function scope even after the outer function has returned. Memory leaks occur if outer variables (especially large objects or DOM references) remain captured in long-lived closures, such as dangling event listeners or global caches that the garbage collector cannot sweep.',
    '["Consider functions returned from other functions that hold onto large objects", "Remember that closures retain their enclosing scope references"]'::jsonb
),

-- 2. React
(
    gen_random_uuid(),
    'React',
    'React Fiber Reconciliation and Virtual DOM',
    'How does React reconciler (Fiber) differ from the classic stack reconciler, and how does it prioritize urgent updates over background rendering?',
    'Advanced',
    '["Virtual DOM", "Fiber Tree", "Concurrent Rendering", "Scheduling", "Time Slicing"]'::jsonb,
    'Fiber broke down reconciliation into incremental units of work. While the old stack reconciler was synchronous and un-interruptible, Fiber allows work to be paused, aborted, or prioritized based on deadlines using a cooperative scheduling model (time slicing). Urgent user interactions (typing, clicking) receive immediate attention while non-urgent transitions can be deferred.',
    '["Mention work units and requestIdleCallback or the React Scheduler", "Compare interruptible units of work with synchronous recursion"]'::jsonb
),
(
    gen_random_uuid(),
    'React',
    'State Management Trade-offs: Redux vs Context API',
    'When would you choose Redux or Zustand over React Context API for global state, and what performance bottleneck does Context API introduce under high update frequencies?',
    'Intermediate',
    '["State Management", "Redux", "Zustand", "Context API", "Unnecessary Re-renders"]'::jsonb,
    'React Context is meant for low-frequency global values like themes or authenticated user identities. When a Context provider updates, all consuming components re-render unless sliced manually. Redux and Zustand provide fine-grained selector subscriptions, allowing components to re-render only when the exact slice of selected state changes, plus middleware support for async logging and devtools.',
    '["Focus on selector subscriptions vs full subtree re-renders", "Contrast high-frequency updates with low-frequency config changes"]'::jsonb
),

-- 3. Node.js
(
    gen_random_uuid(),
    'Node.js',
    'Event Loop Phases and Libuv Thread Pool',
    'Describe the phases of the Node.js event loop and explain what tasks are offloaded to the libuv thread pool versus what is handled asynchronously by the OS kernel.',
    'Advanced',
    '["Libuv", "Thread Pool", "Timers Phase", "Poll Phase", "Check Phase (setImmediate)", "File I/O", "Crypto"]'::jsonb,
    'The Node.js event loop operates across phases: Timers (setTimeout), Pending Callbacks, Idle/Prepare, Poll (incoming I/O), Check (setImmediate), and Close callbacks. Non-blocking network sockets are handled directly by the OS kernel via epoll/kqueue. In contrast, blocking file system I/O, DNS lookups, and CPU-bound crypto tasks (like bcrypt) are offloaded to the libuv thread pool (default 4 threads).',
    '["Differentiate network I/O from disk I/O and crypto operations", "Highlight UV_THREADPOOL_SIZE"]'::jsonb
),

-- 4. Java
(
    gen_random_uuid(),
    'Java',
    'JVM Memory Model and Garbage Collection',
    'Explain the Java Virtual Machine memory layout (Heap vs Stack, Young Generation vs Old/Tenured Generation) and how generational garbage collection works.',
    'Intermediate',
    '["JVM", "Heap vs Stack", "Young Gen (Eden, Survivor)", "Tenured Gen", "Minor GC vs Major GC"]'::jsonb,
    'In Java, the stack holds thread execution frames and primitive local variables, while the heap stores all instantiated objects. Generational garbage collection is based on the weak generational hypothesis: most objects die young. New objects are allocated in Eden. Surviving objects move between Survivor spaces (S0/S1) during Minor GC and are eventually promoted to the Old (Tenured) Generation after crossing an age threshold.',
    '["Mention Eden and Survivor spaces", "Explain the concept of object aging and promotion"]'::jsonb
),

-- 5. Python
(
    gen_random_uuid(),
    'Python',
    'Global Interpreter Lock (GIL) and Concurrency',
    'What is Python Global Interpreter Lock (GIL), what problem does it solve in CPython, and how do you achieve true CPU parallelism in Python applications?',
    'Intermediate',
    '["GIL", "CPython", "Reference Counting", "Multiprocessing vs Multithreading", "Asyncio"]'::jsonb,
    'The GIL is a mutex in CPython that protects access to Python objects, preventing multiple native threads from executing Python bytecodes simultaneously to avoid race conditions in reference counting memory management. For I/O-bound tasks, threading or asyncio works well as threads release the GIL during I/O. For CPU-bound tasks, developers use the multiprocessing module or process pools to bypass the GIL.',
    '["Differentiate CPU-bound vs I/O-bound concurrency in Python", "Explain the role of reference counting"]'::jsonb
),

-- 6. DSA (Data Structures & Algorithms)
(
    gen_random_uuid(),
    'DSA',
    'LRU Cache Design and Algorithmic Complexity',
    'How would you design a Least Recently Used (LRU) Cache that supports O(1) time complexity for both get and put operations? Which data structures would you combine?',
    'Advanced',
    '["LRU Cache", "Doubly Linked List", "Hash Map", "O(1) Access", "Eviction Policy"]'::jsonb,
    'An LRU Cache combines a Hash Map and a Doubly Linked List. The Hash Map provides O(1) key-to-node lookup. The Doubly Linked List maintains access ordering where the head holds the most recently accessed node and the tail holds the least recently used node. On a get or put, the accessed node is detached and moved to the head in O(1). When capacity is exceeded, the tail node is evicted from both the list and the map.',
    '["Why cannot an array provide O(1) removal from the middle?", "Doubly linked list allows O(1) splicing given a node pointer"]'::jsonb
),

-- 7. OOP (Object-Oriented Programming)
(
    gen_random_uuid(),
    'OOP',
    'SOLID Principles in Practice',
    'Walk through the SOLID principles with a concrete real-world software architecture example illustrating the Open/Closed and Dependency Inversion principles.',
    'Intermediate',
    '["SOLID", "Single Responsibility", "Open/Closed Principle", "Liskov Substitution", "Interface Segregation", "Dependency Inversion"]'::jsonb,
    'The Open/Closed principle states software entities should be open for extension but closed for modification. For example, a PaymentProcessor should delegate to an IPaymentGateway interface rather than if-else branches. When introducing Stripe or PayPal, you implement the interface without touching core processor code. Dependency Inversion dictates high-level modules should depend on abstractions (interfaces) rather than concrete implementations.',
    '["Use a payment processor or notification service example", "Demonstrate programming to an interface rather than a concrete class"]'::jsonb
),

-- 8. DBMS
(
    gen_random_uuid(),
    'DBMS',
    'ACID Properties and Transaction Isolation Levels',
    'Define the ACID properties and explain what anomalies (dirty reads, non-repeatable reads, phantom reads) occur under different SQL transaction isolation levels.',
    'Intermediate',
    '["ACID", "Atomicity", "Consistency", "Isolation", "Durability", "Isolation Levels", "Phantom Reads"]'::jsonb,
    'ACID ensures reliable database transactions: Atomicity (all-or-nothing), Consistency (integrity constraints preserved), Isolation (concurrent execution independence), Durability (committed changes persist). Isolation levels prevent anomalies: Read Uncommitted permits dirty reads; Read Committed prevents dirty reads; Repeatable Read prevents non-repeatable reads; Serializable prevents all anomalies including phantom reads by ordering transactions.',
    '["Map Read Committed, Repeatable Read, and Serializable to dirty read, non-repeatable read, and phantom read"]'::jsonb
),

-- 9. Operating Systems
(
    gen_random_uuid(),
    'Operating Systems',
    'Processes vs Threads and Context Switching',
    'Contrast a process and a thread. What happens during a CPU context switch between two threads in the same process versus two different processes?',
    'Intermediate',
    '["Process vs Thread", "Virtual Memory", "Page Tables", "TLB Cache", "Context Switch Overhead"]'::jsonb,
    'A process is an isolated execution environment with its own dedicated virtual address space, file descriptors, and security tokens. A thread is an execution unit within a process that shares memory and resources with sibling threads. Context switching between processes requires saving CPU registers and switching virtual memory page tables, invalidating the Translation Lookaside Buffer (TLB). Thread switches within the same process only save registers and stack pointers.',
    '["Mention address space and TLB flushing during process context switches"]'::jsonb
),

-- 10. Computer Networks
(
    gen_random_uuid(),
    'Computer Networks',
    'TCP Three-Way Handshake and Flow Control',
    'Explain the mechanics of the TCP 3-way handshake and describe how TCP sliding window and congestion avoidance (Slow Start, AIMD) prevent network congestion.',
    'Intermediate',
    '["TCP Handshake", "SYN/ACK", "Sliding Window", "Flow Control vs Congestion Control", "Slow Start", "AIMD"]'::jsonb,
    'The TCP 3-way handshake establishes a reliable connection: Client sends SYN with initial sequence number (ISN); Server replies with SYN-ACK; Client acknowledges with ACK. Flow control uses the receive window (rwnd) advertised by the receiver to prevent buffer overflow. Congestion control maintains a congestion window (cwnd), initiating Slow Start (exponential growth) until a threshold, followed by Additive Increase Multiplicative Decrease (AIMD).',
    '["Distinguish flow control (receiver buffer capacity) from congestion control (network path capacity)"]'::jsonb
),

-- 11. SQL
(
    gen_random_uuid(),
    'SQL',
    'B-Tree Indexing and Query Plan Optimization',
    'How does a B-Tree index accelerate SQL queries, when does a database optimizer decide on a sequential scan over an index scan, and what is a covering index?',
    'Intermediate',
    '["B-Tree", "Clustered vs Non-Clustered Index", "Index Scan vs Seq Scan", "EXPLAIN ANALYZE", "Covering Index"]'::jsonb,
    'A B-Tree index maintains a balanced, sorted tree of key values and row pointers, enabling O(log N) searches and range queries. The optimizer chooses a sequential scan when the table is small or when the query filters match a large percentage of total rows (low selectivity), where random disk seeks exceed sequential block reads. A covering index contains all columns requested in the SELECT and WHERE clauses, allowing an Index-Only scan without touching heap tables.',
    '["Discuss selectivity and disk I/O seek costs", "Explain Index-Only scan with a covering index"]'::jsonb
),

-- 12. System Design
(
    gen_random_uuid(),
    'System Design',
    'Designing a Scalable Rate Limiter',
    'How would you design a distributed rate limiter for an API receiving 100,000 requests per second? Compare Token Bucket, Leaky Bucket, and Sliding Window algorithms.',
    'Advanced',
    '["Rate Limiter", "Token Bucket", "Sliding Window Log / Counter", "Redis", "Distributed Concurrency", "Race Conditions"]'::jsonb,
    'A distributed rate limiter can be implemented using Redis with sliding window counters or token buckets. The Token Bucket algorithm allows bursts up to bucket capacity while refilling at a steady rate. In distributed environments, race conditions between multiple API servers are mitigated by executing atomic Redis Lua scripts. For high throughput, a local in-memory cache with periodic batch synchronization can protect Redis from saturation.',
    '["Compare token bucket vs sliding window counter", "Highlight atomic operations in Redis via Lua scripts"]'::jsonb
),

-- 13. HR
(
    gen_random_uuid(),
    'HR',
    'Handling Workplace Disagreements and Priorities',
    'Tell me about a time you disagreed with a senior engineer or product manager on a technical decision. How did you advocate for your point while maintaining team alignment?',
    'Beginner',
    '["Conflict Resolution", "Technical Communication", "Empathy", "Data-Driven Persuasion", "Commitment"]'::jsonb,
    'Focus on objective data and trade-offs rather than subjective preferences. Explain how you framed the problem around user impact, latency metrics, or engineering maintenance costs. Show that you listened actively to the counter-perspective, built a proof-of-concept to test assumptions, and adhered to the disagree-and-commit philosophy once a final team consensus was reached.',
    '["Use the STAR method: Situation, Task, Action, Result", "Emphasize emotional maturity and commitment to team success"]'::jsonb
),

-- 14. Behavioral
(
    gen_random_uuid(),
    'Behavioral',
    'Overcoming Critical Production Failures',
    'Describe a scenario where code you deployed introduced a serious bug or outage. What immediate steps did you take to mitigate the incident, and what preventative mechanisms did you institute?',
    'Intermediate',
    '["Incident Management", "Accountability", "Root Cause Analysis", "Blameless Postmortem", "Observability"]'::jsonb,
    'Demonstrate ownership and composure. The immediate priority is mitigating impact (reverting the deployment or toggling a feature flag), followed by transparent stakeholder communication. After stabilization, conduct a blameless postmortem to identify root causes (insufficient edge case testing, lack of canary deployment). Implement permanent automated checks such as integration regression tests and automated health-check rollbacks.',
    '["Emphasize taking responsibility without pointing fingers", "Highlight systematic fixes: automated rollbacks, alerting, and integration tests"]'::jsonb
);
