# Deploy speech Edge Functions to Supabase
# Requires: npx supabase login (once) OR SUPABASE_ACCESS_TOKEN in environment
#
# Project ref: pijbedgxtdycloyexjpy

$ErrorActionPreference = 'Stop'
$ProjectRef = 'pijbedgxtdycloyexjpy'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Set-Location $Root

function Get-EnvValue {
  param([string]$KeyName)

  $existing = [Environment]::GetEnvironmentVariable($KeyName)
  if ($existing) {
    return $existing
  }

  $envFile = Join-Path $Root '.env'
  if (-not (Test-Path $envFile)) {
    return $null
  }

  $pattern = '^\s*' + [regex]::Escape($KeyName) + '=(.+)$'
  foreach ($line in Get-Content $envFile) {
    if ($line -match $pattern) {
      $value = $matches[1].Trim()
      $value = $value.Trim([char]34)
      $value = $value.Trim([char]39)
      return $value
    }
  }

  return $null
}

Write-Host ('Linking project ' + $ProjectRef + '...')
npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to link Supabase project. Run: npx supabase login'
}

$anthropicKey = Get-EnvValue 'ANTHROPIC_API_KEY'
$openaiKey = Get-EnvValue 'OPENAI_API_KEY'

if (-not $anthropicKey) {
  throw 'ANTHROPIC_API_KEY not found. Set a valid Anthropic key in .env'
}
if (-not $openaiKey) {
  throw 'OPENAI_API_KEY not found. Set a valid OpenAI key in .env'
}

$secretsFile = Join-Path $Root 'supabase\.secrets.deploy.tmp'
$secretLines = @(
  ('ANTHROPIC_API_KEY=' + $anthropicKey),
  ('OPENAI_API_KEY=' + $openaiKey)
)
Set-Content -Path $secretsFile -Encoding ascii -Value $secretLines

Write-Host 'Setting Edge Function secrets from .env...'
npx supabase secrets set --env-file $secretsFile --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  Remove-Item $secretsFile -Force -ErrorAction SilentlyContinue
  throw 'Failed to set Supabase secrets. Run: npx supabase login, then npm run deploy:speech-functions'
}

Remove-Item $secretsFile -Force -ErrorAction SilentlyContinue

Write-Host 'Deploying analyze-speech...'
npx supabase functions deploy analyze-speech --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to deploy analyze-speech'
}

Write-Host 'Deploying transcribe-speech...'
npx supabase functions deploy transcribe-speech --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to deploy transcribe-speech'
}

Write-Host 'Done.'
Write-Host ('  analyze-speech:    https://' + $ProjectRef + '.supabase.co/functions/v1/analyze-speech')
Write-Host ('  transcribe-speech: https://' + $ProjectRef + '.supabase.co/functions/v1/transcribe-speech')
