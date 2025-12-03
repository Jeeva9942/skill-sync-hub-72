import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Knowledge base content
const knowledgeBase = `
Skill Sync Platform - Knowledge Base

ABOUT SKILL SYNC
Skill Sync is a comprehensive freelancing platform connecting talented freelancers with clients seeking professional services. Similar to platforms like Fiverr, Upwork, and Freelancer, we provide a trusted marketplace for project-based work.

PLATFORM FEATURES
1. Project Posting: Clients can post detailed project requirements with budget ranges and deadlines
2. Bidding System: Freelancers can submit competitive bids with custom proposals
3. Secure Messaging: Built-in messaging system for client-freelancer communication
4. Profile Management: Comprehensive profiles showcasing skills, experience, and portfolios
5. Review System: Two-way reviews to build trust and credibility
6. Admin Dashboard: Advanced management tools for platform administrators

USER ROLES
1. Clients: Post projects, review bids, hire freelancers, and manage ongoing work
2. Freelancers: Browse projects, submit bids, showcase portfolios, and deliver services
3. Admins: Oversee platform operations, manage users, and handle support tickets

PROJECT CATEGORIES
- Web Development: Full-stack, frontend, backend development
- Mobile Development: iOS, Android, cross-platform apps
- Design: UI/UX, graphic design, brand identity
- Writing: Content writing, technical documentation, copywriting
- Marketing: SEO, social media, digital marketing campaigns
- Data Science: Analytics, machine learning, data visualization
- Other: Various specialized services

PRICING & PAYMENTS
- Currency: All transactions in Indian Rupees (₹)
- Payment Methods: Multiple secure payment options available
- Service Fee: Platform commission on successful projects
- Milestone Payments: Option for staged payment releases

VERIFICATION SYSTEM
- Document Upload: ID proof, address proof verification
- Work Samples: Portfolio verification for freelancers
- Status Levels: Unverified, Pending, Verified
- Benefits: Verified users get priority in search results

POLICIES
1. Fair Use Policy: Respectful communication and professional conduct required
2. Dispute Resolution: Dedicated support team for conflict resolution
3. Refund Policy: Case-by-case evaluation for unsatisfactory work
4. Data Privacy: Strict data protection and confidentiality measures
5. Intellectual Property: Clear ownership rights in project agreements

GETTING STARTED
For Clients:
1. Sign up and complete your profile
2. Post a detailed project with clear requirements
3. Review incoming bids and freelancer profiles
4. Select the best freelancer and start collaboration
5. Release payment upon satisfactory completion

For Freelancers:
1. Create comprehensive profile with portfolio
2. Browse available projects in your expertise
3. Submit competitive bids with detailed proposals
4. Communicate effectively with clients
5. Deliver quality work and build your reputation

SUPPORT
- Help Center: Comprehensive guides and FAQs
- Support Tickets: Submit issues for admin resolution
- Email: support@skillsync.com
- Response Time: Within 24-48 hours for most queries

ADMIN FEATURES
- User Management: View all users, grant/revoke admin rights
- Project Oversight: Monitor all active and completed projects
- Ticket Management: Handle support requests with priority levels
- Statistics Dashboard: Real-time platform analytics
- Access: Admin dashboard available to users with admin privileges

CONTACT INFORMATION
Email: support@skillsync.com
Phone: +1 (555) 123-4567
Address: Digital Services Hub, Tech Quarter
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing chatbot query:', message);

    // Build messages for OpenAI-compatible API
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for Skill Sync, a freelancing platform. Use the following knowledge base to answer questions accurately and helpfully. If you don't find the answer in the knowledge base, provide general helpful guidance but mention that the user should contact support for specific details.

Knowledge Base:
${knowledgeBase}

IMPORTANT FORMATTING RULES:
- Always be friendly, professional, and concise
- Use plain text only - DO NOT use markdown symbols like ** or * or # for formatting
- For emphasis, just use capital letters or write naturally without special symbols
- Use simple dashes (-) for bullet points, not asterisks
- Keep responses clean and easy to read without any special formatting characters`
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('Chatbot response generated successfully');

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chatbot function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
