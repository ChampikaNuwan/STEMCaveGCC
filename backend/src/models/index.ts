import { query, execute } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Course, Module, Lesson, LessonMedia, Quiz, QuizQuestion, Assignment } from '../types';

export const CourseModel = {
  async create(data: { title: string; description?: string; teacherId: string }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO courses (id, title, description, teacher_id) VALUES (?, ?, ?, ?)',
      [id, data.title, data.description || null, data.teacherId]
    );
    return id;
  },

  async findAll(limit = 50, offset = 0): Promise<Course[]> {
    return query<any[]>('SELECT * FROM courses LIMIT ? OFFSET ?', [limit, offset]);
  },

  async findByTeacher(teacherId: string): Promise<Course[]> {
    return query<any[]>('SELECT * FROM courses WHERE teacher_id = ?', [teacherId]);
  },

  async findById(id: string): Promise<Course | null> {
    const rows = await query<any[]>('SELECT * FROM courses WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async update(id: string, data: { title?: string; description?: string }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (fields.length) {
      values.push(id);
      await execute(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM courses WHERE id = ?', [id]);
  },
};

export const ModuleModel = {
  async create(data: {
    courseId: string;
    parentId?: string | null;
    title: string;
    sortOrder?: number;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO modules (id, course_id, parent_id, title, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, data.courseId, data.parentId || null, data.title, data.sortOrder || 0]
    );
    return id;
  },

  async findByCourse(courseId: string): Promise<Module[]> {
    return query<any[]>(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order',
      [courseId]
    );
  },

  async findById(id: string): Promise<Module | null> {
    const rows = await query<any[]>('SELECT * FROM modules WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async getChildren(parentId: string): Promise<Module[]> {
    return query<any[]>(
      'SELECT * FROM modules WHERE parent_id = ? ORDER BY sort_order',
      [parentId]
    );
  },

  async update(id: string, data: { title?: string; sortOrder?: number; parentId?: string | null }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder); }
    if (data.parentId !== undefined) { fields.push('parent_id = ?'); values.push(data.parentId); }
    if (fields.length) {
      values.push(id);
      await execute(`UPDATE modules SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM modules WHERE id = ?', [id]);
  },

  // Recursive structure builder
  async getFullStructure(courseId: string): Promise<Module[]> {
    const modules = await this.findByCourse(courseId);

    // Separate top-level and children
    const moduleMap = new Map<string, Module>();
    const roots: Module[] = [];

    for (const mod of modules) {
      mod.children = [];
      mod.lessons = [];
      mod.quizzes = [];
      mod.assignments = [];
      moduleMap.set(mod.id, mod);
    }

    for (const mod of modules) {
      if (mod.parent_id && moduleMap.has(mod.parent_id)) {
        moduleMap.get(mod.parent_id)!.children!.push(mod);
      } else if (!mod.parent_id) {
        roots.push(mod);
      }
    }

    // Fetch lessons and quizzes for all modules
    const moduleIds = modules.map(m => m.id);
    if (moduleIds.length > 0) {
      const lessons = await LessonModel.findByModuleIds(moduleIds);
      const quizzes = await QuizModel.findByModuleIds(moduleIds);
      const assignments = await AssignmentModel.findByModuleIds(moduleIds);

      for (const lesson of lessons) {
        const mod = moduleMap.get(lesson.module_id);
        if (mod) mod.lessons!.push(lesson);
      }
      for (const quiz of quizzes) {
        const mod = moduleMap.get(quiz.module_id);
        if (mod) mod.quizzes!.push(quiz);
      }
      for (const assignment of assignments) {
        const mod = moduleMap.get(assignment.module_id);
        if (mod) mod.assignments!.push(assignment);
      }
    }

    return roots;
  },
};

export const LessonModel = {
  async create(data: {
    moduleId: string;
    title: string;
    textContent?: string;
    sortOrder?: number;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO lessons (id, module_id, title, text_content, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, data.moduleId, data.title, data.textContent || null, data.sortOrder || 0]
    );
    return id;
  },

  async findById(id: string): Promise<Lesson | null> {
    const rows = await query<any[]>('SELECT * FROM lessons WHERE id = ?', [id]);
    if (rows.length) {
      const media = await LessonMediaModel.findByLesson(id);
      rows[0].media = media;
    }
    return rows.length ? rows[0] : null;
  },

  async findByModule(moduleId: string): Promise<Lesson[]> {
    return query<any[]>('SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order', [moduleId]);
  },

  async findByModuleIds(moduleIds: string[]): Promise<Lesson[]> {
    if (!moduleIds.length) return [];
    const placeholders = moduleIds.map(() => '?').join(',');
    return query<any[]>(
      `SELECT * FROM lessons WHERE module_id IN (${placeholders}) ORDER BY sort_order`,
      moduleIds
    );
  },

  async update(id: string, data: { title?: string; textContent?: string; sortOrder?: number }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.textContent !== undefined) { fields.push('text_content = ?'); values.push(data.textContent); }
    if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder); }
    if (fields.length) {
      values.push(id);
      await execute(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM lessons WHERE id = ?', [id]);
  },
};

export const LessonMediaModel = {
  async create(data: {
    lessonId: string;
    type: 'video_link' | 'file_upload' | 'external_url';
    sourceProvider?: string | null;
    url: string;
    fileName?: string;
    fileSize?: number;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      `INSERT INTO lesson_media (id, lesson_id, type, source_provider, url, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.lessonId, data.type, data.sourceProvider || null, data.url, data.fileName || null, data.fileSize || null]
    );
    return id;
  },

  async findByLesson(lessonId: string): Promise<LessonMedia[]> {
    return query<any[]>('SELECT * FROM lesson_media WHERE lesson_id = ?', [lessonId]);
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM lesson_media WHERE id = ?', [id]);
  },
};

export const QuizModel = {
  async create(data: {
    moduleId: string;
    title: string;
    isTimed?: boolean;
    durationMinutes?: number;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO quizzes (id, module_id, title, is_timed, duration_minutes) VALUES (?, ?, ?, ?, ?)',
      [id, data.moduleId, data.title, data.isTimed || false, data.durationMinutes || 0]
    );
    return id;
  },

  async findById(id: string): Promise<Quiz | null> {
    const rows = await query<any[]>('SELECT * FROM quizzes WHERE id = ?', [id]);
    if (rows.length) {
      rows[0].questions = await QuizQuestionModel.findByQuiz(id);
    }
    return rows.length ? rows[0] : null;
  },

  async findByModule(moduleId: string): Promise<Quiz[]> {
    return query<any[]>('SELECT * FROM quizzes WHERE module_id = ?', [moduleId]);
  },

  async findByModuleIds(moduleIds: string[]): Promise<Quiz[]> {
    if (!moduleIds.length) return [];
    const placeholders = moduleIds.map(() => '?').join(',');
    return query<any[]>(
      `SELECT * FROM quizzes WHERE module_id IN (${placeholders})`,
      moduleIds
    );
  },

  async update(id: string, data: { title?: string; isTimed?: boolean; durationMinutes?: number }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.isTimed !== undefined) { fields.push('is_timed = ?'); values.push(data.isTimed); }
    if (data.durationMinutes !== undefined) { fields.push('duration_minutes = ?'); values.push(data.durationMinutes); }
    if (fields.length) {
      values.push(id);
      await execute(`UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM quizzes WHERE id = ?', [id]);
  },
};

export const QuizQuestionModel = {
  async create(data: {
    quizId: string;
    type: 'mcq' | 'true_false' | 'short_answer';
    prompt: string;
    points?: number;
    choicesJson?: string[] | null;
    correctAnswer: string;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      `INSERT INTO quiz_questions (id, quiz_id, type, prompt, points, choices_json, correct_answer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.quizId, data.type, data.prompt, data.points || 1,
       data.choicesJson ? JSON.stringify(data.choicesJson) : null, data.correctAnswer]
    );
    return id;
  },

  async findByQuiz(quizId: string): Promise<QuizQuestion[]> {
    const rows = await query<any[]>('SELECT * FROM quiz_questions WHERE quiz_id = ?', [quizId]);
    return rows.map(r => ({
      ...r,
      choices_json: r.choices_json ? JSON.parse(r.choices_json) : null,
    }));
  },

  async findById(id: string): Promise<QuizQuestion | null> {
    const rows = await query<any[]>('SELECT * FROM quiz_questions WHERE id = ?', [id]);
    if (rows.length) {
      rows[0].choices_json = rows[0].choices_json ? JSON.parse(rows[0].choices_json) : null;
    }
    return rows.length ? rows[0] : null;
  },

  async update(id: string, data: {
    type?: 'mcq' | 'true_false' | 'short_answer';
    prompt?: string;
    points?: number;
    choicesJson?: string[] | null;
    correctAnswer?: string;
  }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.prompt !== undefined) { fields.push('prompt = ?'); values.push(data.prompt); }
    if (data.points !== undefined) { fields.push('points = ?'); values.push(data.points); }
    if (data.choicesJson !== undefined) { fields.push('choices_json = ?'); values.push(JSON.stringify(data.choicesJson)); }
    if (data.correctAnswer !== undefined) { fields.push('correct_answer = ?'); values.push(data.correctAnswer); }
    if (fields.length) {
      values.push(id);
      await execute(`UPDATE quiz_questions SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM quiz_questions WHERE id = ?', [id]);
  },
};

export const QuizSubmissionModel = {
  async create(data: {
    quizId: string;
    studentId: string;
    answersJson: { questionId: string; value: string }[];
    score?: number | null;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO quiz_submissions (id, quiz_id, student_id, answers_json, score) VALUES (?, ?, ?, ?, ?)',
      [id, data.quizId, data.studentId, JSON.stringify(data.answersJson), data.score ?? null]
    );
    return id;
  },

  async findByQuizAndStudent(quizId: string, studentId: string): Promise<any[]> {
    return query<any[]>(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ? ORDER BY submitted_at DESC',
      [quizId, studentId]
    );
  },

  async findByQuiz(quizId: string): Promise<any[]> {
    return query<any[]>(
      `SELECT qs.*, u.username, u.email
       FROM quiz_submissions qs
       JOIN users u ON qs.student_id = u.id
       WHERE qs.quiz_id = ?
       ORDER BY qs.submitted_at DESC`,
      [quizId]
    );
  },

  async updateGrade(id: string, score: number, gradedBy: string): Promise<void> {
    await execute(
      'UPDATE quiz_submissions SET score = ?, graded_by = ? WHERE id = ?',
      [score, gradedBy, id]
    );
  },
};

export const AssignmentModel = {
  async create(data: {
    moduleId: string;
    title: string;
    instructions?: string;
    dueDate: string;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO assignments (id, module_id, title, instructions, due_date) VALUES (?, ?, ?, ?, ?)',
      [id, data.moduleId, data.title, data.instructions || null, data.dueDate]
    );
    return id;
  },

  async findById(id: string): Promise<Assignment | null> {
    const rows = await query<any[]>('SELECT * FROM assignments WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async findByModule(moduleId: string): Promise<Assignment[]> {
    return query<any[]>('SELECT * FROM assignments WHERE module_id = ?', [moduleId]);
  },

  async findByModuleIds(moduleIds: string[]): Promise<Assignment[]> {
    if (!moduleIds.length) return [];
    const placeholders = moduleIds.map(() => '?').join(',');
    return query<any[]>(
      `SELECT * FROM assignments WHERE module_id IN (${placeholders})`,
      moduleIds
    );
  },

  async update(id: string, data: {
    title?: string;
    instructions?: string;
    dueDate?: string;
  }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.instructions !== undefined) { fields.push('instructions = ?'); values.push(data.instructions); }
    if (data.dueDate !== undefined) { fields.push('due_date = ?'); values.push(data.dueDate); }
    if (fields.length) {
      values.push(id);
      await execute(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },

  async delete(id: string): Promise<void> {
    await execute('DELETE FROM assignments WHERE id = ?', [id]);
  },
};

export const AssignmentSubmissionModel = {
  async create(data: {
    assignmentId: string;
    studentId: string;
    submissionText?: string;
    fileUrl?: string;
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_text, file_url) VALUES (?, ?, ?, ?, ?)',
      [id, data.assignmentId, data.studentId, data.submissionText || null, data.fileUrl || null]
    );
    return id;
  },

  async findByAssignment(assignmentId: string): Promise<any[]> {
    return query<any[]>(
      `SELECT ass.*, u.username, u.email
       FROM assignment_submissions ass
       JOIN users u ON ass.student_id = u.id
       WHERE ass.assignment_id = ?
       ORDER BY ass.submitted_at DESC`,
      [assignmentId]
    );
  },

  async findByStudent(studentId: string): Promise<any[]> {
    return query<any[]>(
      'SELECT * FROM assignment_submissions WHERE student_id = ? ORDER BY submitted_at DESC',
      [studentId]
    );
  },

  async findById(id: string): Promise<any | null> {
    const rows = await query<any[]>('SELECT * FROM assignment_submissions WHERE id = ?', [id]);
    return rows.length ? rows[0] : null;
  },

  async grade(id: string, grade: number, feedback: string, gradedBy: string): Promise<void> {
    await execute(
      'UPDATE assignment_submissions SET grade = ?, feedback = ?, graded_by = ? WHERE id = ?',
      [grade, feedback, gradedBy, id]
    );
  },
};

export const NotificationModel = {
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success' | 'error';
  }): Promise<string> {
    const id = uuidv4();
    await execute(
      'INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [id, data.userId, data.title, data.message, data.type || 'info']
    );
    return id;
  },

  async findByUser(userId: string, limit = 50, offset = 0): Promise<any[]> {
    return query<any[]>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
  },

  async markAsRead(id: string, userId: string): Promise<void> {
    await execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  },

  async markAllAsRead(userId: string): Promise<void> {
    await execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
  },

  async countUnread(userId: string): Promise<number> {
    const rows = await query<any[]>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0]?.count || 0;
  },

  async broadcastToRole(role: string, title: string, message: string, type: string = 'info'): Promise<void> {
    const users = await query<any[]>('SELECT id FROM users WHERE role = ?', [role]);
    for (const user of users) {
      await this.create({ userId: user.id, title, message, type: type as any });
    }
  },
};
