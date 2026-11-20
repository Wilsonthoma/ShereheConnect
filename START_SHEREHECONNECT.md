      windows

#1. Database & Seed Plans

cd /path/to/ShereheConnect
sudo service postgresql start
sudo service postgresql status

pnpm --filter @shereheconnect/api exec prisma db seed




#2.Backend (PORT=3001)

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\projects\ShereheConnect\apps\api; `$env:PORT='3001'; pnpm run start:dev"


#3.Frontend (PORT=3000)

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\projects\ShereheConnect\apps\web; `$env:PORT='3000'; pnpm run dev"


#4.ngrok
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --url=sauna-heaving-freight.ngrok-free.dev 3001"



#5.darajasim (All Plans: 50, 1500, 4500 KES)

cd C:\projects\ShereheConnect
npx darajasim trigger --help

$plans = @(
  @{ Name = "STARTER"; Amount = 50 },
  @{ Name = "PRO"; Amount = 1500 },
  @{ Name = "BUSINESS"; Amount = 4500 }
)

foreach ($plan in$plans) {
  Write-Host "Triggering $($plan.Name) (KES $($plan.Amount))..."
  npx darajasim trigger --scenario success --amount $plan.Amount --phone 254708374149
}



       Kali linux

#1. Database & Seed Plans

cd /path/to/ShereheConnect
sudo service postgresql start
sudo service postgresql status

pnpm --filter @shereheconnect/api exec prisma db seed 

#2.Backend (PORT=3001)

cd /path/to/ShereheConnect/apps/api
PORT=3001 pnpm run start:dev

#3.  Frontend (PORT=3000)

cd /path/to/ShereheConnect/apps/web
PORT=3000 pnpm run dev

#4. ngrok
ngrok http --url=sauna-heaving-freight.ngrok-free.dev 3001

#5.  darajasim (All Plans: 50, 1500, 4500 KES)

cd /path/to/ShereheConnect
npx darajasim trigger --help

for amt in 50 1500 4500; do
  echo "Triggering callback for KES $amt..."
  npx darajasim trigger --scenario success --amount "$amt" --phone 254708374149
done