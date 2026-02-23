import { getBlogPostBySlug, getBlogPosts } from "@/lib/blogs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Reactions from "@/components/reactions";
import QrShare from "@/components/qr-share";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export async function generateStaticParams() {
    const posts = getBlogPosts();
    // Include Telugu versions too
    const params = posts.map((post) => ({ slug: post.slug }));
    return params;
}

async function getTeluguContent(slug: string): Promise<string | null> {
    const teluguPath = path.join(process.cwd(), "content", "blogs", `${slug}_te.md`);
    if (!fs.existsSync(teluguPath)) return null;
    const fileContents = fs.readFileSync(teluguPath, "utf8");
    const matterResult = matter(fileContents);
    const processedContent = await remark().use(html).process(matterResult.content);
    return processedContent.toString();
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const teluguHtml = await getTeluguContent(slug);
    const illustrationUrl = `/illustrations/${slug}.png`;
    const hasIllustration = fs.existsSync(path.join(process.cwd(), "public", "illustrations", `${slug}.png`));

    return (
        <main className="min-h-screen px-6 py-12 md:py-20">
            <article className="max-w-3xl mx-auto space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <Button asChild variant="ghost" className="text-purple-400 hover:text-purple-700 hover:bg-purple-50 -ml-4">
                            <Link href="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to stories</Link>
                        </Button>
                        <QrShare slug={slug} />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.category && (
                            <Badge variant="secondary" className="text-sm">{post.category}</Badge>
                        )}
                        {post.nanuAge && (
                            <Badge variant="outline" className="text-sm border-purple-200 text-purple-500">
                                📅 Nanu was {post.nanuAge} years old
                            </Badge>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-purple-800">
                        {post.title}
                    </h1>
                    <time className="text-purple-400">
                        {new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </time>
                </div>

                {/* AI-generated illustration */}
                {hasIllustration && (
                    <div className="rounded-2xl overflow-hidden border-2 border-purple-100 shadow-md">
                        <img src={illustrationUrl} alt={`Illustration for ${post.title}`} className="w-full h-auto" />
                    </div>
                )}

                {/* English content */}
                <div
                    className="prose prose-purple max-w-none
            prose-headings:font-bold prose-headings:text-purple-800
            prose-a:text-purple-600 hover:prose-a:text-purple-800
            prose-img:rounded-xl prose-img:shadow-md
            prose-blockquote:bg-purple-50 prose-blockquote:border-l-purple-500 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4
            prose-strong:text-purple-700
            prose-p:text-purple-900 prose-li:text-purple-900"
                    dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }}
                />

                {/* Telugu translation */}
                {teluguHtml && (
                    <div className="mt-10 pt-8 border-t-2 border-dashed border-purple-200">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🇮🇳</span>
                            <h2 className="text-2xl font-bold text-purple-800">తెలుగులో చదవండి</h2>
                            <span className="text-sm text-purple-400">(Read in Telugu)</span>
                        </div>
                        <div
                            className="prose prose-purple max-w-none
                prose-headings:font-bold prose-headings:text-purple-800
                prose-p:text-purple-900 prose-li:text-purple-900"
                            dangerouslySetInnerHTML={{ __html: teluguHtml }}
                        />
                    </div>
                )}

                {/* Reactions */}
                <Reactions slug={slug} />

                {/* Dad's love note */}
                <div className="dads-note mt-12">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <span className="font-bold text-purple-700">From Dad</span>
                    </div>
                    <p className="text-purple-600 text-sm italic">
                        Every moment with you is an adventure, Nanu. This story is saved here forever, so you can come back and smile whenever you want. Love you, kiddo! ❤️
                    </p>
                </div>
            </article>
        </main>
    );
}
