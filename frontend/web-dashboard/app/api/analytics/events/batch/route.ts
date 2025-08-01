import { NextRequest, NextResponse } from 'next/server';

export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'pipeline_web';
  version: string;
}

// In-memory storage for demo purposes
// In production, you'd want to use a database
let analyticsEvents: AnalyticsEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const { events }: { events: AnalyticsEvent[] } = await request.json();
    
    // Validate the request
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid batch data', 
          code: 'INVALID_BATCH_DATA' 
        },
        { status: 400 }
      );
    }

    const processedEvents: string[] = [];
    const errors: string[] = [];

    // Process each event
    for (const event of events) {
      try {
        // Validate the event
        if (!event.eventType || !event.eventData || !event.timestamp) {
          errors.push(`Invalid event: ${event.eventType || 'unknown'}`);
          continue;
        }

        // Add timestamp if not provided
        if (!event.timestamp) {
          event.timestamp = new Date().toISOString();
        }

        // Add source and version if not provided
        if (!event.source) {
          event.source = 'pipeline_web';
        }
        if (!event.version) {
          event.version = '1.0.0';
        }

        // Store the event
        analyticsEvents.push(event);
        
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        processedEvents.push(eventId);

        // Log the event for debugging
        console.log('Batch Analytics Event Processed:', {
          eventType: event.eventType,
          timestamp: event.timestamp,
          userId: event.userId,
          sessionId: event.sessionId,
        });

      } catch (error) {
        console.error('Error processing individual event:', error);
        errors.push(`Failed to process event: ${event.eventType || 'unknown'}`);
      }
    }

    // Return results
    const response: any = {
      success: true,
      message: 'Batch processed successfully',
      processedCount: processedEvents.length,
      eventIds: processedEvents,
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.partialSuccess = true;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing batch analytics events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filteredEvents = analyticsEvents;

    // Filter by event type if specified
    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.eventType === eventType);
    }

    // Filter by user ID if specified
    if (userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === userId);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        total: filteredEvents.length,
        limit,
        offset,
        hasMore: offset + limit < filteredEvents.length,
      },
    });

  } catch (error) {
    console.error('Error retrieving batch analytics events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    );
  }
} 