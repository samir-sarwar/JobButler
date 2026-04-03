/**
 * Database seed script
 * Run with: npm run seed
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import MasterExperience from '../models/MasterExperience.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobbutler';

const seedUser = {
  email: 'test@example.com',
  passwordHash: 'password123', // Will be hashed by pre-save hook
  name: 'Jake Doe',
  phone: '555-123-4567',
  linkedinUrl: 'https://linkedin.com/in/jakedoe',
  githubUrl: 'https://github.com/jakedoe',
};

const seedExperiences = [
  // Work experiences
  {
    type: 'work',
    title: 'Senior Systems Architect',
    organization: 'TechCorp Global',
    location: 'San Francisco, CA',
    startDate: 'Mar 2022',
    endDate: 'Present',
    bullets: [
      { text: 'Architected distributed microservices handling 2M+ daily requests with 99.99% uptime' },
      { text: 'Led cross-functional team of 12 engineers to deliver platform modernization project' },
      { text: 'Reduced infrastructure costs by 40% through optimization of cloud resources' },
      { text: 'Implemented event-driven architecture using Kafka and Redis for real-time processing' },
    ],
    tags: ['Node.js', 'Kubernetes', 'AWS', 'Kafka', 'Redis', 'Microservices', 'Team Leadership'],
    priority: 0,
    visible: true,
  },
  {
    type: 'work',
    title: 'Full Stack Engineer',
    organization: 'StartupCo',
    location: 'Austin, TX',
    startDate: 'Jun 2020',
    endDate: 'Feb 2022',
    bullets: [
      { text: 'Built end-to-end TypeScript application serving 500K monthly active users' },
      { text: 'Designed and implemented RESTful APIs with Express and PostgreSQL' },
      { text: 'Improved page load times by 60% through React optimization and CDN integration' },
      { text: 'Mentored 3 junior developers on best practices and code review processes' },
    ],
    tags: ['TypeScript', 'React', 'Express', 'PostgreSQL', 'REST API', 'Mentoring'],
    priority: 1,
    visible: true,
  },
  {
    type: 'work',
    title: 'Backend Developer',
    organization: 'DataFlow Inc',
    location: 'Remote',
    startDate: 'Jan 2018',
    endDate: 'May 2020',
    bullets: [
      { text: 'Developed data pipeline processing 10TB daily using Python and Apache Spark' },
      { text: 'Built internal analytics dashboard reducing report generation time by 80%' },
      { text: 'Implemented CI/CD pipelines with Jenkins and Docker for automated deployments' },
    ],
    tags: ['Python', 'Apache Spark', 'Docker', 'Jenkins', 'CI/CD', 'Data Engineering'],
    priority: 2,
    visible: true,
  },

  // Projects
  {
    type: 'project',
    title: 'Hyper-Ledger V2',
    organization: 'Open Source',
    startDate: 'Jan 2024',
    endDate: 'Present',
    bullets: [
      { text: 'Developed distributed consensus mechanism for blockchain network' },
      { text: 'Implemented smart contract execution engine with 100K TPS throughput' },
      { text: 'Contributed 50+ PRs to open-source project with 2K GitHub stars' },
    ],
    tags: ['Rust', 'Blockchain', 'Distributed Systems', 'Open Source'],
    priority: 3,
    visible: true,
  },
  {
    type: 'project',
    title: 'Neural-Form',
    organization: 'Personal Project',
    startDate: 'Jun 2023',
    endDate: 'Dec 2023',
    bullets: [
      { text: 'Created AI-powered form builder using GPT-4 for intelligent field suggestions' },
      { text: 'Built real-time collaboration features using WebSocket and CRDT' },
      { text: 'Achieved 98% test coverage with Jest and Playwright e2e tests' },
    ],
    tags: ['React', 'Node.js', 'OpenAI', 'WebSocket', 'Testing'],
    priority: 4,
    visible: true,
  },

  // Education
  {
    type: 'education',
    title: 'B.S. Computer Science',
    organization: 'State University',
    location: 'City, ST',
    startDate: 'Sep 2014',
    endDate: 'May 2018',
    bullets: [
      { text: 'GPA: 3.8/4.0, Dean\\'s List' },
      { text: 'Relevant coursework: Distributed Systems, Machine Learning, Database Systems' },
    ],
    tags: [],
    priority: 5,
    visible: true,
  },

  // Skills
  {
    type: 'skill',
    title: 'Technical Skills',
    bullets: [
      { text: 'Languages: JavaScript, TypeScript, Python, Go, Rust' },
      { text: 'Frameworks: React, Node.js, Express, FastAPI, Next.js' },
      { text: 'Databases: PostgreSQL, MongoDB, Redis, Elasticsearch' },
      { text: 'Tools: Docker, Kubernetes, AWS, GCP, Terraform, Jenkins' },
    ],
    tags: [],
    priority: 6,
    visible: true,
  },
  {
    type: 'skill',
    title: 'Infrastructure',
    bullets: [
      { text: 'Cloud: AWS (EC2, Lambda, S3, RDS), GCP (GKE, Cloud Run)' },
      { text: 'DevOps: CI/CD, Infrastructure as Code, Monitoring, Observability' },
    ],
    tags: [],
    priority: 7,
    visible: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await MasterExperience.deleteMany({});

    // Create test user
    console.log('👤 Creating test user...');
    const user = new User(seedUser);
    await user.save();
    console.log(`   Created user: ${user.email}`);

    // Create experiences
    console.log('📝 Creating experiences...');
    for (const exp of seedExperiences) {
      const experience = new MasterExperience({
        ...exp,
        userId: user._id,
      });
      await experience.save();
      console.log(`   Created: ${exp.type} - ${exp.title}`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Email: test@example.com');
    console.log('  Password: password123');
    console.log(`\nTotal experiences created: ${seedExperiences.length}`);

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📦 MongoDB connection closed');
    process.exit(0);
  }
}

seed();
