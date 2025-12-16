# HCLTech Billing Application - Visual Diagrams for Client Demo

## 1. System Architecture Overview

![System Architecture](C:/Users/Swapnil/.gemini/antigravity/brain/7346bbbe-881e-4275-8142-bd82fd8ac612/system_architecture_diagram_1765900346471.png)

**Three-tier architecture** ensuring scalability and maintainability:
- **Client Layer**: React-based responsive UI with authentication and routing
- **Server Layer**: RESTful API with secure middleware and ORM
- **Database Layer**: PostgreSQL for reliable data persistence

---

## 2. User Authentication Flow

![Authentication Flow](C:/Users/Swapnil/.gemini/antigravity/brain/7346bbbe-881e-4275-8142-bd82fd8ac612/authentication_flow_diagram_1765900441037.png)

**Secure JWT-based authentication**:
- Password hashing with bcrypt
- HTTP-only cookies for token storage
- Automatic session management
- Role-based access control (Admin/Resource)

---

## 3. Admin Dashboard Workflow

![Admin Dashboard Workflow](C:/Users/Swapnil/.gemini/antigravity/brain/7346bbbe-881e-4275-8142-bd82fd8ac612/admin_dashboard_workflow_1765900511237.png)

**Comprehensive admin capabilities**:
- **Project Management**: Create, edit, and monitor projects
- **Resource Assignment**: Assign resources with flexible rate types (Daily/Hourly)
- **Analytics Dashboard**: Real-time insights into resource utilization
- **Billing Oversight**: Annual trend analysis with project-level filtering

---

## 4. Billing Calculation Process

![Billing Calculation Flow](C:/Users/Swapnil/.gemini/antigravity/brain/7346bbbe-881e-4275-8142-bd82fd8ac612/billing_calculation_flow_1765900592039.png)

**Intelligent billing engine**:
- Automatic exclusion of weekends and leaves
- Support for both daily and hourly rates
- Monthly aggregation for trend analysis
- Real-time cost projections across 12 months

**Formula**:
- Daily Rate: `Cost = Billable Days × Daily Rate`
- Hourly Rate: `Cost = Billable Days × 8 hours × Hourly Rate`

---

## 5. Data Flow Architecture

![Data Flow Architecture](C:/Users/Swapnil/.gemini/antigravity/brain/7346bbbe-881e-4275-8142-bd82fd8ac612/data_flow_architecture_1765900667731.png)

**Clean separation of concerns**:
- **Frontend**: State management with React Context API
- **API Layer**: RESTful endpoints for all operations
- **Database**: Normalized schema with referential integrity

**Key Endpoints**:
- `/api/auth/*` - Authentication & authorization
- `/api/projects/*` - Project CRUD operations
- `/api/resources/*` - Resource management & analytics
- `/api/billing/*` - Billing calculations & reports
- `/api/leaves/*` - Leave management

---

## 6. Technology Stack

![Technology Stack](C:/Users/Swapnil/.gemini/antigravity/brain/7346bbbe-881e-4275-8142-bd82fd8ac612/technology_stack_diagram_1765900732780.png)

**Modern, industry-standard technologies**:

### Frontend
- **React 18**: Latest features with improved performance
- **TypeScript**: Type safety and better developer experience
- **Vite**: Lightning-fast build tool
- **Recharts**: Beautiful, responsive charts
- **React Router**: Client-side routing

### Backend
- **Node.js**: Scalable JavaScript runtime
- **Express**: Fast, minimalist web framework
- **TypeScript**: End-to-end type safety
- **Prisma ORM**: Type-safe database access
- **JWT**: Secure authentication tokens

### Database
- **PostgreSQL**: Enterprise-grade relational database

---

## Key Features Highlights

### 📊 Analytics & Reporting
- **Annual Billing Trends**: Line chart visualization of 12-month cost projections
- **Resource Utilization**: Monthly breakdown of working days vs. leaves
- **Project-Level Insights**: Filter billing data by specific projects

### 👥 Resource Management
- **Flexible Assignment**: Set start dates, assigned days, and rate types
- **Leave Tracking**: Automatic integration with billing calculations
- **Annual Allocation**: Track allocated vs. exhausted days year-round

### 💰 Intelligent Billing
- **Automatic Calculations**: Excludes weekends and approved leaves
- **Dual Rate Support**: Daily or hourly billing rates
- **Real-Time Projections**: Instant cost updates based on resource activity

### 🔒 Security
- **JWT Authentication**: Secure, stateless authentication
- **Role-Based Access**: Admin and Resource user roles
- **Password Encryption**: Industry-standard bcrypt hashing
- **HTTP-Only Cookies**: Protection against XSS attacks

---

## Deployment Ready

✅ **Database Patch**: `db_patch.sql` for easy schema deployment  
✅ **Documentation**: Comprehensive `DEPLOYMENT.md` guide  
✅ **Clean Codebase**: Production-ready, well-organized code  
✅ **Scalable Architecture**: Designed for growth and maintenance

---

*Generated for HCLTech Client Demo - December 2025*
