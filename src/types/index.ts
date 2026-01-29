export type UserRole = 'ADMIN' | 'STAFF' | 'PATRON';
export type ReservationStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
export type CheckInStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'NO_SHOW' | 'AUTO_RELEASED';

// Base entity interfaces
export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
}

export interface ProgramType {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Room {
  id: string;
  name: string;
  locationId: string;
  location: Location;
  roomTypeId: string;
  roomType: RoomType;
  capacity: number;
  description?: string;
  imageUrl?: string;
  active: boolean;
  timeSlots: TimeSlot[];
}

export interface Reservation {
  id: string;
  room: Room;
  location: Location;
  programType: ProgramType;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  checkInStatus: CheckInStatus;
  checkedInAt?: string;
  checkedInById?: string;
  releasedAt?: string;
  isWalkIn: boolean;
  originalReservationId?: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  libraryCardId?: string;
  organizationName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Report types
export interface ReportSummary {
  totalReservations: number;
  pendingReservations: number;
  approvedReservations: number;
  declinedReservations: number;
  cancelledReservations: number;
  activeRooms: number;
  activeLocations?: number;
}

export interface LocationReport {
  location: string;
  total: number;
  pending: number;
  approved: number;
  declined: number;
  cancelled?: number;
}

export interface ProgramTypeReport {
  programType: string;
  total: number;
  pending: number;
  approved: number;
  declined: number;
  cancelled?: number;
}

export interface ReportData {
  summary: ReportSummary | null;
  byLocation: LocationReport[];
  byProgram: ProgramTypeReport[];
}

// Input types
export interface CreateReservationInput {
  roomId: string;
  locationId: string;
  programTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  libraryCardId?: string;
  organizationName?: string;
  notes?: string;
}

export interface UpdateReservationInput {
  status?: ReservationStatus;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface ReservationFilters {
  locationId?: string;
  roomId?: string;
  programTypeId?: string;
  status?: ReservationStatus;
  dateFrom?: string;
  dateTo?: string;
}

// Form data types
export interface ReservationFormData {
  roomId: string;
  locationId: string;
  programTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  libraryCardId: string;
  organizationName: string;
  notes: string;
}

// Booking Rule
export interface BookingRule {
  id: string;
  roomId: string;
  gracePeriodMinutes: number;
  maxDurationMinutes: number;
  maxAdvanceDays: number;
}

// Calendar types
export interface CalendarSlot {
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'yours' | 'unavailable';
  reservation?: Reservation;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  slots: CalendarSlot[];
}

// Analytics types
export interface UsageAnalytics {
  id: string;
  roomId: string;
  date: string;
  hour: number;
  dayOfWeek: number;
  reservationCount: number;
  checkInCount: number;
  noShowCount: number;
  walkInCount: number;
  utilizationMins: number;
}

export interface AnalyticsSummary {
  totalReservations: number;
  totalCheckIns: number;
  totalNoShows: number;
  totalWalkIns: number;
  checkInRate: number;
  noShowRate: number;
  utilizationPercent: number;
}

export interface HourlyAnalytics {
  hour: number;
  reservationCount: number;
  checkInCount: number;
  noShowCount: number;
  utilizationPercent: number;
}

export interface DayHourHeatmap {
  dayOfWeek: number;
  hour: number;
  value: number;
}

export interface RoomAnalytics {
  roomId: string;
  roomName: string;
  totalReservations: number;
  checkInRate: number;
  noShowRate: number;
  utilizationPercent: number;
}

// Suggestions types
export interface SuggestedSlot {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
}

export interface SuggestedRoom {
  room: Room;
  score: number;
  availableSlots: SuggestedSlot[];
}

// Prediction types
export interface HourlyPrediction {
  hour: number;
  dayOfWeek: number;
  predictedUtilization: number;
  confidence: number;
}

export interface WeeklyForecast {
  weekStartDate: string;
  predictions: HourlyPrediction[];
  peakHours: { dayOfWeek: number; hour: number; utilization: number }[];
  lowDemandHours: { dayOfWeek: number; hour: number; utilization: number }[];
}

// Conflict detection types
export interface ConflictInfo {
  hasConflict: boolean;
  conflictingReservation?: {
    id: string;
    startTime: string;
    endTime: string;
    requesterName: string;
  };
  alternativeSlots?: SuggestedSlot[];
}

// Walk-in types
export interface AvailableNowRoom {
  room: Room;
  availableUntil: string;
  wasReleased: boolean;
  originalReservationId?: string;
}

export interface WalkInBookingInput {
  roomId: string;
  locationId: string;
  programTypeId: string;
  duration: number; // minutes
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  originalReservationId?: string;
}

// Reminder types
export interface ReminderLog {
  id: string;
  reservationId: string;
  reminderType: '24h' | '1h';
  sentAt: string;
  status: string;
}