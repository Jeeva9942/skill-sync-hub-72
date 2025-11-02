import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        <p className="text-muted-foreground">Get in touch with our support team.</p>
      </main>
      <Footer />
    </div>
  );
}
