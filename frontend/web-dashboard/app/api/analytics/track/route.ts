import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData, userId, sessionId, timestamp } = body;

    // Forward the analytics event to the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        eventData,
        userId,
        sessionId,
        timestamp,
      }),
    });

    if (!response.ok) {
      console.error('Failed to track analytics event:', response.status);
      return NextResponse.json(
        { error: 'Failed to track analytics event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 