$env:PRISMA_SKIP_POSTINSTALL="1"
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING="1"
$env:DATABASE_URL="postgresql://postgres:Pumpkin%2359701451140@localhost:5432/FEBB2026?schema=public"

# Pointing to the specific files in your other project with corrected backslashes
$env:PRISMA_QUERY_ENGINE_LIBRARY="C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\.prisma\client\query_engine-windows.dll.node"
$env:PRISMA_SCHEMA_ENGINE_BINARY="C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\@prisma\engines\schema-engine-windows.exe"
$env:PRISMA_FMT_BINARY="C:\Users\mj1103\Downloads\learning_building_websites-main\node_modules\@prisma\engines\prisma-fmt-windows.exe"





1. Business Justification

The networking team currently manages POD deployment, upgrades, and AON instance work through a shared Excel file used by more than 30 engineers. As the number of PODs and deployments continues to grow, this manual tracking approach has become difficult to maintain and increasingly prone to inconsistencies.

Because multiple teams update the same spreadsheet simultaneously, it is difficult for managers to clearly track assignment ownership, workflow status, errors, and handoffs between teams. There is also no reliable way to monitor key operational metrics such as how long a POD has been assigned to an engineer, how many times a POD has been reworked, or where delays are occurring.

The proposed platform replaces the manual spreadsheet with a centralized system that tracks POD assignments, workflow progress, errors, and history in real time. The system also provides analytics, audit trails, and visibility across teams, allowing leadership to clearly monitor deployment progress and operational bottlenecks.

This ensures a consistent and scalable method for managing POD operations as deployment volume increases.

2. Financial / Business Benefit

Automating POD tracking provides several operational and financial benefits.

First, it significantly reduces manual coordination overhead. Engineers and managers currently spend considerable time updating spreadsheets, verifying assignments, and conducting status meetings. A centralized platform eliminates much of this manual effort by automatically tracking assignments, status updates, and workflow transitions.

Second, the system improves delivery reliability by providing visibility into delays, ownership, and workload distribution. Managers can quickly identify bottlenecks, reassign work when necessary, and ensure deadlines are met.

Third, the platform enables data-driven decision making. Built-in analytics allow leadership to track engineer workload, cycle times, and SLA performance across POD deployments. This visibility helps optimize staffing and process efficiency.

Overall, the system reduces operational friction, improves deployment timelines, and scales effectively as POD volume grows across the networking organization.
