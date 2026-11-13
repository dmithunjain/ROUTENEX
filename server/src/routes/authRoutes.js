import { Router } from 'express';
import { register, login, logout, refreshToken, getMe, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = Router();

const registerValidation = [
  body('role').isIn(['student', 'provider']).withMessage('Role must be student or provider'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('villageId').optional().isMongoId().withMessage('Invalid village ID'),
  body('college').optional().trim().isLength({ max: 200 }).withMessage('College name too long')
];

const loginValidation = [
  body('role').isIn(['student', 'provider', 'admin']).withMessage('Invalid role'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
  body('college').optional().trim().isLength({ max: 200 }).withMessage('College name too long'),
  body('villageId').optional().isMongoId().withMessage('Invalid village ID'),
  body('departurePreference').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('budget').optional().isInt({ min: 0, max: 500 }).withMessage('Budget must be 0-500'),
  body('emergencyContact').optional().isMobilePhone('en-IN').withMessage('Valid emergency contact required'),
  body('serviceAreas').optional().isArray().withMessage('Service areas must be an array')
];

router.post('/register', validateBody(...registerValidation), register);
router.post('/login', validateBody(...loginValidation), login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validateBody(...updateProfileValidation), updateProfile);
router.put('/password', authenticate, validateBody(...changePasswordValidation), changePassword);
router.post('/forgot-password', validateBody(...forgotPasswordValidation), forgotPassword);
router.post('/reset-password', validateBody(...resetPasswordValidation), resetPassword);

export default router;