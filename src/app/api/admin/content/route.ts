import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GITHUB_OWNER = 'kprsnt2';
const GITHUB_REPO = 'nanublog';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'test2features';
const CONTENT_DIR = 'content';

const ALLOWED_FILES = [
  'timeline.json',
  'gallery.json',
  'drawings.json',
  'ask-nanu.json',
  'letters.json',
  'profile.json',
];

function authenticate(request: Request): boolean {
  const auth = request.headers.get('authorization');
  if (!auth) {
    console.error('[ADMIN ERR] No authorization header found.');
    return false;
  }
  
  const token = auth.replace('Bearer ', '').trim();
  // Strip potential surrounding quotes from Vercel environment variables just in case
  let expectedPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedPassword) {
    console.error('[ADMIN ERR] ADMIN_PASSWORD environment variable is empty or missing. Note: You MUST trigger a redeploy in Vercel after setting environment variables for them to take effect.');
    return false;
  }

  // If the user accidentally included quotes in their Vercel env var, remove them
  if (expectedPassword.startsWith('"') && expectedPassword.endsWith('"')) {
    expectedPassword = expectedPassword.slice(1, -1);
  } else if (expectedPassword.startsWith("'") && expectedPassword.endsWith("'")) {
    expectedPassword = expectedPassword.slice(1, -1);
  }

  if (token !== expectedPassword) {
    console.error(`[ADMIN ERR] Password mismatch! Token length: ${token.length}, Expected length: ${expectedPassword.length}. Check for typos or invisible characters.`);
    return false;
  }

  return true;
}

// GET — fetch a content file from GitHub
export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file || !ALLOWED_FILES.includes(file)) {
    return NextResponse.json(
      { error: `Invalid file. Allowed: ${ALLOWED_FILES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CONTENT_DIR}/${file}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}`, detail: err },
        { status: res.status === 401 ? 502 : res.status }
      );
    }

    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');

    return NextResponse.json({
      content: JSON.parse(content),
      sha: data.sha,
      file,
    });
  } catch (error) {
    console.error('[ADMIN] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// PUT — update a content file on GitHub
export async function PUT(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { file, content, sha, commitMessage } = body;

    if (!file || !ALLOWED_FILES.includes(file)) {
      return NextResponse.json(
        { error: `Invalid file. Allowed: ${ALLOWED_FILES.join(', ')}` },
        { status: 400 }
      );
    }

    if (content === undefined || !sha) {
      return NextResponse.json(
        { error: 'Missing required fields: content, sha' },
        { status: 400 }
      );
    }

    const encoded = Buffer.from(
      JSON.stringify(content, null, 2) + '\n'
    ).toString('base64');

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CONTENT_DIR}/${file}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage || `Update ${file} via admin dashboard`,
          content: encoded,
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}`, detail: err },
        { status: res.status === 401 ? 502 : res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      newSha: data.content.sha,
      commitUrl: data.commit.html_url,
    });
  } catch (error) {
    console.error('[ADMIN] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
