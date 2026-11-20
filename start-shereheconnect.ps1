$ErrorActionPreference = "Stop"
$RepoRoot = "C:\projects\ShereheConnect"
Set-Location $RepoRoot

Write-Host "=== 1. Starting PostgreSQL ===" -ForegroundColor Cyan
$pgServices = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue
if ($pgServices) {
  foreach ($svc in $pgServices) {
    if ($svc.Status -ne "Running") {
      Write-Host "Starting service: $($svc.Name)" -ForegroundColor Yellow
      Start-Service -Name $svc.Name
    } else {
      Write-Host "Service already running: $($svc.Name)" -ForegroundColor Green
    }
  }
} else {
  Write-Host "No PostgreSQL Windows service matched; checking port 5432..." -ForegroundColor Yellow
}

$port5432 = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $port5432) {
  throw "PostgreSQL is not listening on port 5432. Start PostgreSQL and re-run."
}
Write-Host "PostgreSQL is listening on port 5432." -ForegroundColor Green

Write-Host "=== 2. Seeding Subscription Plans ===" -ForegroundColor Cyan
pnpm --filter @shereheconnect/api exec prisma db seed

Write-Host "=== 3. Starting NestJS Backend (Port 3001) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$RepoRoot\apps\api`"; `$env:PORT='3001'; pnpm run start:dev"

Write-Host "=== 4. Starting Next.js Frontend (Port 3000) ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$RepoRoot\apps\web`"; `$env:PORT='3000'; pnpm run dev"

Write-Host "=== 5. Starting ngrok Tunnel ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --url=sauna-heaving-freight.ngrok-free.dev 3001"

Start-Sleep -Seconds 4

Write-Host "=== 6. Triggering darajasim Callbacks (STARTER, PRO, BUSINESS) ===" -ForegroundColor Cyan
$plans = @(
  @{ Name = "STARTER"; Amount = 50 },
  @{ Name = "PRO"; Amount = 1500 },
  @{ Name = "BUSINESS"; Amount = 4500 }
)

foreach ($plan in $plans) {
  Write-Host "Triggering $($plan.Name) (KES $($plan.Amount))..." -ForegroundColor Yellow
  npx darajasim trigger --scenario success --amount $plan.Amount --phone 254708374149
}

Write-Host "=== All startup and simulation steps completed ===" -ForegroundColor Green
