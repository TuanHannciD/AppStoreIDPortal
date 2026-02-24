import { NextResponse } from 'next/server';
import { getAllAppsPublic } from '@/lib/mock-data';

// Mock API endpoint. Replace with real data source later.
export function GET() {
  return NextResponse.json({
    ok: true,
    data: getAllAppsPublic(),
  });
}