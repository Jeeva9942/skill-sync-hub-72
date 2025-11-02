import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">Pricing</h1>
        <p className="text-muted-foreground">Choose the plan that's right for you.</p>
      </main>
      <Footer />
    </div>
  );
}
