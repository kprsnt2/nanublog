import { getBlogPostBySlug, getBlogPosts } from "@/lib/blogs";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Heart, Clock, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Reactions from "@/components/reactions";
import SocialShare from "@/components/social-share";
import TableOfContents from "@/components/table-of-contents";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export async function generateStaticParams() {
    const posts = getBlogPosts();
    const params = posts.map((post) => ({ slug: post.slug }));
    return params;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post) return {};

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nanus-world.vercel.app";

    return {
        title: `${post.title} — Nanu's World`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: "article",
            publishedTime: post.date,
            authors: ["Dad (Prashanth)"],
            tags: post.tags,
            siteName: "Nanu's World",
            url: `${siteUrl}/blog/${slug}`,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
        },
    };
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
                        <Button asChild variant="ghost" className="text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:hover:text-purple-200 -ml-4">
                            <Link href="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to stories</Link>
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.category && (
                            <Badge variant="secondary" className="text-sm">{post.category}</Badge>
                        )}
                        {post.nanuAge && (
                            <Badge variant="outline" className="text-sm border-purple-200 dark:border-purple-700 text-purple-500 dark:text-purple-400">
                                📅 Nanu was {post.nanuAge} years old
                            </Badge>
                        )}
                        {post.readingTime && (
                            <Badge variant="outline" className="text-sm border-purple-200 dark:border-purple-700 text-purple-500 dark:text-purple-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {post.readingTime} min read
                            </Badge>
                        )}
                        {post.aiModel && (
                            <Badge variant="outline" className="text-sm border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">
                                <Bot className="w-3 h-3 mr-1" />
                                Written by {post.aiModel}
                            </Badge>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-purple-800 dark:text-purple-200">
                        {post.title}
                    </h1>
                    <time className="text-purple-400 dark:text-purple-500">
                        {new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </time>
                </div>

                {/* AI-generated illustration */}
                {hasIllustration && (
                    <div className="rounded-2xl overflow-hidden border-2 border-purple-100 dark:border-purple-800 shadow-md">
                        <img src={illustrationUrl} alt={`Illustration for ${post.title}`} className="w-full h-auto" />
                    </div>
                )}

                {/* Table of Contents */}
                {post.htmlContent && <TableOfContents htmlContent={post.htmlContent} />}

                {/* English content */}
                <div
                    className="prose prose-purple dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-purple-800 dark:prose-headings:text-purple-200
            prose-a:text-purple-600 dark:prose-a:text-purple-400 hover:prose-a:text-purple-800
            prose-img:rounded-xl prose-img:shadow-md
            prose-blockquote:bg-purple-50 dark:prose-blockquote:bg-purple-900/30 prose-blockquote:border-l-purple-500 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4
            prose-strong:text-purple-700 dark:prose-strong:text-purple-300
            prose-p:text-purple-900 dark:prose-p:text-purple-200 prose-li:text-purple-900 dark:prose-li:text-purple-200"
                    dangerouslySetInnerHTML={{ __html: post.htmlContent || "" }}
                />

                {/* Telugu translation */}
                {teluguHtml && (
                    <div className="mt-10 pt-8 border-t-2 border-dashed border-purple-200 dark:border-purple-700">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🇮🇳</span>
                            <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-200">తెలుగులో చదవండి</h2>
                            <span className="text-sm text-purple-400">(Read in Telugu)</span>
                        </div>
                        <div
                            className="prose prose-purple dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-purple-800 dark:prose-headings:text-purple-200
                prose-p:text-purple-900 dark:prose-p:text-purple-200 prose-li:text-purple-900 dark:prose-li:text-purple-200"
                            dangerouslySetInnerHTML={{ __html: teluguHtml }}
                        />
                    </div>
                )}

                {/* Social Share */}
                <div className="pt-4 border-t border-purple-100 dark:border-purple-800">
                    <SocialShare slug={slug} title={post.title} />
                </div>

                {/* Reactions */}
                <Reactions slug={slug} />

                {/* Dad's love note */}
                <div className="dads-note mt-12">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <span className="font-bold text-purple-700 dark:text-purple-300">From Dad</span>
                    </div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm italic">
                        Every moment with you is an adventure, Nanu. This story is saved here forever, so you can come back and smile whenever you want. Love you, kiddo! ❤️
                    </p>
                </div>
            </article>
        </main>
    );
}
