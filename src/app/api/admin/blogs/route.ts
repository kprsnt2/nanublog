import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GITHUB_OWNER = 'kprsnt2';
const GITHUB_REPO = 'nanublog';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'test2features';
const BLOGS_DIR = 'blog_drafts';

function authenticate(request: Request): boolean {
  const auth = request.headers.get('authorization');
  if (!auth) return false;

  const token = auth.replace('Bearer ', '').trim();
  let expectedPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!expectedPassword) return false;

  if (expectedPassword.startsWith('"') && expectedPassword.endsWith('"')) {
    expectedPassword = expectedPassword.slice(1, -1);
  } else if (expectedPassword.startsWith("'") && expectedPassword.endsWith("'")) {
    expectedPassword = expectedPassword.slice(1, -1);
  }

  return token === expectedPassword;
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

// GET — list all blog posts (or fetch a single post by ?slug=)
export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      // Fetch a single blog post
      const filePath = `${BLOGS_DIR}/${slug}.md`;
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
        { headers: githubHeaders(), cache: 'no-store' }
      );

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        const err = await res.text();
        return NextResponse.json(
          { error: `GitHub API error: ${res.status}`, detail: err },
          { status: res.status === 401 ? 502 : res.status }
        );
      }

      const data = await res.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');

      return NextResponse.json({ slug, content, sha: data.sha });
    }

    // List all blog posts
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${BLOGS_DIR}?ref=${GITHUB_BRANCH}`,
      { headers: githubHeaders(), cache: 'no-store' }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}`, detail: err },
        { status: res.status === 401 ? 502 : res.status }
      );
    }

    const files = await res.json();

    // Filter to only .md files, exclude _te.md translations
    const mdFiles = (files as { name: string; sha: string }[])
      .filter((f) => f.name.endsWith('.md') && !f.name.endsWith('_te.md'));

    // Fetch each file's content to extract frontmatter
    const posts = await Promise.all(
      mdFiles.map(async (file) => {
        try {
          const fileRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${BLOGS_DIR}/${file.name}?ref=${GITHUB_BRANCH}`,
            { headers: githubHeaders(), cache: 'no-store' }
          );
          if (!fileRes.ok) return null;

          const fileData = await fileRes.json();
          const content = Buffer.from(fileData.content, 'base64').toString('utf8');

          // Parse frontmatter manually (avoid importing gray-matter in edge)
          const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
          let frontmatter: Record<string, string> = {};
          let body = content;

          if (fmMatch) {
            body = fmMatch[2];
            // Simple YAML key-value parsing
            fmMatch[1].split('\n').forEach((line) => {
              const colonIdx = line.indexOf(':');
              if (colonIdx > 0) {
                const key = line.slice(0, colonIdx).trim();
                let val = line.slice(colonIdx + 1).trim();
                // Remove surrounding quotes
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                  val = val.slice(1, -1);
                }
                frontmatter[key] = val;
              }
            });
          }

          return {
            slug: file.name.replace(/\.md$/, ''),
            sha: fileData.sha,
            frontmatter,
            body,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      posts: posts.filter(Boolean),
    });
  } catch (error) {
    console.error('[ADMIN BLOGS] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

// PUT — create or update a blog post
export async function PUT(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, content, sha, commitMessage } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid slug' }, { status: 400 });
    }

    // Validate slug: only lowercase letters, numbers, hyphens
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && !/^[a-z0-9]$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug. Use only lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const filePath = `${BLOGS_DIR}/${slug}.md`;
    const encoded = Buffer.from(content).toString('base64');

    const githubBody: Record<string, string> = {
      message: commitMessage || `${sha ? 'Update' : 'Create'} blog post: ${slug}`,
      content: encoded,
      branch: GITHUB_BRANCH,
    };

    // If SHA is provided, it's an update; otherwise it's a create
    if (sha) {
      githubBody.sha = sha;
    }

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: githubHeaders(),
        body: JSON.stringify(githubBody),
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
      slug,
      newSha: data.content.sha,
      commitUrl: data.commit.html_url,
    });
  } catch (error) {
    console.error('[ADMIN BLOGS] PUT error:', error);
    return NextResponse.json({ error: 'Failed to save blog post' }, { status: 500 });
  }
}

// DELETE — delete a blog post
export async function DELETE(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, sha } = body;

    if (!slug || !sha) {
      return NextResponse.json({ error: 'Missing slug or sha' }, { status: 400 });
    }

    const filePath = `${BLOGS_DIR}/${slug}.md`;

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'DELETE',
        headers: githubHeaders(),
        body: JSON.stringify({
          message: `Delete blog post: ${slug}`,
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

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('[ADMIN BLOGS] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
