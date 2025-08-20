import { Controller, Post, Get, Body, Param, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { IntakeFormsService, CreateEmployerIntakeFormDto, CreateEmployeeIntakeFormDto } from './intake-forms.service';

@Controller('intake-forms')
export class IntakeFormsController {
  constructor(private readonly intakeFormsService: IntakeFormsService) {}

  @Post('employer')
  @HttpCode(HttpStatus.CREATED)
  async createEmployerIntakeForm(@Body() data: CreateEmployerIntakeFormDto) {
    const form = await this.intakeFormsService.createEmployerIntakeForm(data);
    return {
      success: true,
      message: 'Employer intake form submitted successfully',
      data: form,
    };
  }

  @Post('employee')
  @HttpCode(HttpStatus.CREATED)
  async createEmployeeIntakeForm(@Body() data: CreateEmployeeIntakeFormDto) {
    const form = await this.intakeFormsService.createEmployeeIntakeForm(data);
    return {
      success: true,
      message: 'Employee intake form submitted successfully',
      data: form,
    };
  }

  @Get('employer')
  async getAllEmployerIntakeForms() {
    const forms = await this.intakeFormsService.getAllEmployerIntakeForms();
    return {
      success: true,
      data: forms,
    };
  }

  @Get('employee')
  async getAllEmployeeIntakeForms() {
    const forms = await this.intakeFormsService.getAllEmployeeIntakeForms();
    return {
      success: true,
      data: forms,
    };
  }

  @Get('employer/:id')
  async getEmployerIntakeFormById(@Param('id') id: string) {
    const form = await this.intakeFormsService.getEmployerIntakeFormById(id);
    if (!form) {
      return {
        success: false,
        message: 'Employer intake form not found',
      };
    }
    return {
      success: true,
      data: form,
    };
  }

  @Get('employee/:id')
  async getEmployeeIntakeFormById(@Param('id') id: string) {
    const form = await this.intakeFormsService.getEmployeeIntakeFormById(id);
    if (!form) {
      return {
        success: false,
        message: 'Employee intake form not found',
      };
    }
    return {
      success: true,
      data: form,
    };
  }

  @Put('employer/:id/status')
  async updateEmployerIntakeFormStatus(
    @Param('id') id: string,
    @Body() data: { status: string; notes?: string },
  ) {
    const form = await this.intakeFormsService.updateEmployerIntakeFormStatus(
      id,
      data.status,
      data.notes,
    );
    return {
      success: true,
      message: 'Employer intake form status updated successfully',
      data: form,
    };
  }

  @Put('employee/:id/status')
  async updateEmployeeIntakeFormStatus(
    @Param('id') id: string,
    @Body() data: { status: string; notes?: string },
  ) {
    const form = await this.intakeFormsService.updateEmployeeIntakeFormStatus(
      id,
      data.status,
      data.notes,
    );
    return {
      success: true,
      message: 'Employee intake form status updated successfully',
      data: form,
    };
  }
}
