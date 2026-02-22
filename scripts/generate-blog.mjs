import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import matter from 'gray-matter';

dotenv.config();

const DRAFTS_DIR = path.join(process.cwd(), 'blog_drafts');
const POSTS_DIR = path.join(process.cwd(), 'content', 'blogs');

if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

// Calculate Nanu's current age from birthday
function getNanuAge() {
    const birthday = new Date(2019, 2, 25); // March 25, 2019
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    return age;
}

async function generateWithGemini(prompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function generateWithClaude(prompt) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
    });
    return msg.content[0].text;
}

async function processDrafts() {
    const files = fs.readdirSync(DRAFTS_DIR);
    const nanuAge = getNanuAge();

    for (const file of files) {
        if (!file.endsWith('.md') && !file.endsWith('.txt')) continue;

        const baseName = file.replace(/\.(md|txt)$/, '');
        const postPath = path.join(POSTS_DIR, `${baseName}.md`);

        // Skip if already generated
        if (fs.existsSync(postPath)) {
            console.log(`Skipping ${file}: Blog post already exists.`);
            continue;
        }

        console.log(`Processing draft: ${file}`);
        const rawContent = fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf8');

        // Parse frontmatter if present
        let draftContent = rawContent;
        let nanuSaid = '';
        let dadsNote = '';
        let category = '';

        try {
            const parsed = matter(rawContent);
            draftContent = parsed.content;
            nanuSaid = parsed.data.nanu_said || '';
            dadsNote = parsed.data.dads_note || '';
            category = parsed.data.category || '';
        } catch {
            // If no frontmatter, use raw content
        }

        const nanuQuoteInstruction = nanuSaid
            ? `\n\nIMPORTANT: Nanu actually said this: "${nanuSaid}" — You MUST weave this quote naturally into the blog post in a funny and highlighted way. Use a special callout or blockquote format like:\n> 🗣️ **Nanu said:** "${nanuSaid}"\nMake it a centerpiece moment in the story!`
            : '';

        const dadsNoteInstruction = dadsNote
            ? `\n\nAt the very end, add a "📝 Dad's Note" section with this message from Dad: "${dadsNote}"`
            : '\n\nAt the very end, add a "📝 Dad\'s Note" section with a short, loving message from Dad about this moment or memory.';

        const categoryInstruction = category
            ? `\nThe category for this post is: "${category}". Include it in the frontmatter as 'category'.`
            : '\nChoose a fun category that fits this post (e.g., "Funny Moments", "School Adventures", "Big Questions", "Family Fun", "Discoveries"). Include it in the frontmatter as \'category\'.';

        const systemPrompt = `You are a funny, warm, and loving storyteller writing a blog post for a digital scrapbook about a kid named Nanu. Nanu is currently ${nanuAge} years old.

This blog is maintained by Nanu's Dad (Prashanth) as a fun record of Nanu's childhood — the hilarious things he says, his adventures, his discoveries, and everyday moments. One day when Nanu grows up, he'll read these and smile (or cringe 😄).

YOUR WRITING STYLE:
- Write in a warm, funny, storytelling tone — like a Dad telling his friends about his kid's latest antics
- Use simple, fun language with occasional emojis (but don't overdo it — 3-5 per post max)
- Be genuinely funny — use light humor, playful exaggeration, and witty observations
- Make it feel personal and heartfelt, not generic
- Keep paragraphs short and punchy
- Use headings to break up the story
- Nanu is ${nanuAge} years old — make sure the content feels age-appropriate and references his age naturally

FRONTMATTER FORMAT:
The blog must include markdown frontmatter with these fields:
- 'title': A fun, catchy title (wrapped in double quotes)
- 'date': Today's date in ISO format "${new Date().toISOString()}" (wrapped in double quotes)
- 'excerpt': A short funny one-liner about the post (wrapped in double quotes)
- 'category': A fun category label (wrapped in double quotes)
- 'nanuAge': ${nanuAge}

IMPORTANT: You MUST wrap ALL string values in the YAML frontmatter in double quotes to prevent YAML parsing errors.
${nanuQuoteInstruction}
${dadsNoteInstruction}
${categoryInstruction}

Here are Dad's notes/draft about what happened:
---
${draftContent}
---

Output exactly the markdown with the frontmatter (no wrapping markdown formatting like \`\`\`markdown, just the raw text). Make it awesome! 🎉`;

        let finalContent = '';

        try {
            if (process.env.GEMINI_API_KEY) {
                console.log('Using Gemini API...');
                finalContent = await generateWithGemini(systemPrompt);
            } else if (process.env.ANTHROPIC_API_KEY) {
                console.log('Using Claude API...');
                finalContent = await generateWithClaude(systemPrompt);
            } else {
                console.error('No AI API key found (GEMINI_API_KEY or ANTHROPIC_API_KEY).');
                process.exit(1);
            }

            // Cleanup response formatting
            const firstDash = finalContent.indexOf('---');
            if (firstDash !== -1) {
                finalContent = finalContent.substring(firstDash);
            }
            finalContent = finalContent.replace(/\n```\s*$/g, '').trim();

            fs.writeFileSync(postPath, finalContent, 'utf8');
            console.log(`Successfully generated ${postPath}`);

        } catch (error) {
            console.error(`Failed to process ${file}:`, error);
        }
    }
}

processDrafts();
