import { query, execute } from './database';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'teacher', 'student') NOT NULL,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  teacher_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36) NULL,
  title VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES modules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(36) PRIMARY KEY,
  module_id VARCHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  text_content LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_media (
  id VARCHAR(36) PRIMARY KEY,
  lesson_id VARCHAR(36) NOT NULL,
  type ENUM('video_link', 'file_upload', 'external_url') NOT NULL,
  source_provider ENUM('youtube', 'vimeo', 'local', 's3', 'other') NULL,
  url VARCHAR(512) NOT NULL,
  file_name VARCHAR(255) NULL,
  file_size INT NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(36) PRIMARY KEY,
  module_id VARCHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  is_timed BOOLEAN DEFAULT FALSE,
  duration_minutes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_questions (
  id VARCHAR(36) PRIMARY KEY,
  quiz_id VARCHAR(36) NOT NULL,
  type ENUM('mcq', 'true_false', 'short_answer') NOT NULL,
  prompt TEXT NOT NULL,
  points INT NOT NULL DEFAULT 1,
  choices_json JSON NULL,
  correct_answer TEXT NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_submissions (
  id VARCHAR(36) PRIMARY KEY,
  quiz_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  answers_json JSON NOT NULL,
  score DECIMAL(5,2) NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_by VARCHAR(36) NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(36) PRIMARY KEY,
  module_id VARCHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  instructions TEXT NULL,
  due_date DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id VARCHAR(36) PRIMARY KEY,
  assignment_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  submission_text TEXT NULL,
  file_url VARCHAR(512) NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade DECIMAL(5,2) NULL,
  feedback TEXT NULL,
  graded_by VARCHAR(36) NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export async function migrate(): Promise<void> {
  console.log('Running database migrations...');

  // Split by semicolons but preserve procedure/function bodies
  const statements = SCHEMA_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await execute(stmt);
    } catch (err: any) {
      if (err.code === 'ER_CANT_CREATE_TABLE' && err.sqlMessage?.includes('already exists')) {
        console.log('  Table already exists, skipping...');
      } else {
        console.error(`  Migration error: ${err.message}`);
        throw err;
      }
    }
  }

  console.log('Migrations completed successfully.');
}

// Run directly if called as script
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
