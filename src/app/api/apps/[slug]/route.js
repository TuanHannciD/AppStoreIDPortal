import { NextResponse } from 'next/server';
import { getAppBySlug } from '@/lib/mock-data';

// Mock API endpoint. Replace with real API later.
export function GET(_req, { params }) {
  const app = getAppBySlug(params.slug);
  if (!app) {
    return NextResponse.json(
      { ok: false, error: 'NOT_FOUND', message: 'App slug not found.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, data: app });
}