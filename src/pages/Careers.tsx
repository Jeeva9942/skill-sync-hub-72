import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Careers() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">Careers</h1>
        <p className="text-muted-foreground">Join our team and help shape the future of freelancing.</p>
      </main>
      <Footer />
    </div>
  );
}
