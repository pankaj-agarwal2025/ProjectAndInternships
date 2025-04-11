
# Project Structure and Data Flow

## 1. File Structure Overview

```
src/
├── components/        # Reusable React components
│   ├── ui/            # Shadcn UI components
│   ├── AddProjectModal.tsx  # Project creation modal
│   ├── ImportExcelModal.tsx # Excel import functionality
│   ├── InternshipFilters.tsx # Filters for internships
│   ├── InternshipTable.tsx  # Main internship data table
│   ├── Navbar.tsx     # Application navigation
│   ├── ProjectFilters.tsx   # Filters for projects
│   └── ProjectTable.tsx     # Main project data table
├── hooks/             # Custom React hooks
├── integrations/      # External service integrations
│   └── supabase/      # Supabase configuration
│       ├── client.ts  # Supabase client setup
│       └── types.ts   # TypeScript definitions for Supabase
├── lib/               # Utility functions and helpers
│   └── supabase.ts    # Supabase utility functions
├── pages/             # Application pages
│   ├── Home.tsx       # Dashboard page
│   ├── InternshipPortal.tsx # Internship management
│   ├── Landing.tsx    # Public landing page
│   ├── Login.tsx      # Authentication page
│   ├── NotFound.tsx   # 404 page
│   └── ProjectPortal.tsx    # Project management
├── App.tsx            # Main application component
├── index.css          # Global styles
└── main.tsx           # Application entry point
```

## 2. Data Flow Diagrams

### Authentication Flow:
```
User enters credentials → Supabase authenticates → 
Session created → User redirected to Home
```

### Project Management Flow:
```
User navigates to Project Portal → 
Data fetched from Supabase → 
User applies filters → Filtered data displayed → 
User edits/adds/deletes records → 
Updates sent to Supabase → UI refreshed with new data
```

### Internship Management Flow:
```
User navigates to Internship Portal → 
Data fetched from Supabase → 
User applies filters → Filtered data displayed → 
User edits/adds/deletes records → 
Updates sent to Supabase → UI refreshed with new data → 
Internship duration automatically calculated
```

### File Upload Flow:
```
User selects file → File uploaded to Supabase Storage → 
URL generated → URL stored in database → 
File accessible via link in table
```

## 3. Database Schema and Relationships

### Faculties Table:
- Primary key: id
- Fields: username, password, name, created_at

### Projects Table:
- Primary key: id
- Fields: group_no, title, domain, faculty_mentor, industry_mentor, session, year, semester, faculty_coordinator, progress_form_url, presentation_url, report_url, created_at, updated_at

### Students Table:
- Primary key: id
- Foreign key: group_id → projects.id
- Fields: roll_no, name, email, program, created_at

### Internships Table:
- Primary key: id
- Fields: roll_no, name, email, phone_no, domain, session, year, semester, program, organization_name, starting_date, ending_date, internship_duration, position, offer_letter_url, noc_url, ppo_url, faculty_coordinator, created_at, updated_at

### Dynamic Columns Tables:
- Store custom fields added by faculty
- Linked to projects or internships via foreign keys

## 4. Component Interaction

1. **Navbar Component**:
   - Present on all authenticated pages
   - Provides navigation between Home, Project Portal, and Internship Portal
   - Displays logged-in user and logout option

2. **Project/Internship Tables**:
   - Central components for data management
   - Handle CRUD operations
   - Manage file uploads
   - Support inline editing
   - Implement pagination

3. **Filter Components**:
   - Provide filtering options for tables
   - Pass filter parameters to table components
   - Support multiple filter criteria

4. **Modal Components**:
   - Handle complex operations like adding new records
   - Support file uploads
   - Validate user input

## 5. State Management

- **Session State**: 
  - Managed via browser sessionStorage
  - Stores faculty authentication information

- **UI State**:
  - Local component state for UI interactions
  - React Query for server state management

- **Form State**:
  - Controlled components for form inputs
  - Validation handled per field

## 6. Key Technical Implementation Notes

1. **Responsive Design**:
   - Tailwind CSS breakpoints for different screen sizes
   - Mobile-first approach

2. **Performance Optimization**:
   - Pagination to limit data fetching
   - React Query for caching and deduplication

3. **Security**:
   - Protected routes for authenticated users only
   - Form validation to prevent malicious input

4. **Error Handling**:
   - Toast notifications for user feedback
   - Console logging for debugging
   - Try/catch blocks for API interactions
