import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HireNotificationRequest {
  clientEmail: string;
  clientName: string;
  freelancerName: string;
  projectTitle: string;
  bidAmount: number;
  deliveryDays: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      clientName, 
      freelancerName, 
      projectTitle, 
      bidAmount, 
      deliveryDays 
    }: HireNotificationRequest = await req.json();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; 
              background-color: #f6f9fc; 
              margin: 0; 
              padding: 40px 20px; 
            }
            .container { 
              background-color: #ffffff; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px; 
              border-radius: 8px; 
            }
            h1 { 
              color: #1a1a1a; 
              font-size: 32px; 
              font-weight: bold; 
              margin: 0 0 30px; 
            }
            p { 
              color: #333; 
              font-size: 16px; 
              line-height: 1.6; 
              margin: 16px 0; 
            }
            .project-box { 
              background-color: #f0f7ff; 
              border: 2px solid #10b981; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 24px 0; 
            }
            .project-title { 
              color: #10b981; 
              font-size: 18px; 
              font-weight: 700; 
              margin: 0 0 16px 0; 
            }
            .detail { 
              color: #333; 
              margin: 8px 0; 
            }
            .list-item { 
              color: #333; 
              margin: 8px 0; 
            }
            hr { 
              border: none; 
              border-top: 1px solid #e6e6e6; 
              margin: 30px 0; 
            }
            .footer { 
              color: #666; 
              font-size: 14px; 
              margin-top: 30px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Congratulations! 🎊</h1>
            <p>Hi ${clientName},</p>
            <p>Great news! You've successfully hired <strong>${freelancerName}</strong> for your project.</p>
            
            <div class="project-box">
              <p class="project-title">📋 Project Details</p>
              <p class="detail"><strong>Project:</strong> ${projectTitle}</p>
              <p class="detail"><strong>Freelancer:</strong> ${freelancerName}</p>
              <p class="detail"><strong>Amount:</strong> ₹${bidAmount}</p>
              <p class="detail"><strong>Delivery:</strong> ${deliveryDays} days</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <p class="list-item">📱 The freelancer will be notified immediately</p>
            <p class="list-item">💬 You can message them directly through the platform</p>
            <p class="list-item">📊 Track progress in your dashboard</p>
            <p class="list-item">✅ Review and approve deliverables when complete</p>
            
            <hr>
            
            <p>We're excited to see your project come to life! If you need any assistance, our support team is always here to help.</p>
            
            <p class="footer">
              Best of luck with your project!<br>
              The Skill Sync Team
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Skill Sync <notifications@resend.dev>",
      to: [clientEmail],
      subject: `Great news! ${freelancerName} has been hired for ${projectTitle}`,
      html,
    });

    console.log("Hire notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending hire notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
