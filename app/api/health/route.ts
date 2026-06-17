/**
 * Health Check API Route
 * GET /api/health
 * Simple health check endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
