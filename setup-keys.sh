#!/bin/bash

ENV_FILE="$(dirname "$0")/.env.local"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  App Factory 360 — Setup de API Keys"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Las keys no serán visibles mientras las escribes."
echo "Presiona Enter para saltar una key y dejarla vacía."
echo ""

prompt_key() {
  local var_name="$1"
  local label="$2"
  local hint="$3"
  echo "▸ $label"
  [ -n "$hint" ] && echo "  Hint: $hint"
  read -s -p "  $var_name= " value
  echo ""
  echo "$value"
}

ANTHROPIC_API_KEY=$(prompt_key "ANTHROPIC_API_KEY" "Anthropic API Key" "console.anthropic.com")
SUPABASE_URL=$(prompt_key "SUPABASE_URL" "Supabase URL" "supabase.com → proyecto → Settings → API")
SUPABASE_ANON_KEY=$(prompt_key "SUPABASE_ANON_KEY" "Supabase Anon Key" "")
SUPABASE_SERVICE_KEY=$(prompt_key "SUPABASE_SERVICE_KEY" "Supabase Service Role Key" "")
VERCEL_TOKEN=$(prompt_key "VERCEL_TOKEN" "Vercel Token" "vercel.com → Account Settings → Tokens")
VERCEL_TEAM_ID=$(prompt_key "VERCEL_TEAM_ID" "Vercel Team ID" "Opcional — dejar vacío si usas cuenta personal")
GITHUB_TOKEN=$(prompt_key "GITHUB_TOKEN" "GitHub Personal Access Token" "github.com → Settings → Developer settings → PAT (permisos: repo)")
RESEND_API_KEY=$(prompt_key "RESEND_API_KEY" "Resend API Key" "resend.com → API Keys")

echo ""
echo "Escribiendo .env.local..."

cat > "$ENV_FILE" <<EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VERCEL_TOKEN=$VERCEL_TOKEN
VERCEL_TEAM_ID=$VERCEL_TEAM_ID
GITHUB_TOKEN=$GITHUB_TOKEN
RESEND_API_KEY=$RESEND_API_KEY
DASHBOARD_PASSWORD=orlando360
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Verificación de keys guardadas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_key() {
  local var_name="$1"
  local value
  value=$(grep "^$var_name=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -n "$value" ]; then
    local masked="${value:0:8}************************"
    echo "  ✓ $var_name=$masked"
  else
    echo "  ✗ $var_name= (vacía)"
  fi
}

check_key "ANTHROPIC_API_KEY"
check_key "SUPABASE_URL"
check_key "SUPABASE_ANON_KEY"
check_key "SUPABASE_SERVICE_KEY"
check_key "VERCEL_TOKEN"
check_key "VERCEL_TEAM_ID"
check_key "GITHUB_TOKEN"
check_key "RESEND_API_KEY"

echo ""
echo "  ✓ DASHBOARD_PASSWORD=orlando360"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Listo. Reinicia el servidor si está corriendo:"
echo "  npm run dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
