
# Project Portal and Internship Management System

## Overview
This application is designed to help faculty members manage student projects and internships at K.R. Mangalam University. It provides a centralized platform for tracking, updating, and analyzing student progress.

## File Structure and Functionality

### Main Application Files

- **src/App.tsx**: Main application component that sets up routing and global providers for the application.
- **src/main.tsx**: Entry point of the application, sets up React rendering.

### Pages

- **src/pages/Landing.tsx**: Landing page for the application with links to login.
- **src/pages/Login.tsx**: Handles faculty authentication using username/password against the Supabase database.
- **src/pages/Home.tsx**: Dashboard after login, showing navigation to different portals.
- **src/pages/ProjectPortal.tsx**: Interface for managing student projects, groups, and related documents.
- **src/pages/InternshipPortal.tsx**: Interface for managing student internships, including organization details and related documents.
- **src/pages/NotFound.tsx**: 404 page for invalid routes.

### Components

- **src/components/Navbar.tsx**: Navigation bar shown across pages after login.
- **src/components/ProjectTable.tsx**: Displays and manages the projects data table with CRUD functionality.
- **src/components/ProjectFilters.tsx**: Filtering controls for the projects table.
- **src/components/InternshipTable.tsx**: Displays and manages the internships data table with CRUD functionality.
- **src/components/InternshipFilters.tsx**: Filtering controls for the internships table.
- **src/components/AddProjectModal.tsx**: Modal for adding new projects.
- **src/components/ImportExcelModal.tsx**: Modal for importing data from Excel sheets.

### Supabase Integration

- **src/integrations/supabase/client.ts**: Sets up the Supabase client with the project URL and anonymous key.
- **src/integrations/supabase/types.ts**: TypeScript definitions for the Supabase database tables.
- **src/lib/supabase.ts**: Utility functions for interacting with Supabase, including CRUD operations for projects, students, internships, and file handling.

### UI Components

- **src/components/ui/**: Contains reusable UI components (buttons, cards, toasts, etc.) based on shadcn/ui.

## Data Flow

1. **Authentication Flow**:
   - User enters credentials in the Login page
   - Credentials are validated against the faculties table in Supabase
   - On successful login, user data is stored in sessionStorage and redirected to Home
   - Navigation guards check for authenticated sessions before allowing access to protected routes

2. **Project Portal Flow**:
   - Projects and related student data are fetched from Supabase
   - Users can filter, add, edit, and delete projects
   - Files (progress forms, presentations, reports) can be uploaded to Supabase storage
   - Dynamic columns can be added to extend the data model

3. **Internship Portal Flow**:
   - Internship data is fetched from Supabase
   - Users can filter, add, edit, and delete internship records
   - File uploads (offer letters, NOCs, PPOs) are stored in Supabase storage
   - Excel imports process data and update the database
   - Excel exports generate downloadable files from the current data
   - Internship duration is automatically calculated from start/end dates

4. **Data Storage**:
   - All persistent data is stored in Supabase tables
   - Files are stored in Supabase storage buckets
   - Dynamic columns are stored in separate tables and linked to main entities

## Login Credentials

Default faculty accounts:
- Username: dr.pankaj, Password: password
- Username: dr.anshu, Password: password
- Username: dr.meenu, Password: password
- Username: dr.swati, Password: password

## Technical Notes

- This application uses React Router for navigation
- State management is primarily handled through React Query and local React state
- UI is built with Tailwind CSS and shadcn/ui components
- File uploads and storage use Supabase storage
- Excel imports/exports use the XLSX library
