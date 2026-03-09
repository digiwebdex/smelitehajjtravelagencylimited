import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import OptimizedImage from "@/components/ui/optimized-image";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  seo_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number;
  blog_categories?: { name: string } | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchPost(slug);
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*, blog_categories(name)")
      .eq("slug", postSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (data) {
      setPost(data);
      // Increment view count
      await supabase
        .from("blog_posts")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id);

      // Update page title
      document.title = data.seo_title || data.title;
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16 container max-w-3xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16 container text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <article className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>

            {post.blog_categories && (
              <Badge variant="secondary" className="mb-4">{post.blog_categories.name}</Badge>
            )}

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at || post.created_at), "MMMM dd, yyyy")}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.view_count} views
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto">
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
            </div>

            {post.featured_image_url && (
              <div className="rounded-xl overflow-hidden mb-8">
                <OptimizedImage
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto max-h-[500px]"
                />
              </div>
            )}

            <div
              className="prose prose-lg max-w-none dark:prose-invert 
                prose-headings:font-heading prose-headings:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;