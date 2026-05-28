export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  parent_id: string | null;
  title: string;
  sort_order: number;
  children?: Module[];
  lessons?: Lesson[];
  quizzes?: Quiz[];
  assignments?: Assignment[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  text_content: string | null;
  sort_order: number;
  created_at: string;
  media?: LessonMedia[];
}

export interface LessonMedia {
  id: string;
  lesson_id: string;
  type: 'video_link' | 'file_upload' | 'external_url';
  source_provider: string | null;
  url: string;
  file_name: string | null;
  file_size: number | null;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  is_timed: boolean;
  duration_minutes: number;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  prompt: string;
  points: number;
  choices_json: string[] | null;
  correct_answer: string;
}

export interface Assignment {
  id: string;
  module_id: string;
  title: string;
  instructions: string | null;
  due_date: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}
