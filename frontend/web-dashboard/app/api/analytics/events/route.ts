import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, this would be replaced with a database
let analyticsEvents: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const eventType = searchParams.get('eventType');
    
    let filteredEvents = analyticsEvents;
    
    if (eventType) {
      filteredEvents = analyticsEvents.filter(event => event.eventType === eventType);
    }
    
    // Sort by timestamp (newest first) and limit results
    const sortedEvents = filteredEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        events: sortedEvents,
        total: filteredEvents.length,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }
    
    // Add source and version
    event.source = 'pipeline_web';
    event.version = '1.0.0';
    
    // Store the event
    analyticsEvents.push(event);
    
    // Keep only the last 1000 events to prevent memory issues
    if (analyticsEvents.length > 1000) {
      analyticsEvents = analyticsEvents.slice(-1000);
    }
    
    console.log('Analytics event received:', event);
    
    return NextResponse.json({
      success: true,
      message: 'Event recorded successfully'
    });
  } catch (error) {
    console.error('Error recording analytics event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record analytics event' },
      { status: 500 }
    );
  }
} 