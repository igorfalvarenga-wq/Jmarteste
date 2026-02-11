param(
  [string]$Bucket
)

if (-not $Bucket) {
  $Bucket = Read-Host "Informe o nome completo do bucket (ex: myproject.appspot.com)"
}

# Verifica gsutil
if (-not (Get-Command gsutil -ErrorAction SilentlyContinue)) {
  Write-Host "gsutil não encontrado. Instale o Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
  Write-Host "Após instalar, execute 'gcloud auth login' e volte a executar este script." -ForegroundColor Yellow
  exit 1
}

$cwd = Split-Path -Parent $MyInvocation.MyCommand.Definition
$corsFile = Join-Path $cwd 'cors.json'
if (-not (Test-Path $corsFile)) {
  Write-Host "cors.json não encontrado em: $corsFile" -ForegroundColor Red
  exit 1
}

Write-Host "Aplicando CORS no bucket gs://$Bucket usando $corsFile ..." -ForegroundColor Cyan
& gsutil cors set $corsFile "gs://$Bucket"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Erro ao aplicar CORS. Verifique permissões e autenticação (gcloud auth login)." -ForegroundColor Red
  exit 1
}

Write-Host "CORS aplicado. Conteúdo atual:" -ForegroundColor Green
& gsutil cors get "gs://$Bucket"
