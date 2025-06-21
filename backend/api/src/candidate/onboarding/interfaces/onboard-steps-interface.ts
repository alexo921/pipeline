import {
  CertificationStatus,
  HealthcareRole,
  JobStatus,
  ShiftType,
  WorkType,
} from 'src/common/enums/enums';

export interface OnboardingStepOne {
  name: string;
  email: string;
  healthcareRole: HealthcareRole;
  certificationStatus: CertificationStatus;
}

export interface OnboardingStepTwo {
  zipCode: string;
  address: string;
  maxTravelDistance: number;
}

export interface OnboardingStepThree {
  workType: WorkType[]; 
  shiftType: ShiftType[]; 
  currentJobStatus: JobStatus;
}
