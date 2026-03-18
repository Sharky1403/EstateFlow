Functional Specifications: EstateFlow
1. Project Overview
EstateFlow is a comprehensive property management platform designed to digitize the
lifecycle of rental management. It serves as a central hub for Landlords to manage assets
and financials, Tenants to manage their living experience, and Service Providers to receive
work orders.
The system is designed to automate manual tasks (rent collection, lease creation,
maintenance triage) and provide "Enterprise-grade" reliability for small-to-medium property
managers.

2. User Personas
The Property Manager (Landlord): Needs oversight on cash flow, occupancy, and
rapid issue resolution.
The Tenant: Needs a frictionless mobile-friendly way to pay rent, access documents,
and report issues.
The Service Contractor: Needs clear work orders and a simple way to invoice for
repairs.
The System (Automation): Acts as an intelligent agent performing background
tasks (reminders, AI analysis, penalties).
3. Detailed User Stories by Module
Module 1: Onboarding & Identity Verification
This module handles the entry into the ecosystem, ensuring trust and security.
● As a Landlord, I want to create a professional profile with my company branding
(logo, contact info), so that my tenant portal looks professional.
● As a Landlord, I want to invite tenants via email/SMS links, so they can onboard
themselves without me manually typing their data.
● As a Tenant, I want to complete an identity verification step (upload ID), so that the
landlord trusts my application.
● As a User (All roles), I want to reset my password securely via a magic link or code,
so I never lose access to my account.

Module 2: Property Asset Management
This module manages the inventory hierarchy.
● As a Landlord, I want to configure properties with a hierarchy (Building $\to$ Floor
$\to$ Unit), so I can manage multi-unit complexes accurately.
● As a Landlord, I want to store detailed metadata for each unit (square footage,
appliance serial numbers, paint codes), so I have reference data when maintenance
is needed.

● As a Landlord, I want to set "Market Rent" vs "Actual Rent" for units, so I can see
how much revenue I am losing on undervalued leases.
● As a Landlord, I want to upload and categorize unlimited media (photos/videos) for
each property, preserving a visual history of the asset condition.
Module 3: Digital Leasing & Documents
This module replaces paper contracts with dynamic generation and signing.
● As a Landlord, I want the system to generate a PDF lease agreement automatically
by merging tenant data (Name, Start Date, Rent) into my standard legal template.
● As a Landlord, I want to define custom lease clauses (e.g., "No Pets", "Smoking
Allowed"), so the contract reflects the specific rules of the property.
● As a Tenant, I want to digitally sign my lease within the app, so I don't have to print
or scan anything.
● As a Tenant, I want to access my signed lease and move-in inspection reports at any
time from my dashboard.
● As the System, I want to alert both parties 60 days before a lease expires, enabling
them to initiate renewal or termination protocols.

Module 4: Financial Management & Accounting
This is the core business engine, handling more than just simple payments.
● As a Tenant, I want to set up "Auto-Pay" using a credit card or bank transfer, so I
never miss a due date.
● As a Tenant, I want to view a detailed ledger of my payments, including security
deposits and extra fees, for my own record keeping.
● As a Landlord, I want the system to automatically apply a "Late Fee" (e.g., 5% or
fixed amount) if rent is not received by the grace period (e.g., 5th of the month).
● As a Landlord, I want to log expenses (repairs, utilities, taxes) against specific
properties, so I can calculate the precise Net Operating Income (NOI) per building.
● As a Landlord, I want to generate a "Tax Report" at year-end that summarizes all
income and deductible expenses.

Module 5: Intelligent Maintenance (AI Features)
This module uses AI to streamline the chaotic process of repairs.
● As a Tenant, I want to report a maintenance issue by uploading a photo and a short
voice note or text description.
● As the System (AI), I want to analyze the tenant's report to determine the Urgency
(Emergency vs. Routine) and Category (Plumbing, Electrical, HVAC).
● As a Landlord, I want to see a prioritized "Triage Board" where emergency tickets
are highlighted in red at the top.
● As a Landlord, I want to convert a tenant request into a "Work Order" and forward it
to a registered Contractor with one click.
● As a Contractor, I want to receive a mobile-friendly work order with access codes
and photos, and mark the job as "Complete" by uploading a photo of the fix.

Module 6: Communication & Community
Ensuring audit trails for all interactions.
● As a Landlord, I want to send "Broadcast Announcements" (e.g., "Water shut off
tomorrow") to all tenants in a specific building via SMS and Push Notification.
● As a Tenant, I want to chat directly with the property manager regarding my ticket,
keeping the conversation context linked to that specific issue.
● As a Landlord, I want to see a "Read Receipt" when I send important notices to
tenants, so I can prove they were informed.

Module 7: Analytics & Executive Dashboard
High-level business intelligence.
● As a Landlord, I want to see a live dashboard showing Occupancy Rate ,
Collection Rate (how much rent is collected vs pending), and Open Maintenance
Tickets.
● As a Landlord, I want to view trends over time (e.g., "Maintenance costs are rising in
Building A"), helping me decide if I should sell or renovate.

4. Complex Business Rules (The "Production" Detail)
To ensure this feels like a real product, the system must handle these logic flows:

Prorated Rent Calculation:
○ If a tenant moves in on the 15th, the system must automatically calculate the
partial rent for that first month based on the daily rate.
Security Deposit Handling:
○ The system must hold the security deposit in a separate "ledger bucket" and
not count it as "Revenue" until it is either forfeited or returned.
Lease Break Logic:
○ If a tenant terminates early, the system must automatically generate an
invoice for the "Lease Break Fee" as defined in the settings.
Vendor Insurance Tracking:
○ The system should prevent the Landlord from assigning a job to a Contractor
whose insurance policy document has expired in the system.
5. Non-Functional Requirements (User Experience)
● Mobile First: The Tenant portal must be fully functional on mobile browsers (as
tenants rarely use desktops for home issues).
● Offline Mode: Tenants should be able to draft a maintenance request even if they
lose internet in a basement, and it should sync when connection is restored.
● Speed: Dashboards must load financial summaries in under 1 second, even with
years of historical data.