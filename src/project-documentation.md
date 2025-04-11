
# Project-Internship Management Portal Documentation

This document provides an overview of the code files in the project and explains their functions and data flow.

## Database Structure

The application uses Supabase as its backend with the following tables:

1. **faculties**: Stores faculty information for authentication
2. **projects**: Stores project information including title, domain, faculty mentor, etc.
3. **students**: Stores student information linked to projects
4. **dynamic_columns**: Stores dynamic columns that can be added by teachers
5. **dynamic_column_values**: Stores values for dynamic columns per project
6. **internships**: Stores internship information like roll number, name, organization, etc.
7. **internship_dynamic_columns**: Stores dynamic columns for internships
8. **internship_dynamic_column_values**: Stores values for dynamic internship columns

## File Structure

### Core Files

1. **App.tsx**: Main application component that sets up routing and providers
2. **index.css**: Global styles using Tailwind CSS
3. **main.tsx**: Entry point that mounts the application

### Pages

1. **pages/Login.tsx**: Login page for faculty authentication
2. **pages/Home.tsx**: Dashboard with links to Project and Internship portals
3. **pages/ProjectPortal.tsx**: Main page for the Project Portal
4. **pages/InternshipPortal.tsx**: Main page for the Internship Portal
5. **pages/Landing.tsx**: Landing page for unauthenticated users
6. **pages/NotFound.tsx**: 404 page for invalid routes

### Components

#### Project Portal Components

1. **components/ProjectTable.tsx**: Table for displaying and managing projects
2. **components/ProjectFilters.tsx**: Filters for the project table
3. **components/AddProjectModal.tsx**: Modal for adding new projects
4. **components/ImportExcelModal.tsx**: Modal for importing projects from Excel

#### Internship Portal Components

1. **components/InternshipTable.tsx**: Table for displaying and managing internships
2. **components/InternshipFilters.tsx**: Filters for the internship table

#### Common Components

1. **components/Navbar.tsx**: Navigation bar used across the application
2. **components/ui/**: Various UI components from shadcn/ui library

### Utilities

1. **lib/supabase.ts**: Functions for interacting with Supabase
2. **lib/utils.ts**: Utility functions used throughout the application
3. **integrations/supabase/client.ts**: Supabase client configuration

## Data Flow

### Authentication Flow

1. User enters credentials in Login.tsx
2. loginFaculty() in supabase.ts validates credentials
3. On success, faculty data is stored in sessionStorage
4. User is redirected to Home.tsx

### Project Portal Flow

1. ProjectPortal.tsx loads and checks authentication
2. ProjectFilters.tsx allows filtering projects
3. ProjectTable.tsx fetches and displays projects
4. AddProjectModal.tsx allows adding new projects
5. ImportExcelModal.tsx allows importing projects from Excel

### Internship Portal Flow

1. InternshipPortal.tsx loads and checks authentication
2. InternshipFilters.tsx allows filtering internships
3. InternshipTable.tsx fetches and displays internships
4. Supports adding, editing, and deleting internships
5. Supports dynamic columns and file uploads
6. Allows importing/exporting Excel data

## Functionality Overview

### Project Portal Features

- CRUD operations for projects
- Student group management
- Dynamic columns for custom evaluation parameters
- File uploads for documents
- Excel import/export

### Internship Portal Features

- CRUD operations for internships
- Dynamic columns for custom fields
- File uploads for offer letters, NOCs, and PPOs
- Date handling with automatic duration calculation
- Excel import/export

### Authentication

- Simple username/password authentication for faculty
- Session management using sessionStorage

## Default Login Credentials

- Username: dr.pankaj, Password: password
- Username: dr.anshu, Password: password
- Username: dr.meenu, Password: password
- Username: dr.swati, Password: password
