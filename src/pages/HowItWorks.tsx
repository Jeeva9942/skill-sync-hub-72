import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">How It Works</h1>
        <p className="text-muted-foreground">Discover how Skill Sync connects talent with opportunity.</p>
      </main>
      <Footer />
    </div>
  );
}
