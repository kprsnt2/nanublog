import { getBlogPosts } from "@/lib/blogs";
import BlogListClient from "@/components/blog-list-client";

export default function BlogList() {
    const blogs = getBlogPosts();

    return <BlogListClient blogs={blogs} />;
}
