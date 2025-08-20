import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateEmployerIntakeFormDto {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize?: string;
  industry?: string;
  hiringNeeds?: string;
  location?: string;
  additionalInfo?: string;
}

export interface CreateEmployeeIntakeFormDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentRole?: string;
  experience?: string;
  preferredLocation?: string;
  availability?: string;
  salaryExpectations?: string;
  additionalInfo?: string;
}

@Injectable()
export class IntakeFormsService {
  constructor(private prisma: PrismaService) {}

  async createEmployerIntakeForm(data: CreateEmployerIntakeFormDto) {
    return this.prisma.employer_intake_forms.create({
      data: {
        ...data,
        submittedAt: new Date(),
      },
    });
  }

  async createEmployeeIntakeForm(data: CreateEmployeeIntakeFormDto) {
    return this.prisma.employee_intake_forms.create({
      data: {
        ...data,
        submittedAt: new Date(),
      },
    });
  }

  async getAllEmployerIntakeForms() {
    return this.prisma.employer_intake_forms.findMany({
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getAllEmployeeIntakeForms() {
    return this.prisma.employee_intake_forms.findMany({
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getEmployerIntakeFormById(id: string) {
    return this.prisma.employer_intake_forms.findUnique({
      where: { id },
    });
  }

  async getEmployeeIntakeFormById(id: string) {
    return this.prisma.employee_intake_forms.findUnique({
      where: { id },
    });
  }

  async updateEmployerIntakeFormStatus(id: string, status: string, notes?: string) {
    return this.prisma.employer_intake_forms.update({
      where: { id },
      data: { status, notes, updatedAt: new Date() },
    });
  }

  async updateEmployeeIntakeFormStatus(id: string, status: string, notes?: string) {
    return this.prisma.employee_intake_forms.update({
      where: { id },
      data: { status, notes, updatedAt: new Date() },
    });
  }
}
