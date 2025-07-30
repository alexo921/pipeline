import { Controller, Get, Post, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { UnsubscribeService } from './unsubscribe.service';

@ApiTags('Unsubscribe')
@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(private readonly unsubscribeService: UnsubscribeService) {}

  @Get()
  @ApiOperation({ summary: 'Unsubscribe user from email communications' })
  @ApiQuery({ name: 'email', description: 'Email address to unsubscribe', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully unsubscribed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async unsubscribe(
    @Query('email') email: string,
    @Res() res: Response
  ) {
    try {
      if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      const result = await this.unsubscribeService.unsubscribeUser(email);
      
      // Return HTML page for better user experience
      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed - Pipeline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .logo {
              margin-bottom: 30px;
            }
            .logo img {
              height: 40px;
              width: auto;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 16px;
            }
            p {
              color: #6b7280;
              margin-bottom: 30px;
            }
            .resubscribe-btn {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin-top: 20px;
            }
            .resubscribe-btn:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://pipelineworkforce.com/images/pipeline_logo.png" alt="Pipeline">
            </div>
            <div class="success-icon">✅</div>
            <h1>Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from all email communications from Pipeline.</p>
            <p>We're sorry to see you go. If you change your mind, you can resubscribe at any time.</p>
            <a href="/resubscribe?email=${encodeURIComponent(email)}" class="resubscribe-btn">
              Resubscribe to Emails
            </a>
          </div>
        </body>
        </html>
      `;

      return res.status(HttpStatus.OK).send(htmlResponse);
    } catch (error) {
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - Pipeline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .logo {
              margin-bottom: 30px;
            }
            .logo img {
              height: 40px;
              width: auto;
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 16px;
            }
            p {
              color: #6b7280;
              margin-bottom: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://pipelineworkforce.com/images/pipeline_logo.png" alt="Pipeline">
            </div>
            <div class="error-icon">❌</div>
            <h1>Unsubscribe Error</h1>
            <p>${error.message || 'An error occurred while processing your unsubscribe request.'}</p>
            <p>Please contact support if you continue to have issues.</p>
          </div>
        </body>
        </html>
      `;

      return res.status(HttpStatus.NOT_FOUND).send(errorHtml);
    }
  }

  @Get('resubscribe')
  @ApiOperation({ summary: 'Resubscribe user to email communications' })
  @ApiQuery({ name: 'email', description: 'Email address to resubscribe', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully resubscribed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async resubscribe(
    @Query('email') email: string,
    @Res() res: Response
  ) {
    try {
      if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      const result = await this.unsubscribeService.resubscribeUser(email);
      
      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resubscribed - Pipeline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .logo {
              margin-bottom: 30px;
            }
            .logo img {
              height: 40px;
              width: auto;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #059669;
              margin-bottom: 16px;
            }
            p {
              color: #6b7280;
              margin-bottom: 30px;
            }
            .home-btn {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin-top: 20px;
            }
            .home-btn:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://pipelineworkforce.com/images/pipeline_logo.png" alt="Pipeline">
            </div>
            <div class="success-icon">✅</div>
            <h1>Successfully Resubscribed</h1>
            <p>You have been resubscribed to email communications from Pipeline.</p>
            <p>You'll start receiving our latest job opportunities and updates again.</p>
            <a href="https://pipelineworkforce.com" class="home-btn">
              Visit Pipeline
            </a>
          </div>
        </body>
        </html>
      `;

      return res.status(HttpStatus.OK).send(htmlResponse);
    } catch (error) {
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - Pipeline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .logo {
              margin-bottom: 30px;
            }
            .logo img {
              height: 40px;
              width: auto;
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 16px;
            }
            p {
              color: #6b7280;
              margin-bottom: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://pipelineworkforce.com/images/pipeline_logo.png" alt="Pipeline">
            </div>
            <div class="error-icon">❌</div>
            <h1>Resubscribe Error</h1>
            <p>${error.message || 'An error occurred while processing your resubscribe request.'}</p>
            <p>Please contact support if you continue to have issues.</p>
          </div>
        </body>
        </html>
      `;

      return res.status(HttpStatus.NOT_FOUND).send(errorHtml);
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get user subscription status' })
  @ApiQuery({ name: 'email', description: 'Email address to check status', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'User subscription status retrieved',
    schema: {
      type: 'object',
      properties: {
        subscribed: { type: 'boolean' },
        unsubscribedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getSubscriptionStatus(@Query('email') email: string) {
    if (!email) {
      throw new Error('Email parameter is required');
    }

    return await this.unsubscribeService.getUserSubscriptionStatus(email);
  }
} 