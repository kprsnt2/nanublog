import { getBlogPosts } from "@/lib/blogs";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function OnThisDay() {
    const blogs = getBlogPosts();
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const matchingBlogs = blogs.filter((blog) => {
        const blogDate = new Date(blog.date);
        return blogDate.getMonth() === todayMonth && blogDate.getDate() === todayDate && blogDate.getFullYear() !== today.getFullYear();
    });

    if (matchingBlogs.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-800 text-center">📅 On This Day</h2>
            <div className="space-y-3">
                {matchingBlogs.map((blog) => {
                    const yearsAgo = today.getFullYear() - new Date(blog.date).getFullYear();
                    return (
                        <Card key={blog.slug} className="card-bounce bg-gradient-to-r from-yellow-50 to-pink-50 border-yellow-200 shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-sm text-yellow-600 font-semibold mb-1">
                                    {yearsAgo} year{yearsAgo !== 1 ? "s" : ""} ago today
                                </p>
                                <Link href={`/blog/${blog.slug}`} className="text-purple-800 font-bold hover:underline">
                                    {blog.title}
                                </Link>
                                <p className="text-purple-500 text-sm mt-1">{blog.excerpt}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
