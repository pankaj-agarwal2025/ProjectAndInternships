
# K.R. Mangalam University: Project and Internship Management Portal

## Project Overview
This application serves as a comprehensive management system for faculty members to oversee student projects and internships at K.R. Mangalam University. It provides tools for tracking, evaluation, and document management in an organized and efficient manner.

## File Structure and Functionality

### Core Application Files

- **src/App.tsx**: Main application component that sets up routing and global providers.
- **src/main.tsx**: Entry point that renders the React application.
- **src/index.css**: Global styles and Tailwind CSS configuration.

### Pages

- **src/pages/Landing.tsx**: Public landing page with a visually appealing introduction and login access.
- **src/pages/Login.tsx**: Authentication page for faculty members with secure login functionality.
- **src/pages/Home.tsx**: Dashboard after login showing navigation options to different portals.
- **src/pages/ProjectPortal.tsx**: Comprehensive interface for managing student projects and related documents.
- **src/pages/InternshipPortal.tsx**: Interface for tracking and managing student internships, organizations, and documents.
- **src/pages/NotFound.tsx**: 404 error page for invalid routes.

### Components

- **src/components/Navbar.tsx**: Navigation bar with responsive design, providing consistent navigation across the application.
- **src/components/ProjectTable.tsx**: Data table for projects with inline editing, sorting, and filtering capabilities.
- **src/components/ProjectFilters.tsx**: Filter controls for the projects table with multiple filter options.
- **src/components/InternshipTable.tsx**: Data table for internships with inline editing, file management, and dynamic columns.
- **src/components/InternshipFilters.tsx**: Filter controls for the internship table with multiple filter options.
- **src/components/AddProjectModal.tsx**: Modal for creating new projects with form validation.
- **src/components/ImportExcelModal.tsx**: Modal for importing data from Excel sheets with validation and mapping.

### Supabase Integration

- **src/integrations/supabase/client.ts**: Supabase client configuration with API credentials.
- **src/lib/supabase.ts**: Utility functions for database operations and file storage.

### UI Components

- **src/components/ui/**: Reusable UI components from the shadcn/ui library.

## Data Flow

### Authentication Flow
1. User enters credentials on the Login page
2. Credentials are verified against the `faculties` table in Supabase
3. On successful authentication, user data is stored in sessionStorage and redirected to Home
4. Protected routes check for valid session before rendering

### Project Portal Flow
1. Projects data is fetched from Supabase tables
2. Users can filter projects by various criteria
3. CRUD operations are performed directly on the table
4. File uploads (progress forms, presentations, reports) are stored in Supabase storage
5. Dynamic columns can be added by faculty for custom evaluation criteria

### Internship Portal Flow
1. Internship data is retrieved from Supabase
2. Faculty can add, edit, and delete internship records
3. Document management supports offer letters, NOCs, and PPOs
4. Excel import/export functionality for bulk operations
5. Automatic calculation of internship duration from start/end dates
6. Dynamic columns for custom evaluation parameters

## Database Structure

### Tables

1. **faculties**: Stores faculty member credentials and information
   - id, username, password, name, created_at

2. **projects**: Core project information
   - id, group_no, title, domain, faculty_mentor, industry_mentor, session, year, semester, faculty_coordinator, progress_form_url, presentation_url, report_url, created_at, updated_at

3. **students**: Student information linked to projects
   - id, group_id (references projects), roll_no, name, email, program, created_at

4. **dynamic_columns**: Custom columns for project evaluation
   - id, name, type, created_at

5. **dynamic_column_values**: Values for custom columns
   - id, column_id (references dynamic_columns), project_id (references projects), value, created_at

6. **internships**: Internship information
   - id, roll_no, name, email, phone_no, domain, session, year, semester, program, organization_name, starting_date, ending_date, internship_duration, position, offer_letter_url, noc_url, ppo_url, faculty_coordinator, created_at, updated_at

7. **internship_dynamic_columns**: Custom columns for internship evaluation
   - id, name, type, created_at

8. **internship_dynamic_column_values**: Values for custom internship columns
   - id, column_id (references internship_dynamic_columns), internship_id (references internships), value, created_at

### Storage Buckets

- **documents**: Stores all uploaded files with public access policies

## Login Credentials

Default faculty accounts:
- Username: dr.pankaj, Password: password
- Username: dr.anshu, Password: password
- Username: dr.meenu, Password: password
- Username: dr.swati, Password: password

## Technical Implementation Details

### Frontend Framework
- React with TypeScript for type safety
- React Router for navigation
- React Query for data fetching and state management
- Framer Motion for smooth animations

### Styling and UI
- Tailwind CSS for utility-based styling
- Shadcn/UI for consistent component design
- Responsive design for all device sizes
- Lucide React for SVG icons

### Data Management
- Supabase for backend database and authentication
- Real-time data updates with Supabase subscriptions
- File storage with Supabase storage buckets
- Excel import/export using XLSX library

### Authentication
- Session-based authentication
- Role-based access control (faculty only)
- Protected routes requiring authentication

## Key Features

- **Inline Editing**: Edit data directly in tables without separate forms
- **Document Management**: Upload, view, and manage project/internship documents
- **Automatic Calculations**: Internship duration calculated from dates
- **Date Formatting**: Dates displayed in dd-mm-yyyy format for better readability
- **Dynamic Columns**: Faculty can add custom evaluation parameters
- **Excel Integration**: Import/export data in Excel format
- **Responsive Design**: Works on desktop and mobile devices
- **User-Friendly Interface**: Intuitive navigation and clear visual hierarchy

## Future Enhancements
- Add email notifications for updates and deadlines
- Implement student view with limited permissions
- Add reporting and analytics dashboard
- Add evaluation rubrics and grading systems
- Integrate with university calendar for scheduling
