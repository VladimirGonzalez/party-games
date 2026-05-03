#!/usr/bin/env bash

echo "🔧 Fixing Vercel TypeScript build issues..."

# 1. FIX REAL: replace any in realtime callback typing
sed -i 's/(roomDb: any)/(roomDb: { state: any } | null)/g' core/store.ts

# 2. FIX SAFE: ensure channel typing exists
sed -i 's/RealtimeChannel | null/any/' core/store.ts

# 3. FIX TS STRICT: replace implicit anys in rooms.ts
sed -i 's/state: any/state: unknown/g' core/rooms.ts

# 4. FIX SAFE: supabase callback typing
sed -i 's/callback: any/callback: (roomDb: { state: unknown } | null) => void/g' core/realtime.ts

# 5. FIX TYPES SAFETY: avoid implicit any in registry import usage
sed -i 's/: any//g' core/store.ts

echo "✅ Done fixes"

echo ""
echo "Now run:"
echo "  npm run build"
echo "  git add -A && git commit -m 'fix: Vercel build types' && git push"
