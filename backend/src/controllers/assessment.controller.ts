import { Response } from 'express';
import {
  QuizModel,
  QuizQuestionModel,
  QuizSubmissionModel,
  AssignmentModel,
  AssignmentSubmissionModel,
  NotificationModel,
} from '../models';
import { AuthRequest } from '../types';

export const QuizController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, isTimed, durationMinutes } = req.body;
      if (!title) {
        res.status(400).json({ success: false, message: 'Title is required' });
        return;
      }

      const quizId = await QuizModel.create({
        moduleId: req.params.moduleId,
        title,
        isTimed,
        durationMinutes,
      });

      res.status(201).json({ success: true, quizId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const quiz = await QuizModel.findById(req.params.quizId);
      if (!quiz) {
        res.status(404).json({ success: false, message: 'Quiz not found' });
        return;
      }
      res.json({ success: true, quiz });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      await QuizModel.update(req.params.quizId, req.body);
      res.json({ success: true, message: 'Quiz updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await QuizModel.delete(req.params.quizId);
      res.json({ success: true, message: 'Quiz deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Question management
  async addQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, prompt, points, choicesJson, correctAnswer } = req.body;
      if (!type || !prompt || correctAnswer === undefined) {
        res.status(400).json({ success: false, message: 'Type, prompt, and correctAnswer are required' });
        return;
      }

      const questionId = await QuizQuestionModel.create({
        quizId: req.params.quizId,
        type,
        prompt,
        points,
        choicesJson,
        correctAnswer: String(correctAnswer),
      });

      res.status(201).json({ success: true, questionId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      await QuizQuestionModel.update(req.params.questionId, req.body);
      res.json({ success: true, message: 'Question updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      await QuizQuestionModel.delete(req.params.questionId);
      res.json({ success: true, message: 'Question deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Submission & auto-grading
  async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        res.status(400).json({ success: false, message: 'Answers array is required' });
        return;
      }

      const quiz = await QuizModel.findById(req.params.quizId);
      if (!quiz || !quiz.questions) {
        res.status(404).json({ success: false, message: 'Quiz not found' });
        return;
      }

      // Auto-grade objective questions
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const question of quiz.questions) {
        totalPoints += question.points;
        const answer = answers.find((a: any) => a.questionId === question.id);

        if (answer) {
          if (question.type === 'mcq' || question.type === 'true_false') {
            // Compare answer index/value with correct_answer
            if (String(answer.value).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase()) {
              earnedPoints += question.points;
            }
          }
          // Short answer questions are not auto-graded (marked for manual review)
        }
      }

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= 50;

      const submissionId = await QuizSubmissionModel.create({
        quizId: req.params.quizId,
        studentId: req.user!.id,
        answersJson: answers,
        score,
      });

      res.json({
        success: true,
        submissionId,
        score: Math.round(score * 100) / 100,
        totalPoints,
        earnedPoints,
        passed,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const submissions = await QuizSubmissionModel.findByQuiz(req.params.quizId);
      res.json({ success: true, submissions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async gradeSubmission(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { score } = req.body;
      if (score === undefined) {
        res.status(400).json({ success: false, message: 'Score is required' });
        return;
      }

      await QuizSubmissionModel.updateGrade(req.params.submissionId, score, req.user!.id);
      res.json({ success: true, message: 'Submission graded' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export const AssignmentController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, instructions, dueDate } = req.body;
      if (!title || !dueDate) {
        res.status(400).json({ success: false, message: 'Title and dueDate are required' });
        return;
      }

      const assignmentId = await AssignmentModel.create({
        moduleId: req.params.moduleId,
        title,
        instructions,
        dueDate,
      });

      res.status(201).json({ success: true, assignmentId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assignment = await AssignmentModel.findById(req.params.assignmentId);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }
      res.json({ success: true, assignment });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      await AssignmentModel.update(req.params.assignmentId, req.body);
      res.json({ success: true, message: 'Assignment updated' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await AssignmentModel.delete(req.params.assignmentId);
      res.json({ success: true, message: 'Assignment deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { submissionText, fileUrl } = req.body;

      const submissionId = await AssignmentSubmissionModel.create({
        assignmentId: req.params.assignmentId,
        studentId: req.user!.id,
        submissionText,
        fileUrl,
      });

      res.status(201).json({ success: true, submissionId });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const submissions = await AssignmentSubmissionModel.findByAssignment(req.params.assignmentId);
      res.json({ success: true, submissions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMySubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const submissions = await AssignmentSubmissionModel.findByStudent(req.user!.id);
      res.json({ success: true, submissions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async grade(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { grade, feedback } = req.body;
      if (grade === undefined) {
        res.status(400).json({ success: false, message: 'Grade is required' });
        return;
      }

      await AssignmentSubmissionModel.grade(
        req.params.submissionId,
        grade,
        feedback || '',
        req.user!.id
      );

      res.json({ success: true, message: 'Submission graded' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export const NotificationController = {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit, offset } = req.query;
      const notifications = await NotificationModel.findByUser(
        req.user!.id,
        Number(limit) || 50,
        Number(offset) || 0
      );
      res.json({ success: true, notifications });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      await NotificationModel.markAsRead(req.params.notificationId, req.user!.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      await NotificationModel.markAllAsRead(req.user!.id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const count = await NotificationModel.countUnread(req.user!.id);
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
