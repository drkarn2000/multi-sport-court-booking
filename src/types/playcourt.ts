export type SportType = "Tennis" | "Padel" | "Badminton" | "Squash";

export interface Court {
  id: string;
  name: string;
  sport: SportType;
  surface: string;
  indoor: boolean;
  pricePerHour: number;
  slots: {
    time: string;
    available: boolean;
    peak?: boolean;
  }[];
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  area: string;
  city: string;
  address: string;
  sports: SportType[];
  primarySport: SportType;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  tag: string;
  image: string;
  gallery: string[];
  description: string;
  openingHours: string;
  facilities: string[];
  participatingInCredits: boolean;
  courts: Court[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  badge: string;
  price: number;
  cycle: "month" | "year";
  featured?: boolean;
  description: string;
  maxLinkedMembers: number;
  sharedDailyCredits: number;
  features: string[];
}

export interface LinkedMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Primary Holder" | "Linked Crew";
  avatar: string;
  usedCreditToday?: boolean;
}

export interface GroupMembershipState {
  groupId: string;
  groupName: string;
  planId: string;
  planName: string;
  status: "Active" | "Payment Overdue" | "Inactive";
  renewalDate: string;
  maxMembers: number;
  dailyCreditTotal: number;
  dailyCreditUsed: number;
  creditUsedBy?: string;
  creditUsedVenue?: string;
  creditUsedTime?: string;
  members: LinkedMember[];
}

export interface BookingRecord {
  id: string;
  venueId: string;
  venueName: string;
  venueArea: string;
  courtId: string;
  courtName: string;
  sport: SportType;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  totalPrice: number;
  paidWithCredit: boolean;
  status: "Confirmed" | "Upcoming" | "Completed" | "Cancellation Requested" | "Cancelled" | "Pending";
  createdAt: string;
  notes?: string;
}

export interface OpenMatch {
  id: string;
  title: string;
  sport: SportType;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  venueId: string;
  venueName: string;
  area: string;
  dateTime: string;
  totalSpots: number;
  filledSpots: number;
  hostName: string;
  hostRating: number;
  pricePerPlayer: number;
  joinedByCurrentUser?: boolean;
  description: string;
}

export interface PlayEvent {
  id: string;
  title: string;
  category: "Tournament" | "Coaching" | "Social";
  sport: SportType;
  dateLabel: string;
  fullDate: string;
  time: string;
  venueId: string;
  venueName: string;
  price: number;
  totalSpots: number;
  spotsLeft: number;
  image: string;
  description: string;
  highlights: string[];
  coachOrOrganizer: string;
  registered?: boolean;
}

export interface PlayerProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  memberSince: string;
  preferredSports: SportType[];
  skillLevels: Record<SportType, "Beginner" | "Intermediate" | "Advanced">;
  matchesPlayed: number;
  hoursOnCourt: number;
  favouriteVenueIds: string[];
}

