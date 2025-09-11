# EduNaija - Nigerian Educational Platform

An interactive educational platform designed specifically for Nigerian junior secondary students, covering the core subjects of Basic Science & Technology (BST), Prevocational Studies (PVS), and National Values Education (NV).

## 🎯 Project Overview

EduNaija provides comprehensive learning resources, homework assistance, interactive quizzes, and progress tracking for students in grades JSS1-JSS3. The platform supports Nigeria's educational curriculum with culturally relevant content and examples.

## ✨ Features

### 📚 **Subject Coverage**
- **Basic Science & Technology (BST)**
  - Basic Science (Biology, Chemistry, Physics fundamentals)
  - Basic Technology (Engineering principles, simple machines)
  - ICT (Computer basics, digital literacy)
  - Physical & Health Education (Fitness, health, sports)

- **Prevocational Studies (PVS)**
  - Agriculture (Crops, soil science, farm tools, animal husbandry)
  - Home Economics (Nutrition, home management, clothing & textiles)

- **National Values Education (NV)**
  - Civic Education (Rights, responsibilities, government structure)
  - Social Studies (Culture, environment, family life, geography)
  - Security Education (Safety tips, emergency preparedness, first aid)

### 🎓 **Learning Tools**
- **Interactive Content**: Topic notes with diagrams and visual aids
- **Homework Assistance**: Step-by-step solution guides
- **Practice Quizzes**: Multiple choice, true/false, and essay questions
- **Experiments & Projects**: Hands-on learning activities
- **Progress Tracking**: Monitor learning achievements and quiz scores
- **Mobile-Optimized**: Responsive design for smartphone access

### 👥 **User Roles**
- **Students**: Access content, take quizzes, submit homework
- **Teachers**: Create content, manage assignments, grade submissions
- **Admins**: Platform management and oversight

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router DOM

## 🗄️ Database Schema

### Core Tables
```sql
-- User management
profiles (user profiles with roles: student/teacher/admin)

-- Educational structure
subjects (BST, PVS, NV)
sub_subjects (Basic Science, Agriculture, Civic Education, etc.)
topics (Individual lesson topics)

-- Content system
content (notes, homework guides, experiments, videos, worksheets)
questions (quiz questions with multiple types)

-- Progress tracking
user_progress (track topic completion, quiz attempts)
quiz_attempts (detailed quiz results and scores)
homework_submissions (assignment submissions and grading)
```

### Security Features
- Row Level Security (RLS) policies on all tables
- User-specific data access controls
- Teacher/admin content management permissions
- Automatic user profile creation on signup

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   The project is pre-configured with Supabase. Environment variables are already set in `.env`:
   ```
   VITE_SUPABASE_PROJECT_ID=xftbjlybxiuqttskkzmc
   VITE_SUPABASE_URL=https://xftbjlybxiuqttskkzmc.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=[key already configured]
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui base components
│   ├── Header.tsx       # Navigation header
│   ├── HeroSection.tsx  # Landing page hero
│   ├── SubjectsSection.tsx  # Subject cards
│   ├── HomeworkSection.tsx  # Homework assistance
│   └── Footer.tsx       # Site footer
├── integrations/
│   └── supabase/        # Supabase client and types
├── pages/               # Route components
│   ├── Index.tsx        # Home page
│   └── NotFound.tsx     # 404 page
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── assets/              # Images and static files
└── main.tsx            # Application entry point
```

## 🎨 Design System

The project uses a carefully crafted design system optimized for educational content:

- **Colors**: Educational blue, energetic orange, growth green
- **Typography**: Clear, readable fonts suitable for students
- **Components**: Consistent UI patterns across the platform
- **Responsive**: Mobile-first design for Nigerian students' primary device usage

## 🔐 Authentication & Security

- **User Authentication**: Email/password signup and login
- **Role-Based Access**: Student, teacher, and admin permissions
- **Data Security**: Row-level security policies protect user data
- **Session Management**: Automatic token refresh and persistence

## 📊 Content Management

### For Teachers/Admins
- Create and publish educational content
- Design quizzes and assignments
- Grade student submissions
- Track class progress and performance

### For Students
- Access published learning materials
- Take interactive quizzes
- Submit homework assignments
- Monitor personal learning progress

## 🌐 Deployment

### Using Lovable (Recommended)
1. Open your [Lovable Project](https://lovable.dev/projects/0d7e166a-05c8-452c-be66-cce1f2e319d6)
2. Click **Share** → **Publish**
3. Your app will be live at `yoursite.lovable.app`

### Custom Domain
- Navigate to **Project** → **Settings** → **Domains**
- Click **Connect Domain** (requires paid plan)
- Follow the DNS configuration instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Ensure mobile responsiveness
- Test thoroughly before submitting
- Maintain accessibility standards

## 📝 Content Guidelines

When adding educational content:
- Use clear, age-appropriate language for JSS1-JSS3 students
- Include Nigerian examples and cultural references
- Provide step-by-step explanations for complex topics
- Add visual aids (diagrams, charts) where helpful
- Ensure content aligns with Nigerian curriculum standards

## 🆘 Support & Documentation

- **Lovable Documentation**: [docs.lovable.dev](https://docs.lovable.dev/)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Project URL**: [Lovable Project Dashboard](https://lovable.dev/projects/0d7e166a-05c8-452c-be66-cce1f2e319d6)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- Nigerian Ministry of Education for curriculum guidance
- Supabase for backend infrastructure
- Lovable platform for development acceleration
- Open source community for various tools and libraries

---

**Built with ❤️ for Nigerian students and educators**