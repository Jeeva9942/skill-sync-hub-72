import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, Upload, FileText, Shield, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Verification() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState({
    idProof: "",
    addressProof: "",
    workSamples: "",
    additionalInfo: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await fetchProfile(user.id);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "pending",
          verification_documents: documents
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Verification Submitted!",
        description: "Your verification request has been submitted. We'll review it within 2-3 business days.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-hero rounded-full">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Get <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Verified</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Boost your credibility and stand out to clients
            </p>
            {profile?.verification_status && (
              <Badge 
                variant={
                  profile.verification_status === "verified" ? "default" :
                  profile.verification_status === "pending" ? "secondary" :
                  "outline"
                }
                className="text-sm px-4 py-1"
              >
                Status: {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
              </Badge>
            )}
          </div>

          {profile?.verification_status === "verified" ? (
            <Card className="text-center p-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're Verified!</h2>
              <p className="text-muted-foreground">
                Your profile is verified. You have a verified badge on your profile.
              </p>
            </Card>
          ) : profile?.verification_status === "pending" ? (
            <Card className="text-center p-12">
              <FileText className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Verification Pending</h2>
              <p className="text-muted-foreground">
                Your verification is under review. We'll notify you within 2-3 business days.
              </p>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Verification Process</CardTitle>
                <CardDescription>
                  Submit the following information to get verified. This helps build trust with clients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="idProof">
                      <Upload className="inline h-4 w-4 mr-2" />
                      Government ID Proof URL
                    </Label>
                    <Input
                      id="idProof"
                      type="url"
                      placeholder="https://drive.google.com/... or link to ID document"
                      value={documents.idProof}
                      onChange={(e) => setDocuments({ ...documents, idProof: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your ID to a cloud service and paste the link here
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressProof">
                      <Upload className="inline h-4 w-4 mr-2" />
                      Address Proof URL
                    </Label>
                    <Input
                      id="addressProof"
                      type="url"
                      placeholder="https://drive.google.com/... or link to address proof"
                      value={documents.addressProof}
                      onChange={(e) => setDocuments({ ...documents, addressProof: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Utility bill, bank statement, or similar document
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workSamples">
                      <FileText className="inline h-4 w-4 mr-2" />
                      Work Samples / Portfolio (Optional)
                    </Label>
                    <Input
                      id="workSamples"
                      type="url"
                      placeholder="https://portfolio.com or link to work samples"
                      value={documents.workSamples}
                      onChange={(e) => setDocuments({ ...documents, workSamples: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <Textarea
                      id="additionalInfo"
                      placeholder="Any additional information you'd like to provide..."
                      value={documents.additionalInfo}
                      onChange={(e) => setDocuments({ ...documents, additionalInfo: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Benefits of Verification
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Verified badge on your profile</li>
                      <li>• Increased trust from clients</li>
                      <li>• Higher visibility in search results</li>
                      <li>• Access to premium projects</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-hero hover:opacity-90"
                  >
                    {submitting ? "Submitting..." : "Submit for Verification"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
