/**
 * ROUTENEX sample data — clearly simulated.
 * Shapes mirror the blueprint's shared database plan so Supabase can replace this later.
 * All fares, seats, batteries and availability values are SAMPLE DATA.
 */
const today = new Date().toISOString().slice(0, 10)
const now = new Date().toISOString()
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const SAMPLE_NOTICE =
  'Sample data for demonstration. Fares, seats, battery levels and availability are simulated and must not be read as live transport information.'

const villages = [
  { id: 'v1', name: 'Uthiramerur', block: 'Uthiramerur', district: 'Kanchipuram' },
  { id: 'v2', name: 'Salavakkam', block: 'Uthiramerur', district: 'Kanchipuram' },
  { id: 'v3', name: 'Thandalam', block: 'Uthiramerur', district: 'Kanchipuram' },
  { id: 'v4', name: 'Kattupakkam', block: 'Uthiramerur', district: 'Kanchipuram' },
  { id: 'v5', name: 'Walajabad', block: 'Walajabad', district: 'Kanchipuram' },
  { id: 'v6', name: 'Kanchipuram', block: 'Kanchipuram', district: 'Kanchipuram' },
  { id: 'v7', name: 'Chengalpattu', block: 'Chengalpattu', district: 'Chengalpattu' },
  { id: 'v8', name: 'Madurantakam', block: 'Madurantakam', district: 'Chengalpattu' },
  { id: 'v9', name: 'Periyar Nagar', block: 'Uthiramerur', district: 'Kanchipuram' },
]

const stops = [
  { id: 's1', name: 'Uthiramerur Bus Stand', villageId: 'v1', lat: 12.6167, lng: 79.75 },
  { id: 's2', name: 'Uthiramerur Market', villageId: 'v1', lat: 12.622, lng: 79.756 },
  { id: 's3', name: 'Salavakkam Junction', villageId: 'v2', lat: 12.648, lng: 79.728 },
  { id: 's4', name: 'Thandalam', villageId: 'v3', lat: 12.678, lng: 79.758 },
  { id: 's5', name: 'Kattupakkam', villageId: 'v4', lat: 12.699, lng: 79.783 },
  { id: 's6', name: 'College Gate', villageId: 'v1', lat: 12.63, lng: 79.772, isCollege: true },
  { id: 's7', name: 'College Hostel Gate', villageId: 'v1', lat: 12.627, lng: 79.776, isCollege: true },
  { id: 's8', name: 'Walajabad Bus Stand', villageId: 'v5', lat: 12.79, lng: 79.83 },
  { id: 's9', name: 'Kanchipuram Bus Stand', villageId: 'v6', lat: 12.8342, lng: 79.7036 },
  { id: 's10', name: 'Chengalpattu Bus Stand', villageId: 'v7', lat: 12.6819, lng: 79.9888 },
  { id: 's11', name: 'Madurantakam', villageId: 'v8', lat: 12.51, lng: 79.88 },
  { id: 's12', name: 'Periyar Nagar', villageId: 'v9', lat: 12.642, lng: 79.765 },
  { id: 's13', name: 'Kattupakkam Colony', villageId: 'v4', lat: 12.705, lng: 79.79 },
]

const providers = [
  { id: 'p1', name: 'Uthiramerur Government Bus Depot', type: 'bus', contact: 'Depot office', email: 'depot@routenex.in', phone: '044-2727-0001', verified: true, available: true, serviceAreas: ['v1', 'v2', 'v3', 'v4'], createdAt: now },
  { id: 'p2', name: 'Kanchipuram Transport Co-op', type: 'bus', contact: 'R. Sekar', email: 'sekhar@routenex.in', phone: '044-2722-0044', verified: true, available: true, serviceAreas: ['v5', 'v6', 'v3'], createdAt: now },
  { id: 'p3', name: 'Chengalpattu Bus Service', type: 'bus', contact: 'M. Devi', email: 'devi@routenex.in', phone: '044-2742-7781', verified: true, available: true, serviceAreas: ['v7', 'v8', 'v3'], createdAt: now },
  { id: 'p4', name: 'GreenWheels EV', type: 'ev', contact: 'Prakash N.', email: 'prakash@greenwheels.in', phone: '98400-11223', verified: true, available: true, serviceAreas: ['v1', 'v3', 'v4'], createdAt: now },
  { id: 'p5', name: 'Rural EV Connect', type: 'ev', contact: 'Lakshmi S.', email: 'lakshmi@ruralev.in', phone: '98400-44556', verified: true, available: true, serviceAreas: ['v2', 'v3'], createdAt: now },
  { id: 'p6', name: 'EcoRide Community', type: 'ev', contact: 'Arul K.', email: 'arul@ecoride.in', phone: '98400-77889', verified: false, available: true, serviceAreas: ['v1', 'v2'], createdAt: now },
]

const vehicles = [
  { id: 'b1', kind: 'bus', providerId: 'p1', registration: 'TN-21-AX-4521', model: 'Ashok Leyland Viking', capacity: 40, available: true, createdAt: now },
  { id: 'b2', kind: 'bus', providerId: 'p1', registration: 'TN-21-BX-7788', model: 'Tata Starbus', capacity: 40, available: true, createdAt: now },
  { id: 'b3', kind: 'bus', providerId: 'p2', registration: 'TN-21-CX-1102', model: 'Ashok Leyland Viking', capacity: 50, available: true, createdAt: now },
  { id: 'b4', kind: 'bus', providerId: 'p2', registration: 'TN-21-DX-9034', model: 'Tata LP 909', capacity: 50, available: true, createdAt: now },
  { id: 'b5', kind: 'bus', providerId: 'p3', registration: 'TN-21-EX-6610', model: 'Ashok Leyland Cheetah', capacity: 45, available: true, createdAt: now },
  { id: 'b6', kind: 'bus', providerId: 'p1', registration: 'TN-21-FX-2244', model: 'Tata Mini Bus', capacity: 30, available: true, createdAt: now },
  { id: 'b7', kind: 'bus', providerId: 'p1', registration: 'TN-21-GX-5151', model: 'Force Traveller', capacity: 22, available: true, createdAt: now },
  { id: 'e1', kind: 'ev-auto', providerId: 'p4', registration: 'TN-21-EV-3301', model: 'Mahindra Treo', capacity: 4, available: true, batteryPercent: 82, rangeKm: 60, locationStopId: 's4', farePerKm: 12, createdAt: now },
  { id: 'e2', kind: 'ev-two-wheeler', providerId: 'p4', registration: 'TN-21-EV-8812', model: 'Ather Rizta', capacity: 1, available: true, batteryPercent: 64, rangeKm: 45, locationStopId: 's3', farePerKm: 7, createdAt: now },
  { id: 'e3', kind: 'ev-auto', providerId: 'p5', registration: 'TN-21-EV-4402', model: 'Piaggio Ape E-City', capacity: 3, available: true, batteryPercent: 55, rangeKm: 50, locationStopId: 's2', farePerKm: 11, createdAt: now },
  { id: 'e4', kind: 'ev-two-wheeler', providerId: 'p5', registration: 'TN-21-EV-9920', model: 'TVS iQube', capacity: 1, available: false, batteryPercent: 30, rangeKm: 35, locationStopId: 's5', farePerKm: 7, createdAt: now },
  { id: 'e5', kind: 'ev-auto', providerId: 'p6', registration: 'TN-21-EV-6677', model: 'Mahindra Treo', capacity: 4, available: true, batteryPercent: 90, rangeKm: 70, locationStopId: 's1', farePerKm: 10, createdAt: now },
  { id: 'e6', kind: 'ev-auto', providerId: 'p4', registration: 'TN-21-EV-1130', model: 'Piaggio Ape E-City', capacity: 4, available: true, batteryPercent: 47, rangeKm: 40, locationStopId: 's1', farePerKm: 12, createdAt: now },
]

const routes = [
  { id: 'r1', code: 'R1', name: 'Uthiramerur – College via Salavakkam', providerId: 'p1', stops: ['s1', 's2', 's3', 's4', 's6', 's7'], fare: 25, color: '#157456' },
  { id: 'r2', code: 'R2', name: 'Kanchipuram – College via Walajabad', providerId: 'p2', stops: ['s9', 's8', 's3', 's4', 's6'], fare: 45, color: '#b45309' },
  { id: 'r3', code: 'R3', name: 'Chengalpattu – College via Madurantakam', providerId: 'p3', stops: ['s10', 's11', 's3', 's4', 's6'], fare: 55, color: '#1d4ed8' },
  { id: 'r4', code: 'R4', name: 'Uthiramerur – College via Periyar Nagar', providerId: 'p1', stops: ['s1', 's2', 's12', 's6', 's7'], fare: 15, color: '#7c3aed' },
  { id: 'r5', code: 'R5', name: 'Thandalam – Kattupakkam – College', providerId: 'p1', stops: ['s4', 's5', 's13', 's6'], fare: 18, color: '#be123c' },
]

const schedules = [
  { id: 'sch1', routeId: 'r1', busId: 'b1', departureTime: '07:30', days: WEEKDAYS, fare: 25, availableSeats: 14, status: 'running', note: '', updatedAt: now },
  { id: 'sch2', routeId: 'r1', busId: 'b2', departureTime: '08:15', days: WEEKDAYS, fare: 25, availableSeats: 3, status: 'running', note: '', updatedAt: now },
  { id: 'sch3', routeId: 'r4', busId: 'b6', departureTime: '07:50', days: WEEKDAYS, fare: 15, availableSeats: 18, status: 'running', note: '', updatedAt: now },
  { id: 'sch4', routeId: 'r2', busId: 'b3', departureTime: '06:50', days: WEEKDAYS, fare: 45, availableSeats: 22, status: 'running', note: '', updatedAt: now },
  { id: 'sch5', routeId: 'r2', busId: 'b4', departureTime: '08:35', days: WEEKDAYS, fare: 45, availableSeats: 6, status: 'running', note: '', updatedAt: now },
  { id: 'sch6', routeId: 'r3', busId: 'b5', departureTime: '06:30', days: WEEKDAYS, fare: 55, availableSeats: 10, status: 'running', note: '', updatedAt: now },
  { id: 'sch7', routeId: 'r5', busId: 'b7', departureTime: '08:05', days: WEEKDAYS, fare: 18, availableSeats: 12, status: 'running', note: '', updatedAt: now },
  { id: 'sch8', routeId: 'r1', busId: 'b1', departureTime: '17:30', days: WEEKDAYS, fare: 25, availableSeats: 20, status: 'running', note: 'Return service', updatedAt: now },
  { id: 'sch9', routeId: 'r2', busId: 'b3', departureTime: '18:10', days: WEEKDAYS, fare: 45, availableSeats: 25, status: 'running', note: 'Return service', updatedAt: now },
  { id: 'sch10', routeId: 'r4', busId: 'b2', departureTime: '17:45', days: WEEKDAYS, fare: 15, availableSeats: 0, status: 'cancelled', note: 'Vehicle breakdown — awaiting replacement', updatedAt: now },
]

const students = [
  { id: 'st1', name: 'Ananya Raman', email: 'ananya@example.edu', phone: '98410-10001', college: 'Govt. Arts & Science College, Uthiramerur', villageId: 'v3', departurePreference: '08:00', budget: 60, emergencyContact: '98410-90001', createdAt: now },
  { id: 'st2', name: 'Karthik S.', email: 'karthik@example.edu', phone: '98410-10002', college: 'Govt. Arts & Science College, Uthiramerur', villageId: 'v3', departurePreference: '08:10', budget: 50, emergencyContact: '98410-90002', createdAt: now },
  { id: 'st3', name: 'Meena K.', email: 'meena@example.edu', phone: '98410-10003', college: 'Govt. Arts & Science College, Uthiramerur', villageId: 'v2', departurePreference: '08:05', budget: 40, emergencyContact: '98410-90003', createdAt: now },
  { id: 'st4', name: 'Arjun P.', email: 'arjun@example.edu', phone: '98410-10004', college: 'Govt. Arts & Science College, Uthiramerur', villageId: 'v4', departurePreference: '07:45', budget: 70, emergencyContact: '98410-90004', createdAt: now },
  { id: 'st5', name: 'Divya M.', email: 'divya@example.edu', phone: '98410-10005', college: 'Govt. Arts & Science College, Uthiramerur', villageId: 'v4', departurePreference: '08:20', budget: 80, emergencyContact: '98410-90005', createdAt: now },
  { id: 'st6', name: 'Surya V.', email: 'surya@example.edu', phone: '98410-10006', college: 'Govt. Arts & Science College, Uthiramerur', villageId: 'v5', departurePreference: '07:15', budget: 100, emergencyContact: '98410-90006', createdAt: now },
]

const travelRequests = [
  { id: 'tr1', studentId: 'st1', originStopId: 's4', destinationStopId: 's6', date: today, departAfter: '08:00', seats: 1, status: 'open', note: 'Morning college trip', createdAt: now },
  { id: 'tr2', studentId: 'st2', originStopId: 's4', destinationStopId: 's6', date: today, departAfter: '08:10', seats: 1, status: 'open', note: '', createdAt: now },
  { id: 'tr3', studentId: 'st3', originStopId: 's3', destinationStopId: 's6', date: today, departAfter: '08:05', seats: 1, status: 'open', note: 'Can walk to Thandalam', createdAt: now },
  { id: 'tr4', studentId: 'st4', originStopId: 's5', destinationStopId: 's6', date: today, departAfter: '07:45', seats: 1, status: 'open', note: '', createdAt: now },
  { id: 'tr5', studentId: 'st5', originStopId: 's13', destinationStopId: 's6', date: today, departAfter: '08:20', seats: 1, status: 'open', note: '', createdAt: now },
]

const rideRequests = [
  { id: 'rq1', studentId: 'st5', vehicleId: 'e1', providerId: 'p4', originStopId: 's5', destinationStopId: 's6', date: today, pickupTime: '08:30', seats: 2, fareEstimate: 72, status: 'pending', poolingGroupId: null, note: 'Sample request waiting for provider action', createdAt: now, decidedAt: null, reason: '' },
  { id: 'rq2', studentId: 'st3', vehicleId: 'e2', providerId: 'p4', originStopId: 's3', destinationStopId: 's6', date: today, pickupTime: '08:10', seats: 1, fareEstimate: 91, status: 'accepted', poolingGroupId: null, note: '', createdAt: now, decidedAt: now, reason: '' },
  { id: 'rq3', studentId: 'st1', vehicleId: 'e3', providerId: 'p5', originStopId: 's4', destinationStopId: 's6', date: today, pickupTime: '08:15', seats: 1, fareEstimate: 61, status: 'rejected', poolingGroupId: null, note: '', createdAt: now, decidedAt: now, reason: 'Vehicle already committed for another trip' },
]

const savedJourneys = [
  {
    id: 'sj1',
    studentId: 'st1',
    label: 'Home → College (morning bus)',
    date: today,
    modes: ['bus'],
    totalFare: 12,
    durationMin: 32,
    transfers: 0,
    segments: [
      { mode: 'bus', fromName: 'Thandalam', toName: 'College Gate', depart: '08:00', arrive: '08:32', detail: 'R1 · TN-21-AX-4521' },
    ],
    createdAt: now,
  },
]

export function createSeedData() {
  return {
    version: 3,
    sample: true,
    createdAt: now,
    villages,
    stops,
    providers,
    vehicles,
    routes,
    schedules,
    students,
    travelRequests,
    rideRequests,
    savedJourneys,
    poolingGroups: [],
    session: { role: 'student', studentId: 'st1', providerId: 'p4' },
  }
}
