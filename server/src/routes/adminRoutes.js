import { Router } from 'express';
import {
  getDashboard,
  getStudents,
  toggleStudentStatus,
  getProviders,
  verifyProvider,
  toggleProviderStatus,
  getVillages,
  createVillage,
  updateVillage,
  deleteVillage,
  getStops,
  createStop,
  updateStop,
  deleteStop,
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAllRideRequests,
  getFinancials,
  getSystemHealth,
  getAuditLogs,
  sendNotification
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

const villageValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('block').optional().trim().isLength({ max: 100 }),
  body('district').optional().trim().isLength({ max: 100 }),
  body('coordinates').optional().isObject()
];

const stopValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('villageId').isMongoId().withMessage('Valid village ID required'),
  body('coordinates').optional().isObject(),
  body('isCollege').optional().isBoolean(),
  body('collegeName').optional().trim().isLength({ max: 200 }),
  body('facilities').optional().isArray()
];

const routeValidation = [
  body('code').trim().isLength({ min: 2, max: 20 }).matches(/^[A-Z0-9\-]+$/).withMessage('Code must be alphanumeric with dashes'),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('stops').isArray({ min: 2 }).withMessage('At least 2 stops required'),
  body('stops.*').isMongoId().withMessage('Invalid stop ID'),
  body('collegeStop').isMongoId().withMessage('Valid college stop required'),
  body('busId').optional().isMongoId(),
  body('distanceKm').optional().isFloat({ min: 0.1, max: 500 }),
  body('estimatedDuration').optional().isInt({ min: 1, max: 1440 }),
  body('isActive').optional().isBoolean()
];

const scheduleValidation = [
  body('routeId').isMongoId().withMessage('Valid route ID required'),
  body('busId').isMongoId().withMessage('Valid bus ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('departureTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid departure time (HH:MM)'),
  body('arrivalTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid arrival time (HH:MM)'),
  body('availableSeats').optional().isInt({ min: 1, max: 60 })
];

const notificationValidation = [
  body('userId').optional().isMongoId(),
  body('role').optional().isIn(['student', 'provider']),
  body('type').isIn([
    'ride_accepted', 'ride_rejected', 'ride_completed', 'ride_cancelled',
    'pool_match_found', 'pool_created', 'pool_cancelled', 'pool_ev_requested',
    'payment_initiated', 'payment_completed', 'payment_failed', 'refund_processed',
    'provider_verified', 'new_travel_request', 'schedule_change', 'system_announcement',
    'provider_activated', 'provider_deactivated'
  ]),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('message').trim().isLength({ min: 1, max: 1000 }),
  body('data').optional().isObject()
];

router.get('/dashboard', getDashboard);

router.get('/students', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ min: 1 }),
  query('villageId').optional().isMongoId(),
  query('isActive').optional().isBoolean()
), getStudents);

router.put('/students/:id/status', validateParams(
  param('id').isMongoId().withMessage('Invalid student ID')
), toggleStudentStatus);

router.get('/providers', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ min: 1 }),
  query('verified').optional().isBoolean(),
  query('isActive').optional().isBoolean()
), getProviders);

router.put('/providers/:id/verify', validateParams(
  param('id').isMongoId().withMessage('Invalid provider ID')
), verifyProvider);

router.put('/providers/:id/status', validateParams(
  param('id').isMongoId().withMessage('Invalid provider ID')
), toggleProviderStatus);

router.get('/villages', getVillages);
router.post('/villages', validateBody(...villageValidation), createVillage);
router.put('/villages/:id', validateParams(param('id').isMongoId()), validateBody(...villageValidation), updateVillage);
router.delete('/villages/:id', validateParams(param('id').isMongoId()), deleteVillage);

router.get('/stops', validateQuery(
  query('villageId').optional().isMongoId()
), getStops);
router.post('/stops', validateBody(...stopValidation), createStop);
router.put('/stops/:id', validateParams(param('id').isMongoId()), validateBody(...stopValidation), updateStop);
router.delete('/stops/:id', validateParams(param('id').isMongoId()), deleteStop);

router.get('/routes', getRoutes);
router.post('/routes', validateBody(...routeValidation), createRoute);
router.put('/routes/:id', validateParams(param('id').isMongoId()), validateBody(...routeValidation), updateRoute);
router.delete('/routes/:id', validateParams(param('id').isMongoId()), deleteRoute);

router.get('/schedules', validateQuery(
  query('routeId').optional().isMongoId(),
  query('status').optional().isIn(['scheduled', 'running', 'completed', 'cancelled']),
  query('date').optional().isISO8601()
), getSchedules);
router.post('/schedules', validateBody(...scheduleValidation), createSchedule);
router.put('/schedules/:id', validateParams(param('id').isMongoId()), validateBody(...scheduleValidation), updateSchedule);
router.delete('/schedules/:id', validateParams(param('id').isMongoId()), deleteSchedule);

router.get('/rides', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
  query('providerId').optional().isMongoId(),
  query('studentId').optional().isMongoId()
), getAllRideRequests);

router.get('/financials', validateQuery(
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
), getFinancials);

router.get('/system/health', getSystemHealth);
router.get('/audit-logs', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('action').optional().trim().isLength({ min: 1 }),
  query('adminId').optional().isMongoId(),
  query('targetType').optional().trim().isLength({ min: 1 })
), getAuditLogs);

router.post('/notifications', validateBody(...notificationValidation), sendNotification);

export default router;