export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const calculateFare = (distanceKm, farePerKm, baseFare = 0) => {
  return Math.max(baseFare, Math.round(distanceKm * farePerKm));
};

export const calculateCommission = (amount, percent = 3) => {
  return Math.round(amount * percent / 100);
};

export const generateOrderId = () => {
  return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const generateBookingId = () => {
  return `BK_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

export const getDayName = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(date).getDay()];
};

export const isScheduleOnDate = (schedule, date) => {
  const dayName = getDayName(date);
  return schedule.days.includes(dayName);
};

export const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { skip: (p - 1) * l, limit: l, page: p };
};

export const buildQuery = (filters, searchFields = []) => {
  const query = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'search' && searchFields.length > 0) {
        query.$or = searchFields.map(field => ({
          [field]: { $regex: value, $options: 'i' }
        }));
      } else {
        query[key] = value;
      }
    }
  });
  
  return query;
};

export const formatResponse = (success, data, message = '', meta = {}) => ({
  success,
  message,
  data,
  meta
});

export const formatError = (message, code = 'ERROR', errors = []) => ({
  success: false,
  message,
  code,
  errors
});