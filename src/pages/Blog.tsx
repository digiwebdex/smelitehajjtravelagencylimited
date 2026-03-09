import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";
import OptimizedImage from "@/components/ui/optimized-image";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number;
  category?: { name: string } | null;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [postsRes, catsRes] = await Promise.all([
      supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, featured_image_url, published_at, created_at, view_count, blog_categories(name)")
        .eq("is_published", true)
        .order("published_at", { ascending: false }),
      supabase
        .from("blog_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("order_index"),
    ]);

    if (postsRes.data) {
      setPosts(postsRes.data.map((p: any) => ({ ...p, category: p.blog_categories })));
    }
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  };

  const filtered = posts.filter(p => {
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (p as any).category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
              Our Blog
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Insights, guides, and tips for your sacred journey
            </p>
          </motion.div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <Skeleton className="h-48 rounded-t-lg" />
                  <CardContent className="pt-4 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No articles found.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 h-full">
                      {post.featured_image_url ? (
                        <div className="h-48 overflow-hidden">
                          <OptimizedImage
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-48 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary/20">Blog</span>
                        </div>
                      )}
                      <CardContent className="pt-4 space-y-3">
                        {post.category && (
                          <Badge variant="secondary" className="text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                        <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.published_at || post.created_at), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.view_count} views
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-primary text-sm font-medium pt-1 group-hover:gap-2 transition-all">
                          Read More <ArrowRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;