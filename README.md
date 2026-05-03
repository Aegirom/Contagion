<div align="center">

<a href="https://contagion.dev" target="_blank" rel="noopener noreferrer">
  <img src="https://github.com/user-attachments/assets/7e195b9a-a68e-4d03-b62a-9b80e5ca5933" width="90" style="border-radius:20px; cursor:pointer;" />
</a>

# Contagion
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Azure SQL](https://img.shields.io/badge/Azure_SQL-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcryptjs-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-FF6600?style=for-the-badge&logo=node.js&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![AWS SDK](https://img.shields.io/badge/AWS_SDK_v3-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)
![DBeaver](https://img.shields.io/badge/DBeaver-372923?style=for-the-badge)

  </div>

## What is Contagion

Contagion is a collaborative malware analysis platform where security analysts can submit, review, and discuss malware analyses. The platform combines automated sandbox analysis with peer review to create a knowledge-sharing ecosystem for cybersecurity professionals.

## Key Features

**Analysis Submissions**
Create structured malware analysis reports with support for different template types. Track versions, save drafts, and publish when ready.

**Sandbox Execution**
Integrate with VirusTotal to automatically analyze malware samples. Behavioral logs capture API calls, file system changes, registry modifications, and network activity.

**Peer Review System**
Structured peer reviews with scoring across four dimensions: technical analysis, methodology, documentation, and insights. Build reputation through quality contributions.

**Gamification**
Reputation scores, expertise levels, and leaderboards encourage active participation. Earn XP for submissions, reviews, comments, and likes.

**Social Features**
Like, share, and save analyses. Comment on submissions with threaded discussions. Follow user profiles with specializations.

**Role-Based Access**
Administrators, moderators, and analysts have different permissions. Admin panel provides user management, content moderation, and platform statistics.

## Architecture

```
Frontend (React + Vite)  --->  Backend API (Node.js + Express)
                                    |
                                    v
                          Azure SQL Database
                                    |
                                    +--> VirusTotal API
                                    +--> Cloudflare R2 Storage
```

## Technology Stack

**Frontend**
- React with Vite for fast development
- TailwindCSS for styling
- Zustand for state management
- React Router for navigation

**Backend**
- Node.js with Express framework
- Azure SQL Database with mssql driver
- JWT authentication with bcrypt password hashing
- Multer for file uploads
- Axios for external API calls

**Infrastructure**
- Cloudflare R2 for artifact storage
- VirusTotal API for malware analysis
- Docker support for containerized deployment
- GitHub Actions for CI/CD

## Database Schema

The platform uses 15 tables with proper foreign key constraints and indexes. Key tables include:

- **Users** - Authentication and reputation tracking
- **Analysis_Submissions** - Core analysis content with versioning
- **Malware_Artifacts** - Uploaded samples with hash-based deduplication
- **Sandbox_Executions** - Tracks analysis runs with behavioral logs
- **Peer_Reviews** - Structured 4-dimension scoring system
- **Post_Comments, Post_Likes, Post_Shares** - Social engagement

Stored procedures for critical operations:
- `sp_CreateSandboxExecution` - Creates sandbox execution records
- `sp_CompleteSandboxExecution` - Marks executions as completed/failed

Full schema and query documentation: [Schema.sql](/home/doubleroote/Schema.sql)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Aegirom/Contagion.git
cd Contagion

# Install backend dependencies
cd backend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your Azure SQL credentials and JWT secret

# Start development server
npm run dev
```

## Database Documentation

Database query notes, foreign key behavior, constraints, and stored procedures are documented in:

- [docs/DATABASE_README.md](docs/DATABASE_README.md)
- [database/procedures.sql](database/procedures.sql)
- [Schema.sql](/home/doubleroote/Schema.sql) - Complete schema with all queries documented
