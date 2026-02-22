# AIBlog Platform

A Next.js, shadcn/ui powered blog platform that automatically generates polished blog posts from rough drafts using AI (Gemini or Claude).

## Features
- **Modern UI**: Built with Next.js App Router, Tailwind CSS, and shadcn/ui.
- **Automated Blogging**: Drop a `.md` or `.txt` file with rough notes in `blog_drafts/`. Push to GitHub, and a GitHub Action will write a full blog post, save it to `content/blogs/`, and deploy! 
- **Easy Customization**: Edit `content/profile.json` to update your portfolio details instantly without touching code.

## Getting Started

1. Clone this repository.
2. Run `npm install`
3. Edit `content/profile.json` with your details.
4. Run `npm run dev` to see your portfolio and blog running locally.

## Setting up AI Automation

To let the AI write your blogs automatically via GitHub Actions:
1. Go to your repository **Settings > Secrets and variables > Actions**.
2. Add a new repository secret (you only need one, the script prioritizes Gemini):
   - `GEMINI_API_KEY` (Get from [Google AI Studio](https://aistudio.google.com/))
   - `ANTHROPIC_API_KEY` (Get from [Anthropic Console](https://console.anthropic.com/))
3. Under **Settings > Actions > General > Workflow permissions**, ensure **Read and write permissions** is selected so the action can commit the generated markdown back.

## Writing a Post
1. Create a rough notes file in the `blog_drafts` folder, e.g., `my-new-idea.txt`. Include any links to images or videos (markdown syntax works great) and write your raw thoughts.
2. Commit and push it to GitHub.
3. The GitHub Action will run, rewrite your notes into a cohesive article, generate `my-new-idea.md` in `content/blogs`, and commit it.
4. If deployed on Vercel, it will automatically trigger a new deployment to publish the new blog post!

## Deployment
Deploy easily to Vercel:
1. Push to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Your site is live!
