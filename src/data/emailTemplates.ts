
export interface PresetTemplate {
    id: string;
    name: string;
    subject: string;
    category: 'Cold Outreach' | 'Follow-up' | 'Welcome' | 'Newsletter' | 'Promotion';
    htmlContent: string;
    description: string;
}

export const EMAIL_PRESETS: PresetTemplate[] = [
    // COLD OUTREACH
    {
        id: 'cold-1',
        name: 'Value Proposition Intro',
        subject: 'Question about {{company_name}}',
        category: 'Cold Outreach',
        description: 'A direct, value-first introduction focusing on solving a specific pain point.',
        htmlContent: `
<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
  <p>Hi {{first_name}},</p>
  
  <p>I've been following {{company_name}} for a while and noticed you're doing great work in [Industry/Field].</p>
  
  <p>Many companies in your space struggle with [Specific Pain Point]. We've helped organizations like [Competitor/Similar Company] increase their [Metric] by [Percentage]% within [Timeframe].</p>
  
  <p>I'd love to share a few ideas on how you could achieve similar results. Do you have 10 minutes next week for a quick chat?</p>
  
  <p>Best regards,</p>
  <p>{{sender_name}}<br>
  {{sender_company}}</p>
</div>`
    },
    {
        id: 'cold-2',
        name: 'Competitor Comparison',
        subject: 'Better results than [Competitor]?',
        category: 'Cold Outreach',
        description: 'Leverages social proof and competitive advantage.',
        htmlContent: `
<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
  <p>Hi {{first_name}},</p>
  
  <p>I'm reaching out because I saw that you're currently using [Competitor Tool]. While they are a decent option, many of our clients switched to us because they needed [Key Feature/Benefit] which we specialize in.</p>
  
  <p>We recently helped a client reduce their [Cost/Time] by [X]%. I think we could do the same for {{company_name}}.</p>
  
  <p>Would you be open to a brief comparison to see if we can offer you better value?</p>
  
  <p>Cheers,</p>
  <p>{{sender_name}}</p>
</div>`
    },

    // FOLLOW UP
    {
        id: 'follow-1',
        name: 'Gentle Nudge',
        subject: 'Thoughts on my last email?',
        category: 'Follow-up',
        description: 'A polite follow-up for when you haven\'t heard back.',
        htmlContent: `
<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
  <p>Hi {{first_name}},</p>
  
  <p>I know how busy things can get, so I wanted to quickly bump this to the top of your inbox.</p>
  
  <p>I'm still very interested in discussing how we can help {{company_name}} with [Goal]. If now isn't a good time, just let me know when might work better.</p>
  
  <p>Thanks,</p>
  <p>{{sender_name}}</p>
</div>`
    },
    {
        id: 'follow-2',
        name: 'New Resource Share',
        subject: 'Thought you might like this article',
        category: 'Follow-up',
        description: 'Adding value without asking for anything immediately.',
        htmlContent: `
<div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
  <p>Hi {{first_name}},</p>
  
  <p>I came across this article about [Relevant Topic] and thought of our conversation about [Pain Point].</p>
  
  <p>[Link to Article]</p>
  
  <p>It has some interesting points about [Key Takeaway]. Hope you find it useful!</p>
  
  <p>Best,</p>
  <p>{{sender_name}}</p>
</div>`
    },

    // WELCOME
    {
        id: 'welcome-1',
        name: 'Classic Welcome',
        subject: 'Welcome to {{brand_name}}! 🚀',
        category: 'Welcome',
        description: 'Standard warm welcome email for new users or subscribers.',
        htmlContent: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px;">
    <h1>Welcome to the family, {{first_name}}!</h1>
  </div>
  
  <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
    <p>We're thrilled to have you on board. At {{brand_name}}, our mission is to help you [Mission/Goal].</p>
    
    <p>Here are three things you can do to get started right away:</p>
    <ul>
      <li><strong>Step 1:</strong> Complete your profile</li>
      <li><strong>Step 2:</strong> Explore our [Key Feature]</li>
      <li><strong>Step 3:</strong> Read our <a href="#">getting started guide</a></li>
    </ul>
    
    <p>If you have any questions, just hit reply. We're here to help.</p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
    <p>© {{current_year}} {{brand_name}}. All rights reserved.</p>
  </div>
</div>`
    },

    // NEWSLETTER
    {
        id: 'news-1',
        name: 'Weekly Digest',
        subject: 'Update: What\'s happening this week',
        category: 'Newsletter',
        description: 'Clean layout for sharing news and updates.',
        htmlContent: `
<div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
  <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">Access Weekly</h1>
  </div>
  
  <div style="padding: 20px;">
    <h2 style="color: #333;">Top Story: [Headline]</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <a href="#" style="color: #007bff; text-decoration: none; font-weight: bold;">Read More →</a>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
    
    <h3 style="color: #444;">In Other News</h3>
    <ul>
      <li>Update 1: [Short description]</li>
      <li>Update 2: [Short description]</li>
      <li>Update 3: [Short description]</li>
    </ul>
    
    <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <strong>Tip of the week:</strong> Use [Feature] to save time on [Task].
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; background-color: #f9f9f9;">
    <p>You received this email because you subscribed to our newsletter.</p>
    <p><a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a></p>
  </div>
</div>`
    },

    // PROMOTION
    {
        id: 'promo-1',
        name: 'Flash Sale',
        subject: '24 Hours Only: 50% Off',
        category: 'Promotion',
        description: 'Urgency-driven promotional template.',
        htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; text-align: center; border: 1px solid #eee;">
  <div style="background-color: #e63946; color: white; padding: 30px;">
    <h1 style="margin: 0; font-size: 36px;">FLASH SALE</h1>
    <p style="font-size: 18px;">Don't miss out!</p>
  </div>
  
  <div style="padding: 30px;">
    <h2>Get 50% Off Everything</h2>
    <p style="color: #555;">For the next 24 hours, we're slashing prices on all our [Products/Services]. This is the perfect time to upgrade.</p>
    
    <div style="margin: 30px 0;">
      <a href="#" style="background-color: #e63946; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Shop Now</a>
    </div>
    
    <p style="font-size: 14px; color: #777;">*Offer expires tomorrow at midnight.</p>
  </div>
</div>`
    }
];
