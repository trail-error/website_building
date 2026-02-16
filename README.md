Remove-Item -Recurse -Force .\node_modules\prisma, .\node_modules\@prisma, .\node_modules\.prisma -ErrorAction SilentlyContinue
npm install prisma @prisma/client --legacy-peer-deps --ignore-scripts




$env:PRISMA_QUERY_ENGINE_LIBRARY="C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\.prisma\client\query_engine-windows.dll.node"
$env:PRISMA_SCHEMA_ENGINE_BINARY="C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\@prisma\engines\schema-engine-windows.exe"
$env:PRISMA_FMT_BINARY="C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\@prisma\engines\prisma-fmt-windows.exe"
$env:DATABASE_URL="postgresql://postgres:Pumpkin%239701451140@localhost:5432/FEBB2026?schema=public"


npx prisma generate
npx prisma db push




https://binaries.prisma.sh/all_commits/5dbef10bdbfb579e07d35cc85fb1518d357cb99e/windows/libquery_engine-windows.dll.node.gz

https://binaries.prisma.sh/all_commits/5dbef10bdbfb579e07d35cc85fb1518d357cb99e/windows/schema-engine-windows.exe.gz

https://binaries.prisma.sh/all_commits/5dbef10bdbfb579e07d35cc85fb1518d357cb99e/windows/prisma-fmt-windows.exe.gz
