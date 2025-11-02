import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">Blog</h1>
        <p className="text-muted-foreground">Read our latest articles and insights.</p>
      </main>
      <Footer />
    </div>
  );
}
