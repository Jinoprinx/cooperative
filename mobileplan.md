Admin and Member Dashboard Architecture Refactoring
The objective is to distinctly separate the mobile app into two independent dashboard realms: one tailored for Cooperative Members, and one tailored for Cooperative Admins (especially Main Admins), mirroring the access scopes present in the web version.

Architecture & Routing Strategy
Router Decoupling:

We will rename the current app/(tabs) directory to app/(member) since its current UI structure (Your Treasury, Quick Actions, Active Loan Progress) is designed specifically for individual members.
We will create a brand new layout directory app/(admin) tailored to administrators.
The Root Layout (app/_layout.tsx) will be updated to register both (member) and (admin) as top-level screen groups.
Auth Context Intelligence:

Modify AuthContext.tsx and the app/index.tsx default redirect parameters to intercept authentication conditionally:
If user.role === 'admin' || user.role === 'super-admin', redirect to /(admin).
Otherwise, redirect to /(member).
Proposed Changes
Navigation & Routing Engine
[MODIFY] 
AuthContext.tsx
Update the login function. After saving session and token states, perform logical routing utilizing user.role to push Admin users to /(admin) and regular users to /(member).
[MODIFY] 
app/index.tsx
Update the component's root redirect logic. Currently it unconditionally redirects to /(tabs). Adjust it to router.replace(user.role === 'admin' ? '/(admin)' : '/(member)').
[MODIFY] 
app/_layout.tsx
Swap <Stack.Screen name="(tabs)" /> with two screens: <Stack.Screen name="(member)" /> and <Stack.Screen name="(admin)" />.
Member Component Migration
[RENAME] Move (tabs) -> (member)
Physically rename the app/(tabs) directory to app/(member) using Metro's fast-refresh file mapping safely.
Admin Dashboard Implementation
[NEW] app/(admin)/_layout.tsx
Build an Admin-specific tab bar structure featuring:
Home (index.tsx): High-level overview.
Members (members.tsx): Manage users and approve new registrations.
Loans (loans.tsx): Administer and approve loan requests.
Payments (payments.tsx): Administer transaction receipts (pending-payments).
[NEW] app/(admin)/index.tsx (Admin Overview)
A powerful UI consuming backend api.get('/admin/stats').
Displays Cooperative Total Balance, total inbound deposits, withdrawals, and metrics highlighting pending loans vs pending registrations.
Render conditional text for the Main Admin logic (Main Admin vs Sub Admin capabilities).
[NEW] hooks/useAdminData.ts
Create a corresponding data hook parallel to useDashboardData.ts that specifically consumes strictly Admin endpoints using Tanstack React Query to cache and fast-refresh Admin metrics smoothly natively.
User Review Required
IMPORTANT

Admin Sub-features Setup The Admin scope is quite large. To ensure maximum stability, I suggest we tackle this progressively: Step 1 (This Plan): Build the infrastructural separation: routing guards, Member Migration, the Admin Data Hook, and the core Admin Overview Tab ((admin)/index.tsx). Step 2 (Follow-up): Build the individual approval screens (the Members tab, Loans tab, and Payments tab) and link them to Action sheets.

You can ask clarifying questions whenever the details seem sketchy.