import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-launch')
  @ApiOperation({ summary: 'Send launch email to waitlist subscriber' })
  @ApiResponse({ 
    status: 200, 
    description: 'Launch email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        error: { type: 'string' }
      }
    }
  })
  async sendLaunchEmail(@Body() body: { email: string; firstName: string }) {
    try {
      const { email, firstName } = body;
      
      if (!email || !firstName) {
        return {
          success: false,
          message: 'Email and firstName are required',
          error: 'Missing required fields'
        };
      }

      await this.emailService.sendLaunchEmail(email, firstName);
      
      return {
        success: true,
        message: `Launch email sent successfully to ${firstName} (${email})`,
        email,
        firstName
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send launch email',
        error: error.message
      };
    }
  }
} 