# Deploy speech Edge Functions to Supabase
# Requires: npx supabase login (once) OR SUPABASE_ACCESS_TOKEN in environment
#
# Correct project ref (Speech Therapy Dashboard):
#   pijbedgxtdycloyexjpy
# NOT: pijbedgxtdycloybnhly (typo — returns 404 Not Found)

$ErrorActionPreference = "Stop"
$ProjectRef = "pijbedgxtdycloyexjpy"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Set-Location $Root

function Import-EnvKey {
  param([string]$KeyName)
  if ($env:$KeyName) { return }
  $envFile = Join-Path $Root ".env"
  if (-not (Test-Path $envFile)) { return }
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*$KeyName=(.+)$") {
      Set-Item -Path "env:$KeyName" -Value $matches[1].Trim().Trim('"').Trim("'")
    }
  }
}

Write-Host "Linking project $ProjectRef..."
npx supabase link --project-ref $ProjectRef

Import-EnvKey "ANTHROPIC_API_KEY"
Import-EnvKey "OPENAI_API_KEY"

if (-not $env:ANTHROPIC_API_KEY) {
  throw "ANTHROPIC_API_KEY not found. Set it in .env or your environment."
}
if (-not $env:OPENAI_API_KEY) {
  throw "OPENAI_API_KEY not found. Set a valid key in .env or your environment."
}

Write-Host "Setting Edge Function secrets..."
npx supabase secrets set "ANTHROPIC_API_KEY=$($env:ANTHROPIC_API_KEY)" "OPENAI_API_KEY=$($env:OPENAI_API_KEY)"

Write-Host "Deploying analyze-speech..."
npx supabase functions deploy analyze-speech --project-ref $ProjectRef

Write-Host "Deploying transcribe-speech..."
npx supabase functions deploy transcribe-speech --project-ref $ProjectRef

Write-Host "Done."
Write-Host "  analyze-speech:  https://$ProjectRef.supabase.co/functions/v1/analyze-speech"
Write-Host "  transcribe-speech: https://$ProjectRef.supabase.co/functions/v1/transcribe-speech"
