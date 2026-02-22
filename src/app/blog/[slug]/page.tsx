import { getBlogPostBySlug, getBlogPosts } from '@/lib/blogs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export async function generateStaticParams() {
    const posts = getBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <main className="min-h-screen px-6 py-12 md:py-24">
            <article className="max-w-3xl mx-auto space-y-8">
                <div>
                    <Button asChild variant="ghost" className="mb-8 -ml-4 text-purple-400 hover:text-purple-700 hover:bg-purple-50">
                        <Link href="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to stories</Link>
                    </Button>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.category && (
                            <Badge variant="secondary" className="text-sm">
                                {post.category}
                            </Badge>
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
                        {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </time>
                </div>

                <div
                    className="prose prose-purple max-w-none
                        prose-headings:font-bold prose-headings:text-purple-800
                        prose-a:text-purple-600 hover:prose-a:text-purple-800
                        prose-img:rounded-xl prose-img:shadow-md
                        prose-blockquote:bg-purple-50 prose-blockquote:border-l-purple-500 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4
                        prose-strong:text-purple-700
                        prose-p:text-purple-900 prose-li:text-purple-900"
                    dangerouslySetInnerHTML={{ __html: post.htmlContent || '' }}
                />

                {/* Footer - Dad's love note */}
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
