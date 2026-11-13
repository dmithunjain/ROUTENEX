import { Router } from 'express';
import {
  getDashboard,
  updateProfile,
  toggleAvailability,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleAvailability,
  getVehicles,
  getPendingRequests,
  acceptRide,
  rejectRide,
  completeRide,
  getRideHistory,
  getEarnings
} from '../controllers/providerController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';
import multer from 'multer';

const router = Router();

router.use(authenticate);
router.use(authorize('provider'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const profileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('contact').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone('en-IN'),
  body('serviceAreas').optional().isArray(),
  body('serviceAreas.*').optional().isMongoId(),
  body('operatingHours').optional().isObject(),
  body('estimatedFarePerKm').optional().isFloat({ min: 1, max: 50 })
];

const vehicleValidation = [
  body('kind').isIn(['bus', 'ev-auto', 'ev-two-wheeler']),
  body('registration').trim().isLength({ min: 5, max: 20 }).matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/i).withMessage('Invalid Indian registration format'),
  body('model').trim().isLength({ min: 1, max: 100 }),
  body('capacity').isInt({ min: 1, max: 60 }),
  body('batteryPercent').optional().isInt({ min: 0, max: 100 }),
  body('rangeKm').optional().isFloat({ min: 1, max: 500 }),
  body('farePerKm').optional().isFloat({ min: 1, max: 100 }),
  body('locationStopId').optional().isMongoId(),
  body('features').optional().isObject()
];

const vehicleUpdateValidation = [
  body('model').optional().trim().isLength({ min: 1, max: 100 }),
  body('capacity').optional().isInt({ min: 1, max: 60 }),
  body('available').optional().isBoolean(),
  body('batteryPercent').optional().isInt({ min: 0, max: 100 }),
  body('rangeKm').optional().isFloat({ min: 1, max: 500 }),
  body('farePerKm').optional().isFloat({ min: 1, max: 100 }),
  body('locationStopId').optional().isMongoId(),
  body('features').optional().isObject()
];

const rideDecisionValidation = [
  body('reason').optional().trim().isLength({ min: 1, max: 500 })
];

router.get('/dashboard', getDashboard);
router.put('/profile', validateBody(...profileValidation), updateProfile);
router.put('/availability', toggleAvailability);

router.post('/vehicles', upload.array('documents', 5), validateBody(...vehicleValidation), addVehicle);
router.get('/vehicles', getVehicles);
router.put('/vehicles/:id', validateParams(param('id').isMongoId()), validateBody(...vehicleUpdateValidation), updateVehicle);
router.delete('/vehicles/:id', validateParams(param('id').isMongoId()), deleteVehicle);
router.put('/vehicles/:id/availability', validateParams(param('id').isMongoId()), toggleVehicleAvailability);

router.get('/requests/pending', getPendingRequests);
router.put('/requests/:id/accept', validateParams(param('id').isMongoId()), acceptRide);
router.put('/requests/:id/reject', validateParams(param('id').isMongoId()), validateBody(...rideDecisionValidation), rejectRide);
router.put('/requests/:id/complete', validateParams(param('id').isMongoId()), completeRide);
router.get('/rides/history', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
), getRideHistory);

router.get('/earnings', validateQuery(
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
), getEarnings);

export default router;