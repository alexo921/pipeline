import {
  HealthcareRole,
  WorkType,
  ShiftType,
  JobStatus,
  OnboardingStep,
  CertificationStatus
} from 'src/common/enums/enums';

export class OnboardingDto {

  id?: string

  name: string;

  email: string;

  healthcareRole: HealthcareRole;

  certificationStatus: CertificationStatus;

  zipCode: string;

  address: string;

  maxTravelDistance: number;

  workType: WorkType[];

  shiftType: ShiftType[];

  currentJobStatus: JobStatus;

  step: OnboardingStep
}
