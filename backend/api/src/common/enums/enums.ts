export enum Role {
  CANDIDATE,
  EMPLOYER,
  ADMIN,
}

export enum OnboardingStep {
  INITIAL_DETAILS = 'INITIAL_DETAILS',
  LOCATION_DETAILS = 'LOCATION_DETAILS',
  AVIALABILITY_DETAILS = 'AVIALABILITY_DETAILS',
}

export enum HealthcareRole {
  CNA = 'CNA',
  LPN = 'LPN',
  RN = 'RN',
  PCA = 'PCA',
  HHA = 'HHA',
  OTHER = 'OTHER',
}

export enum CertificationStatus {
  Certified = 'Certified',
  NotCertified = 'NotCertified',
  Pending = 'Pending',
  Inprogress = 'Inprogress',
}

export enum WorkType {
  FullTime = 'FullTime',
  PartTime = 'PartTime',
  PerDiem = 'PerDiem',
  LiveIn = 'LiveIn',
}

export enum ShiftType {
  Day = 'Day',
  Night = 'Night',
  Weekend = 'Weekend',
  Overnight = 'Overnight',
  Flexible = 'Flexible',
}

export enum JobStatus {
  WorkingFullTime = 'WorkingFullTime',
  WorkingFullTimeAvailable = 'WorkingFullTimeAvailable',
  WorkingPartTimeAvailable = 'WorkingPartTimeAvailable',
  NotWorkingAvailable = 'NotWorkingAvailable',
  NotWorkingOpenOffers = 'NotWorkingOpenOffers',
}
