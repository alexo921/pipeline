import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UnsubscribeService {
  constructor(private prismaService: PrismaService) {}

  async unsubscribeUser(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await this.prismaService.users.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      // Update user's email subscription status
      await this.prismaService.users.update({
        where: { email: email.toLowerCase() },
        data: {
          emailSubscribed: false,
          unsubscribedAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Successfully unsubscribed ${email} from all email communications`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to unsubscribe user: ${error.message}`);
    }
  }

  async resubscribeUser(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await this.prismaService.users.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      // Update user's email subscription status
      await this.prismaService.users.update({
        where: { email: email.toLowerCase() },
        data: {
          emailSubscribed: true,
          unsubscribedAt: null,
        },
      });

      return {
        success: true,
        message: `Successfully resubscribed ${email} to email communications`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to resubscribe user: ${error.message}`);
    }
  }

  async getUserSubscriptionStatus(email: string): Promise<{ subscribed: boolean; unsubscribedAt?: Date }> {
    const user = await this.prismaService.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        emailSubscribed: true,
        unsubscribedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return {
      subscribed: user.emailSubscribed,
      unsubscribedAt: user.unsubscribedAt,
    };
  }
} 