import { Router } from 'express';
import {
  getDashboard,
  searchJourneys,
  searchEVs,
  requestEV,
  getMyRides,
  cancelRide,
  createTravelRequest,
  getMyTravelRequests,
  updateTravelRequest,
  getPoolingMatches,
  createPoolingGroupFromMatches,
  getMyPoolingGroups,
  requestSharedEVForGroup,
  cancelPoolingGroup,
  saveJourney,
  getSavedJourneys,
  deleteSavedJourney,
  getVillages,
  getStops,
  getNearbyStopsForLocation,
  initiatePayment,
  verifyPayment,
  getPaymentHistory
} from '../controllers/studentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.js';
import { body, query, param } from 'express-validator';

const router = Router();

router.use(authenticate);
router.use(authorize('student'));

const travelRequestValidation = [
  body('originStopId').isMongoId().withMessage('Valid origin stop ID required'),
  body('destinationStopId').isMongoId().withMessage('Valid destination stop ID required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('departAfter').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('seats').optional().isInt({ min: 1, max: 6 }).withMessage('Seats must be 1-6'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note too long')
];

const rideRequestValidation = [
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID required'),
  body('originStopId').isMongoId().withMessage('Valid origin stop ID required'),
  body('destinationStopId').isMongoId().withMessage('Valid destination stop ID required'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('pickupTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid pickup time format (HH:MM)'),
  body('seats').optional().isInt({ min: 1, max: 6 }).withMessage('Seats must be 1-6'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note too long'),
  body('poolingGroupId').optional().isMongoId().withMessage('Invalid pooling group ID')
];

const poolingGroupValidation = [
  body('requestId').isMongoId().withMessage('Valid request ID required'),
  body('matchIds').isArray({ min: 1 }).withMessage('At least one match ID required'),
  body('matchIds.*').isMongoId().withMessage('Invalid match ID')
];

const sharedEVValidation = [
  body('groupId').isMongoId().withMessage('Valid group ID required'),
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID required')
];

const saveJourneyValidation = [
  body('label').trim().isLength({ min: 1, max: 100 }).withMessage('Label required (1-100 chars)'),
  body('originStopId').isMongoId().withMessage('Valid origin stop ID required'),
  body('destinationStopId').isMongoId().withMessage('Valid destination stop ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('modes').isArray({ min: 1 }).withMessage('At least one mode required'),
  body('totalFare').isInt({ min: 0 }).withMessage('Total fare must be non-negative'),
  body('durationMinutes').isInt({ min: 1 }).withMessage('Duration must be positive'),
  body('transfers').optional().isInt({ min: 0 }),
  body('segments').isArray({ min: 1 }).withMessage('At least one segment required')
];

const paymentValidation = [
  body('rideRequestId').isMongoId().withMessage('Valid ride request ID required')
];

const verifyPaymentValidation = [
  body('paymentId').notEmpty().withMessage('Payment ID required'),
  body('orderId').notEmpty().withMessage('Order ID required'),
  body('signature').notEmpty().withMessage('Signature required'),
  body('rideRequestId').isMongoId().withMessage('Valid ride request ID required')
];

router.get('/dashboard', getDashboard);

router.get('/journeys/search', validateQuery(
  query('originStopId').isMongoId().withMessage('Valid origin stop ID required'),
  query('destinationStopId').isMongoId().withMessage('Valid destination stop ID required'),
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('afterTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  query('seats').optional().isInt({ min: 1, max: 6 }),
  query('preference').optional().isIn(['recommended', 'fastest', 'cheapest', 'eco'])
), searchJourneys);

router.get('/evs/search', validateQuery(
  query('originStopId').isMongoId().withMessage('Valid origin stop ID required'),
  query('destinationStopId').isMongoId().withMessage('Valid destination stop ID required'),
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('afterTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  query('seats').optional().isInt({ min: 1, max: 6 }),
  query('kind').optional().isIn(['ev-auto', 'ev-two-wheeler'])
), searchEVs);

router.post('/evs/request', validateBody(...rideRequestValidation), requestEV);

router.get('/rides', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
), getMyRides);

router.delete('/rides/:id', validateParams(
  param('id').isMongoId().withMessage('Invalid ride ID')
), cancelRide);

router.post('/travel-requests', validateBody(...travelRequestValidation), createTravelRequest);
router.get('/travel-requests', getMyTravelRequests);
router.put('/travel-requests/:id', validateParams(
  param('id').isMongoId().withMessage('Invalid request ID')
), validateBody(
  body('status').optional().isIn(['open', 'matched', 'pooled', 'cancelled']),
  body('note').optional().trim().isLength({ max: 500 })
), updateTravelRequest);

router.get('/pooling/matches', getPoolingMatches);
router.post('/pooling/groups', validateBody(...poolingGroupValidation), createPoolingGroupFromMatches);
router.get('/pooling/groups', getMyPoolingGroups);
router.post('/pooling/groups/:id/ev', validateParams(
  param('id').isMongoId().withMessage('Invalid group ID')
), validateBody(...sharedEVValidation), requestSharedEVForGroup);
router.delete('/pooling/groups/:id', validateParams(
  param('id').isMongoId().withMessage('Invalid group ID')
), cancelPoolingGroup);

router.post('/journeys/save', validateBody(...saveJourneyValidation), saveJourney);
router.get('/journeys/saved', getSavedJourneys);
router.delete('/journeys/saved/:id', validateParams(
  param('id').isMongoId().withMessage('Invalid journey ID')
), deleteSavedJourney);

router.get('/villages', getVillages);
router.get('/stops', validateQuery(
  query('villageId').optional().isMongoId(),
  query('isCollege').optional().isBoolean()
), getStops);
router.get('/stops/nearby', validateQuery(
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be 0.1-50 km')
), getNearbyStopsForLocation);

router.post('/payments/initiate', validateBody(...paymentValidation), initiatePayment);
router.post('/payments/verify', validateBody(...verifyPaymentValidation), verifyPayment);
router.get('/payments/history', validateQuery(
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded'])
), getPaymentHistory);

export default router;