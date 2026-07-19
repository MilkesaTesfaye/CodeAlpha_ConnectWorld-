import './config/env';
import bcrypt from 'bcrypt';
import prisma from './config/database';
import { UserRole } from '@prisma/client';

const SALT_ROUNDS = 12;

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatarUrl: string;
}

const sampleUsers: SeedUser[] = [
  // ─── Super Admin ────────────────────────────────────────────────────────────
  {
    email: 'admin@connectworld.com',
    password: 'Admin123!',
    firstName: 'Super',
    lastName: 'Admin',
    displayName: 'Super Admin',
    bio: 'System administrator with full access to all features.',
    role: UserRole.SUPER_ADMIN,
    isEmailVerified: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Super+Admin&background=1a1a2e&color=fff&size=200',
  },
  // ─── Admin ──────────────────────────────────────────────────────────────────
  {
    email: 'manager@connectworld.com',
    password: 'Manager123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    displayName: 'Sarah Johnson',
    bio: 'Platform manager handling user administration and meeting oversight.',
    role: UserRole.ADMIN,
    isEmailVerified: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=16213e&color=fff&size=200',
  },
  // ─── Moderator ──────────────────────────────────────────────────────────────
  {
    email: 'mod@connectworld.com',
    password: 'Moderator123!',
    firstName: 'Mike',
    lastName: 'Chen',
    displayName: 'Mike Chen',
    bio: 'Community moderator ensuring smooth meeting experiences.',
    role: UserRole.MODERATOR,
    isEmailVerified: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mike+Chen&background=0f3460&color=fff&size=200',
  },
  // ─── Regular Users ──────────────────────────────────────────────────────────
  {
    email: 'alice@connectworld.com',
    password: 'Alice123!',
    firstName: 'Alice',
    lastName: 'Williams',
    displayName: 'Alice Williams',
    bio: 'Product designer who loves collaborative brainstorming sessions.',
    role: UserRole.USER,
    isEmailVerified: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Williams&background=533483&color=fff&size=200',
  },
  {
    email: 'bob@connectworld.com',
    password: 'Bob123!',
    firstName: 'Bob',
    lastName: 'Martinez',
    displayName: 'Bob Martinez',
    bio: 'Software engineer exploring remote collaboration tools.',
    role: UserRole.USER,
    isEmailVerified: true,
    avatarUrl: 'https://ui-avatars.com/api/?name=Bob+Martinez&background=e94560&color=fff&size=200',
  },
  {
    email: 'charlie@connectworld.com',
    password: 'Charlie123!',
    firstName: 'Charlie',
    lastName: 'Kim',
    displayName: 'Charlie Kim',
    bio: 'Freelance consultant connecting with clients worldwide.',
    role: UserRole.USER,
    isEmailVerified: false,
    avatarUrl: 'https://ui-avatars.com/api/?name=Charlie+Kim&background=0a1929&color=fff&size=200',
  },
  // ─── Guest ──────────────────────────────────────────────────────────────────
  {
    email: 'guest@connectworld.com',
    password: 'Guest123!',
    firstName: 'Guest',
    lastName: 'User',
    displayName: 'Guest User',
    bio: 'Temporary guest account for testing limited access.',
    role: UserRole.GUEST,
    isEmailVerified: false,
    avatarUrl: 'https://ui-avatars.com/api/?name=Guest+User&background=555555&color=fff&size=200',
  },
];

async function seedUsers() {
  console.log('👤 Seeding sample users...\n');

  let created = 0;
  let skipped = 0;

  for (const userData of sampleUsers) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      console.log(`  ⏭️  Skipped ${userData.email} (already exists)`);
      skipped++;
      continue;
    }

    // Look up role
    const role = await prisma.role.findUnique({
      where: { name: userData.role },
    });

    if (!role) {
      console.error(`  ❌ Role ${userData.role} not found! Run the main seed first.`);
      continue;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        roleId: role.id,
        isEmailVerified: userData.isEmailVerified,
        isActive: true,
        authProvider: 'local',
      },
    });

    // Create default user settings
    await prisma.userSetting.create({
      data: { userId: user.id },
    });

    console.log(`  ✅ Created ${userData.role.padEnd(12)} | ${userData.email} (${userData.displayName})`);
    created++;
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);

  // Print login credentials table
  console.log('\n🔑 Login Credentials:');
  console.log('────────────────────────────────────────────────────────────');
  console.log('  Email'.padEnd(35) + 'Password'.padEnd(20) + 'Role');
  console.log('────────────────────────────────────────────────────────────');
  for (const u of sampleUsers) {
    const email = u.email.padEnd(35);
    const pass = u.password.padEnd(20);
    console.log(`  ${email}${pass}${u.role}`);
  }
  console.log('────────────────────────────────────────────────────────────');
  console.log('\n🎉 User seeding complete!');
}

seedUsers()
  .catch((e) => {
    console.error('❌ User seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
