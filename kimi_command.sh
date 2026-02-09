curl https://api.moonshot.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-YOUR_ACTUAL_KEY_HERE" \
  -d '{
    "model": "kimi-k2-5",
    "messages": [{"role": "user", "content": "Write a Next.js API route to fetch Google Calendar events using a refresh token. The route should: 1. Get user from Clerk, 2. Fetch refresh_token from Supabase user_tokens table, 3. Exchange for Google access_token, 4. Get calendar events for next 24 hours, 5. Return JSON"}]'
  }'
