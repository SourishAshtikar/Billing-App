# HCLTech Billing Application - System Flowchart

## Application Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer (React + Vite)"
        UI[User Interface]
        Auth[Authentication Context]
        Routes[React Router]
        Components[UI Components]
    end
    
    subgraph "Server Layer (Node.js + Express)"
        API[REST API Endpoints]
        Controllers[Controllers]
        Middleware[Auth Middleware]
        Prisma[Prisma ORM]
    end
    
    subgraph "Database Layer"
        DB[(PostgreSQL Database)]
    end
    
    UI --> Auth
    Auth --> Routes
    Routes --> Components
    Components --> API
    API --> Middleware
    Middleware --> Controllers
    Controllers --> Prisma
    Prisma --> DB
```

## User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthContext
    participant API
    participant Server
    participant Database
    
    User->>LoginPage: Enter credentials
    LoginPage->>AuthContext: login(email, password)
    AuthContext->>API: POST /api/auth/login
    API->>Server: Validate credentials
    Server->>Database: Query user by email
    Database-->>Server: User data
    Server->>Server: Compare password hash
    Server-->>API: JWT token (httpOnly cookie)
    API-->>AuthContext: User object
    AuthContext-->>User: Redirect to Dashboard
```

## Main Application Workflows

### 1. Admin Dashboard Flow

```mermaid
flowchart TD
    Start([Admin Login]) --> Dashboard[Admin Dashboard]
    Dashboard --> Projects[View Projects]
    Dashboard --> Resources[View Resources]
    Dashboard --> Billing[View Billing Chart]
    
    Projects --> CreateProject[Create New Project]
    Projects --> ManageResources[Manage Project Resources]
    
    ManageResources --> AssignResource[Assign Resource to Project]
    AssignResource --> SetRate[Set Rate & Rate Type]
    AssignResource --> SetDays[Set Assigned Days]
    AssignResource --> SetStartDate[Set Start Date]
    
    Resources --> ViewAnalytics[View Resource Analytics]
    ViewAnalytics --> MonthlyBreakdown[Monthly Working Days Chart]
    ViewAnalytics --> AnnualStats[Annual Allocation Stats]
    
    Billing --> AnnualTrend[View Annual Billing Trend]
    Billing --> FilterProject[Filter by Project]
    Billing --> FilterYear[Filter by Year]
```

### 2. Project Management Flow

```mermaid
flowchart LR
    A[Projects Page] --> B{Action}
    B -->|Create| C[Create Project Modal]
    B -->|Edit| D[Edit Project Modal]
    B -->|View| E[Project Details]
    B -->|Manage Resources| F[Manage Resources Modal]
    
    C --> G[Enter Project Details]
    G --> H[Submit]
    H --> I[Save to Database]
    
    F --> J[View Assigned Resources]
    F --> K[Assign New Resource]
    F --> L[Remove Resource]
    
    K --> M[Select Resource]
    M --> N[Set Rate & Type]
    N --> O[Set Assigned Days]
    O --> P[Set Start Date]
    P --> Q[Save Assignment]
```

### 3. Resource Analytics Flow

```mermaid
flowchart TD
    A[Resources Page] --> B[Click Resource Card]
    B --> C[Resource Analytics Modal Opens]
    
    C --> D[Select Month & Year]
    D --> E[Fetch Working Days Data]
    
    E --> F[Display Pie Chart]
    E --> G[Display Monthly Stats]
    E --> H[Display Annual Stats]
    
    F --> F1[Working Days]
    F --> F2[Leave Days]
    
    G --> G1[Total Days in Month]
    G --> G2[Business Days Available]
    G --> G3[Actual Worked Days]
    G --> G4[Leave Days]
    
    H --> H1[Annually Allocated Days]
    H --> H2[Year-to-Date Exhausted]
    H --> H3[Remained Annual Days]
```

### 4. Billing Performance Flow

```mermaid
flowchart TD
    A[Admin Dashboard] --> B[Billing Performance Chart]
    B --> C{Select Filters}
    
    C --> D[Select Year]
    C --> E[Select Project or All]
    
    D --> F[Fetch Annual Billing Data]
    E --> F
    
    F --> G[Calculate Monthly Costs]
    G --> H[For Each Month]
    
    H --> I[Get All Resources Assigned]
    I --> J[Calculate Billable Days]
    J --> K[Subtract Weekends]
    K --> L[Subtract Leaves]
    L --> M[Apply Rate Type]
    
    M --> N{Rate Type?}
    N -->|Daily| O[Cost = Days × Rate]
    N -->|Hourly| P[Cost = Days × 8 × Rate]
    
    O --> Q[Aggregate Monthly Total]
    P --> Q
    
    Q --> R[Display Line Chart]
    R --> S[Show 12 Months Trend]
```

### 5. Leave Management Flow

```mermaid
flowchart LR
    A[Resource User] --> B[Apply for Leave]
    B --> C[Select Date]
    C --> D[Submit Leave Request]
    D --> E[Save to Database]
    
    E --> F[Leave Recorded]
    F --> G[Affects Billing Calculation]
    F --> H[Affects Working Days Analytics]
    
    G --> I[Reduces Billable Days]
    H --> J[Shows in Monthly Breakdown]
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Frontend State Management"
        A[AuthContext] --> B[User State]
        C[API Service Layer] --> D[Axios Requests]
    end
    
    subgraph "API Routes"
        E[/api/auth/*] --> F[Auth Controller]
        G[/api/projects/*] --> H[Project Controller]
        I[/api/resources/*] --> J[Resource Controller]
        K[/api/billing/*] --> L[Billing Controller]
        M[/api/leaves/*] --> N[Leave Controller]
    end
    
    subgraph "Database Schema"
        O[User Table]
        P[Project Table]
        Q[ProjectResource Table]
        R[Leave Table]
        S[BillingReport Table]
    end
    
    D --> E
    D --> G
    D --> I
    D --> K
    D --> M
    
    F --> O
    H --> P
    H --> Q
    J --> O
    J --> Q
    L --> P
    L --> Q
    L --> R
    N --> R
```

## Key Features Summary

### Admin Features
- **Dashboard**: Overview of projects, resources, and billing performance
- **Project Management**: Create, edit, delete projects
- **Resource Assignment**: Assign resources to projects with rates and dates
- **Billing Analytics**: Annual trend visualization with project filtering
- **Resource Analytics**: Monthly and annual working days tracking

### Resource Features
- **Leave Application**: Apply for leaves (affects billing)
- **Working Days View**: See monthly breakdown and annual allocation
- **Settings**: Change password

### Automated Calculations
- **Billable Days**: Automatically excludes weekends and leaves
- **Rate Application**: Supports both daily and hourly rates
- **Annual Tracking**: Monitors allocated vs. exhausted days
- **Monthly Aggregation**: Calculates costs per month for trend analysis

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[React 18]
        B[TypeScript]
        C[Vite]
        D[Recharts]
        E[React Router]
    end
    
    subgraph "Backend"
        F[Node.js]
        G[Express]
        H[TypeScript]
        I[Prisma ORM]
        J[JWT Auth]
    end
    
    subgraph "Database"
        K[PostgreSQL]
    end
    
    A --> F
    I --> K
```
