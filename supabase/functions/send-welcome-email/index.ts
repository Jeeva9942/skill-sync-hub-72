import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: WelcomeEmailRequest = await req.json();

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
            .highlight-box { 
              background-color: #f0f7ff; 
              border: 2px solid #4f46e5; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 24px 0; 
            }
            .highlight-text { 
              color: #4f46e5; 
              font-weight: 600; 
              margin: 0; 
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
            <h1>Welcome to Skill Sync! 🎉</h1>
            <p>Hi ${fullName},</p>
            <p>Thank you for signing up! We're excited to have you join our community of talented freelancers and innovative clients.</p>
            
            <div class="highlight-box">
              <p class="highlight-text">Get started by completing your profile and exploring opportunities that match your skills.</p>
            </div>
            
            <p><strong>What you can do:</strong></p>
            <p class="list-item">✅ Browse exciting projects</p>
            <p class="list-item">✅ Connect with talented freelancers</p>
            <p class="list-item">✅ Post your own projects</p>
            <p class="list-item">✅ Build your professional network</p>
            
            <hr>
            
            <p>If you have any questions, our support team is here to help!</p>
            
            <p class="footer">
              Best regards,<br>
              The Skill Sync Team
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Skill Sync <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Skill Sync! 🎉",
      html,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
