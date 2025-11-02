import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">About Skill Sync</h1>
        <p className="text-muted-foreground">Learn more about our mission and values.</p>
      </main>
      <Footer />
    </div>
  );
}
