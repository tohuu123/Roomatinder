// Email Templates for Roomatinder Notifications

/**
 * Base email template with styling
 */
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roomatinder</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .stats-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .stat-item:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #6c757d;
      font-weight: 500;
    }
    .stat-value {
      color: #667eea;
      font-weight: bold;
      font-size: 18px;
    }
    .highlight {
      background-color: #fff3cd;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      margin: 20px 0;
    }
    .match-banner {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 12px;
      margin: 20px 0;
    }
    .match-banner h1 {
      margin: 0 0 10px 0;
      font-size: 36px;
    }
    .profile-card {
      background-color: #ffffff;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">🏠 Roomatinder</h1>
    </div>
    ${content}
    <div class="footer">
      <p>You're receiving this email because you have an account with Roomatinder.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" style="color: #667eea;">Manage notification preferences</a></p>
      <p>&copy; ${new Date().getFullYear()} Roomatinder. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Daily Digest Email Template
 */
export function getDailyDigestTemplate(data: {
  userName: string;
  likesCount: number;
  messagesCount: number;
  intriguingLine: string;
}): string {
  const content = `
    <div class="content">
      <h2>Hi ${data.userName}! 👋</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        Here's what happened while you were away:
      </p>
      
      <div class="stats-card">
        <div class="stat-item">
          <span class="stat-label">💖 New Likes</span>
          <span class="stat-value">${data.likesCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">💬 New Messages</span>
          <span class="stat-value">${data.messagesCount}</span>
        </div>
      </div>

      ${(data.likesCount > 0 || data.messagesCount > 0) ? `
      <div class="highlight">
        <p style="margin: 0; font-size: 16px;">
          ✨ ${data.intriguingLine}
        </p>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/chatroom" class="button">
          ${data.messagesCount > 0 ? 'Check Your Messages' : 'See Your Matches'}
        </a>
      </div>

      <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        Don't let these opportunities slip away! Your next great connection might be just one message away.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
}

/**
 * Match Notification Email Template
 */
export function getMatchNotificationTemplate(data: {
  userName: string;
  matchName: string;
  matchBio?: string;
  iceBreaker: string;
}): string {
  const content = `
    <div class="content">
      <div class="match-banner">
        <h1>🎉 It's a Match!</h1>
        <p style="font-size: 18px; margin: 0;">You and ${data.matchName} liked each other!</p>
      </div>

      <h2 style="text-align: center; color: #333;">
        Congratulations, ${data.userName}!
      </h2>

      <div class="profile-card">
        <h3 style="color: #667eea; margin-top: 0;">${data.matchName}</h3>
        ${data.matchBio ? `<p style="color: #6c757d; font-style: italic;">"${data.matchBio}"</p>` : ''}
      </div>

      <div class="highlight">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #333;">💡 Ice Breaker Suggestion:</p>
        <p style="margin: 0; font-size: 16px; color: #495057;">
          "${data.iceBreaker}"
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #333; text-align: center;">
        Don't be shy! Start the conversation and see where it goes. 😊
      </p>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/chatroom" class="button">
          Start Chatting Now
        </a>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content);
}

/**
 * Inactivity Check Email Template
 */
export function getInactivityCheckTemplate(data: {
  userName: string;
  lastActiveDate: string;
  confirmUrl: string;
  deactivateUrl: string;
}): string {
  const content = `
    <div class="content">
      <h2>Hey ${data.userName}, we miss you! 💙</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        We noticed you haven't visited Roomatinder in a while (last seen: ${data.lastActiveDate}).
        We hope everything is okay!
      </p>

      <div class="highlight">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
          <strong>Are you still looking for connections?</strong><br>
          If you're taking a break, we can hide your profile from search results so you won't receive any more notifications.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        <strong>What would you like to do?</strong>
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.confirmUrl}" class="button" style="margin: 10px;">
          Yes, I'm Still Active!
        </a>
        <br>
        <a href="${data.deactivateUrl}" style="color: #6c757d; text-decoration: underline; font-size: 14px;">
          Hide my profile for now
        </a>
      </div>

      <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        Don't worry! You can reactivate your profile anytime by logging back in.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
}

/**
 * Weekly Report Email Template
 */
export function getWeeklyReportTemplate(data: {
  userName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    totalLikes: number;
    totalMessages: number;
    totalMatches: number;
    profileViews: number;
  };
  aiSummary: string;
  topMatches?: Array<{ name: string; messageCount: number }>;
}): string {
  const content = `
    <div class="content">
      <h2>Your Week in Review 📊</h2>
      
      <p style="font-size: 16px; color: #333;">
        Hi ${data.userName}! Here's how your week went (${data.weekStart} - ${data.weekEnd}):
      </p>

      <div class="stats-card">
        <div class="stat-item">
          <span class="stat-label">👁️ Profile Views</span>
          <span class="stat-value">${data.stats.profileViews}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">💖 Likes Received</span>
          <span class="stat-value">${data.stats.totalLikes}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">💬 Messages Exchanged</span>
          <span class="stat-value">${data.stats.totalMessages}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🎉 New Matches</span>
          <span class="stat-value">${data.stats.totalMatches}</span>
        </div>
      </div>

      <div class="highlight">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
          <strong>✨ AI Insight:</strong><br>
          ${data.aiSummary}
        </p>
      </div>

      ${data.topMatches && data.topMatches.length > 0 ? `
      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px;">🔥 Most Active Conversations:</h3>
        <ul style="list-style: none; padding: 0;">
          ${data.topMatches.map(match => `
            <li style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
              <strong>${match.name}</strong> - ${match.messageCount} messages
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/people" class="button">
          Discover More People
        </a>
      </div>

      <p style="font-size: 14px; color: #6c757d; text-align: center;">
        Keep being awesome! The more you engage, the better your connections. 🌟
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
}

/**
 * Account Deactivated Confirmation Email Template
 */
export function getAccountDeactivatedTemplate(data: {
  userName: string;
  reactivateUrl: string;
}): string {
  const content = `
    <div class="content">
      <h2>Your profile is now hidden</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        Hi ${data.userName},
      </p>

      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        As requested, we've hidden your profile from search results. You won't appear in other users' matches anymore and won't receive further notifications.
      </p>

      <div class="highlight">
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
          <strong>Want to come back?</strong><br>
          We'd love to see you again! You can reactivate your profile anytime.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reactivateUrl}" class="button">
          Reactivate My Profile
        </a>
      </div>

      <p style="font-size: 14px; color: #6c757d; text-align: center;">
        Take care, and we hope to see you back soon! 💙
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
}
