import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple in-memory rate limiter (resets on cold start — fine for this scale)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;        // max requests
const RATE_WINDOW_MS = 60000; // per 60 seconds

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function sanitize(str: string, maxLen: number): string {
  return str.trim().slice(0, maxLen);
}

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // --- Input validation ---
    const name = typeof body.name === 'string' ? sanitize(body.name, 200) : '';
    const message = typeof body.message === 'string' ? sanitize(body.message, 2000) : '';
    const email = typeof body.email === 'string' ? sanitize(body.email, 320) : undefined;
    const source = typeof body.source === 'string' ? sanitize(body.source, 50) : 'unknown';

    if (!name || !message) {
      return NextResponse.json(
        { success: false, error: 'Name and message are required.' },
        { status: 400 }
      );
    }

    // Basic email format check (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    const entry = {
      name,
      email: email || null,
      message,
      source,
      timestamp: new Date().toISOString(),
    };

    // Always log to console (works everywhere, including Vercel)
    console.log('[USER SUBMISSION]', JSON.stringify(entry));

    // Try file-based storage (works locally, gracefully skipped on Vercel)
    try {
      const filePath = path.join(process.cwd(), 'user_submissions.json');
      let submissions: typeof entry[] = [];
      if (fs.existsSync(filePath)) {
        submissions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      submissions.push(entry);
      fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
    } catch {
      // Read-only filesystem (e.g. Vercel) — console.log above already persisted it
      console.warn('[DATA] File write skipped (read-only filesystem). Entry logged to console.');
    }

    return NextResponse.json({ success: true, message: 'Data received and stored successfully.' });
  } catch (error) {
    console.error('[DATA] Endpoint Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process data.' },
      { status: 500 }
    );
  }
}
