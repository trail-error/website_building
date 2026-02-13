Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\@prisma\engines -ErrorAction SilentlyContinue



# Create the parent folders
mkdir "node_modules\@prisma" -Force

# Create the Links (Junctions)
New-Item -ItemType Junction -Path ".\node_modules\.prisma" -Target "C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\.prisma"
New-Item -ItemType Junction -Path ".\node_modules\@prisma\engines" -Target "C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\@prisma\engines"




# Clear old manual paths so Prisma looks in the new linked folders
Remove-Item Env:PRISMA_QUERY_ENGINE_LIBRARY -ErrorAction SilentlyContinue
Remove-Item Env:PRISMA_SCHEMA_ENGINE_BINARY -ErrorAction SilentlyContinue
Remove-Item Env:PRISMA_FMT_BINARY -ErrorAction SilentlyContinue

# Set your required environment variables
$env:PRISMA_SKIP_POSTINSTALL="1"
$env:DATABASE_URL="postgresql://postgres:Pumpkin%239701451140@localhost:5432/FEBB2026"

# THE MOMENT OF TRUTH
npx prisma generate
npx prisma db push
