import mongoose from 'mongoose';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Village from '../models/Village.js';
import Stop from '../models/Stop.js';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';

const VILLAGES = [
  { name: 'Uthiramerur', block: 'Uthiramerur', district: 'Kanchipuram', coordinates: [79.8341, 12.6097] },
  { name: 'Kanchipuram', block: 'Kanchipuram', district: 'Kanchipuram', coordinates: [79.7036, 12.8342] },
  { name: 'Chengalpattu', block: 'Chengalpattu', district: 'Chengalpattu', coordinates: [79.9798, 12.6919] },
  { name: 'Maduranthakam', block: 'Maduranthakam', district: 'Chengalpattu', coordinates: [79.8789, 12.5098] },
  { name: 'Sriperumbudur', block: 'Sriperumbudur', district: 'Kanchipuram', coordinates: [79.9428, 12.9658] },
  { name: 'Tirukalukundram', block: 'Tirukalukundram', district: 'Chengalpattu', coordinates: [80.0547, 12.6098] },
  { name: 'Walajabad', block: 'Walajabad', district: 'Kanchipuram', coordinates: [79.7891, 12.7987] },
  { name: 'Acharapakkam', block: 'Maduranthakam', district: 'Chengalpattu', coordinates: [79.8234, 12.4123] }
];

const STOPS = [
  { name: 'Govt. Arts & Science College, Uthiramerur', village: 'Uthiramerur', coordinates: [79.8341, 12.6097], isCollege: true, collegeName: 'Govt. Arts & Science College, Uthiramerur', facilities: ['waiting_area', 'shelter'] },
  { name: 'Uthiramerur Bus Stand', village: 'Uthiramerur', coordinates: [79.8350, 12.6100], isCollege: false, facilities: ['waiting_area', 'shelter', 'shop'] },
  { name: 'Kanchipuram Bus Stand', village: 'Kanchipuram', coordinates: [79.7036, 12.8342], isCollege: false, facilities: ['waiting_area', 'shelter', 'shop', 'restroom'] },
  { name: 'Chengalpattu Railway Station', village: 'Chengalpattu', coordinates: [79.9798, 12.6919], isCollege: false, facilities: ['waiting_area', 'shelter', 'shop', 'restroom'] },
  { name: 'Maduranthakam Bus Stand', village: 'Maduranthakam', coordinates: [79.8789, 12.5098], isCollege: false, facilities: ['waiting_area', 'shelter'] },
  { name: 'Sriperumbudur Bus Stand', village: 'Sriperumbudur', coordinates: [79.9428, 12.9658], isCollege: false, facilities: ['waiting_area', 'shelter', 'shop'] },
  { name: 'Tirukalukundram Bus Stand', village: 'Tirukalukundram', coordinates: [80.0547, 12.6098], isCollege: false, facilities: ['waiting_area', 'shelter'] },
  { name: 'Walajabad Bus Stop', village: 'Walajabad', coordinates: [79.7891, 12.7987], isCollege: false, facilities: ['shelter'] },
  { name: 'Acharapakkam Bus Stop', village: 'Acharapakkam', coordinates: [79.8234, 12.4123], isCollege: false, facilities: ['shelter'] }
];

const SAMPLE_ROUTES = [
  { code: 'UTR-KPM', name: 'Uthiramerur → Kanchipuram', stops: ['Uthiramerur Bus Stand', 'Walajabad Bus Stop', 'Kanchipuram Bus Stand'], collegeStop: 'Govt. Arts & Science College, Uthiramerur', distanceKm: 28, estimatedDuration: 60 },
  { code: 'UTR-CGL', name: 'Uthiramerur → Chengalpattu', stops: ['Uthiramerur Bus Stand', 'Maduranthakam Bus Stand', 'Chengalpattu Railway Station'], collegeStop: 'Govt. Arts & Science College, Uthiramerur', distanceKm: 42, estimatedDuration: 90 },
  { code: 'UTR-SPB', name: 'Uthiramerur → Sriperumbudur', stops: ['Uthiramerur Bus Stand', 'Walajabad Bus Stop', 'Sriperumbudur Bus Stand'], collegeStop: 'Govt. Arts & Science College, Uthiramerur', distanceKm: 35, estimatedDuration: 75 },
  { code: 'KPM-CGL', name: 'Kanchipuram → Chengalpattu', stops: ['Kanchipuram Bus Stand', 'Walajabad Bus Stop', 'Sriperumbudur Bus Stand', 'Chengalpattu Railway Station'], collegeStop: null, distanceKm: 38, estimatedDuration: 80 },
  { code: 'MDK-CGL', name: 'Maduranthakam → Chengalpattu', stops: ['Maduranthakam Bus Stand', 'Acharapakkam Bus Stop', 'Chengalpattu Railway Station'], collegeStop: null, distanceKm: 22, estimatedDuration: 45 },
  { code: 'TRK-CGL', name: 'Tirukalukundram → Chengalpattu', stops: ['Tirukalukundram Bus Stand', 'Chengalpattu Railway Station'], collegeStop: null, distanceKm: 18, estimatedDuration: 35 }
];

const SAMPLE_SCHEDULES = [
  { routeCode: 'UTR-KPM', departureTime: '06:30', arrivalTime: '07:30', days: [1,2,3,4,5] },
  { routeCode: 'UTR-KPM', departureTime: '07:30', arrivalTime: '08:30', days: [1,2,3,4,5,6] },
  { routeCode: 'UTR-KPM', departureTime: '08:30', arrivalTime: '09:30', days: [1,2,3,4,5,6,0] },
  { routeCode: 'UTR-KPM', departureTime: '13:30', arrivalTime: '14:30', days: [1,2,3,4,5] },
  { routeCode: 'UTR-KPM', departureTime: '16:30', arrivalTime: '17:30', days: [1,2,3,4,5,6] },
  { routeCode: 'UTR-KPM', departureTime: '18:00', arrivalTime: '19:00', days: [1,2,3,4,5] },
  { routeCode: 'UTR-CGL', departureTime: '06:45', arrivalTime: '08:15', days: [1,2,3,4,5] },
  { routeCode: 'UTR-CGL', departureTime: '08:00', arrivalTime: '09:30', days: [1,2,3,4,5,6] },
  { routeCode: 'UTR-CGL', departureTime: '14:00', arrivalTime: '15:30', days: [1,2,3,4,5] },
  { routeCode: 'UTR-CGL', departureTime: '17:00', arrivalTime: '18:30', days: [1,2,3,4,5] },
  { routeCode: 'UTR-SPB', departureTime: '07:00', arrivalTime: '08:15', days: [1,2,3,4,5] },
  { routeCode: 'UTR-SPB', departureTime: '08:30', arrivalTime: '09:45', days: [1,2,3,4,5,6] },
  { routeCode: 'UTR-SPB', departureTime: '13:30', arrivalTime: '14:45', days: [1,2,3,4,5] },
  { routeCode: 'UTR-SPB', departureTime: '17:30', arrivalTime: '18:45', days: [1,2,3,4,5] }
];

const SAMPLE_VEHICLES = [
  { kind: 'bus', registration: 'TN21AB1234', model: 'Ashok Leyland 12M', capacity: 50 },
  { kind: 'bus', registration: 'TN21CD5678', model: 'Tata LPO 1618', capacity: 45 },
  { kind: 'bus', registration: 'TN21EF9012', model: 'Eicher 12.16', capacity: 40 },
  { kind: 'bus', registration: 'TN21GH3456', model: 'Ashok Leyland 12M', capacity: 50 },
  { kind: 'ev-auto', registration: 'TN21EV1111', model: 'Mahindra Treo Zor', capacity: 3, batteryPercent: 85, rangeKm: 120, farePerKm: 12 },
  { kind: 'ev-auto', registration: 'TN21EV2222', model: 'Piaggio Ape E-City', capacity: 3, batteryPercent: 90, rangeKm: 110, farePerKm: 10 },
  { kind: 'ev-auto', registration: 'TN21EV3333', model: 'Mahindra Treo Zor', capacity: 3, batteryPercent: 75, rangeKm: 120, farePerKm: 12 },
  { kind: 'ev-two-wheeler', registration: 'TN21EV4444', model: 'Ola S1 Pro', capacity: 1, batteryPercent: 95, rangeKm: 150, farePerKm: 8 },
  { kind: 'ev-two-wheeler', registration: 'TN21EV5555', model: 'Ather 450X', capacity: 1, batteryPercent: 88, rangeKm: 140, farePerKm: 8 },
  { kind: 'ev-two-wheeler', registration: 'TN21EV6666', model: 'TVS iQube', capacity: 1, batteryPercent: 80, rangeKm: 130, farePerKm: 7 }
];

export const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  const adminExists = await User.findOne({ email: 'admin@routenex.com' });
  if (!adminExists) {
    await User.create({
      name: 'ROUTENEX Admin',
      email: 'admin@routenex.com',
      password: 'routenex755',
      role: 'admin',
      isEmailVerified: true
    });
    console.log('✓ Admin user created: admin@routenex.com / routenex755');
  } else {
    console.log('✓ Admin user already exists');
  }
  
  for (const v of VILLAGES) {
    const existing = await Village.findOne({ name: v.name });
    if (!existing) {
      await Village.create({
        name: v.name,
        block: v.block,
        district: v.district,
        coordinates: v.coordinates
      });
    }
  }
  console.log(`✓ ${VILLAGES.length} villages seeded`);
  
  const villagesMap = {};
  const allVillages = await Village.find();
  allVillages.forEach(v => { villagesMap[v.name] = v._id; });
  
  for (const s of STOPS) {
    const existing = await Stop.findOne({ name: s.name });
    if (!existing) {
      await Stop.create({
        name: s.name,
        village: villagesMap[s.village],
        coordinates: s.coordinates,
        isCollege: s.isCollege,
        collegeName: s.collegeName,
        facilities: s.facilities
      });
    }
  }
  console.log(`✓ ${STOPS.length} stops seeded`);
  
  const stopsMap = {};
  const allStops = await Stop.find().populate('village');
  allStops.forEach(s => { stopsMap[s.name] = s._id; });
  
  for (const r of SAMPLE_ROUTES) {
    const existing = await Route.findOne({ code: r.code });
    if (!existing) {
      const stopIds = r.stops.map(name => stopsMap[name]).filter(Boolean);
      const collegeStopId = r.collegeStop ? stopsMap[r.collegeStop] : null;
      
      const provider = await ProviderProfile.findOne();
      const providerId = provider ? provider._id : null;
      
      await Route.create({
        code: r.code,
        name: r.name,
        stops: stopIds,
        collegeStop: collegeStopId,
        distanceKm: r.distanceKm,
        estimatedDuration: r.estimatedDuration,
        isActive: true,
        provider: providerId || new mongoose.Types.ObjectId(),
        fare: r.distanceKm * 2
      });
    }
  }
  console.log(`✓ ${SAMPLE_ROUTES.length} routes seeded`);
  
  const sampleProvider = await ProviderProfile.findOne();
  let providerId = null;
  if (!sampleProvider) {
    const providerUser = await User.findOne({ role: 'provider' });
    if (providerUser) {
      const newProvider = await ProviderProfile.create({
        user: providerUser._id,
        type: 'ev',
        contact: 'Sample Provider',
        verified: true,
        available: true,
        serviceAreas: allVillages.map(v => v._id)
      });
      providerId = newProvider._id;
    }
  } else {
    providerId = sampleProvider._id;
  }
  
  const routesMap = {};
  const allRoutes = await Route.find();
  allRoutes.forEach(r => { routesMap[r.code] = r._id; });
  
  for (const v of SAMPLE_VEHICLES) {
    const existing = await Vehicle.findOne({ registration: v.registration });
    if (!existing) {
      const vehicleData = {
        provider: providerId || new mongoose.Types.ObjectId(),
        kind: v.kind,
        registration: v.registration,
        model: v.model,
        capacity: v.capacity,
        available: true
      };
      if (v.kind !== 'bus') {
        vehicleData.batteryPercent = v.batteryPercent;
        vehicleData.rangeKm = v.rangeKm;
        vehicleData.farePerKm = v.farePerKm;
      }
      await Vehicle.create(vehicleData);
    }
  }
  console.log(`✓ ${SAMPLE_VEHICLES.length} vehicles seeded`);
  
  const buses = await Vehicle.find({ kind: 'bus' });
  
  for (const s of SAMPLE_SCHEDULES) {
    const route = await Route.findOne({ code: s.routeCode });
    if (!route) continue;
    
    const bus = buses[Math.floor(Math.random() * buses.length)];
    if (!bus) continue;
    
    const days = s.days;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      if (days.includes(dayOfWeek)) {
        const existing = await Schedule.findOne({
          route: route._id,
          bus: bus._id,
          date: {
            $gte: new Date(date.setHours(0,0,0,0)),
            $lt: new Date(date.setHours(23,59,59,999))
          },
          departureTime: s.departureTime
        });
        
        if (!existing) {
          const scheduleDate = new Date();
          scheduleDate.setDate(scheduleDate.getDate() + i);
          scheduleDate.setHours(0,0,0,0);
          
          await Schedule.create({
            route: route._id,
            bus: bus._id,
            date: scheduleDate,
            departureTime: s.departureTime,
            arrivalTime: s.arrivalTime,
            availableSeats: bus.capacity,
            totalSeats: bus.capacity,
            fare: route.distanceKm * 2 || 50,
            status: 'running'
          });
        }
      }
    }
  }
  console.log('✓ Schedules seeded for next 7 days');
  
  console.log('Database seeding completed successfully!');
};

export default seedDatabase;