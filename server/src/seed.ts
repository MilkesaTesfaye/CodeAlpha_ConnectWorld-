import './config/env';
import prisma from './config/database';
import { UserRole, AuditAction } from '@prisma/client';

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Roles ─────────────────────────────────────────────────────────────
  const roles = await Promise.all(
    Object.values(UserRole).map((roleName) =>
      prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: getRoleDescription(roleName),
        },
      })
    )
  );
  console.log(`✅ Created ${roles.length} roles`);

  // ─── Permissions ───────────────────────────────────────────────────────
  const permissions = [
    { name: 'user:read', description: 'Read user profiles' },
    { name: 'user:write', description: 'Create and update users' },
    { name: 'user:delete', description: 'Delete users' },
    { name: 'meeting:create', description: 'Create meetings' },
    { name: 'meeting:read', description: 'View meetings' },
    { name: 'meeting:update', description: 'Update meetings' },
    { name: 'meeting:delete', description: 'Delete meetings' },
    { name: 'meeting:end', description: 'End meetings' },
    { name: 'file:upload', description: 'Upload files' },
    { name: 'file:read', description: 'Read files' },
    { name: 'file:delete', description: 'Delete files' },
    { name: 'admin:dashboard', description: 'Access admin dashboard' },
    { name: 'admin:users', description: 'Manage users' },
    { name: 'admin:system', description: 'Manage system settings' },
    { name: 'admin:logs', description: 'View audit logs' },
    { name: 'admin:broadcast', description: 'Send broadcast messages' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      })
    )
  );
  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // ─── Assign Permissions to Roles ──────────────────────────────────────
  const adminRole = roles.find((r) => r.name === UserRole.ADMIN);
  const superAdminRole = roles.find((r) => r.name === UserRole.SUPER_ADMIN);
  const userRole = roles.find((r) => r.name === UserRole.USER);

  // Super Admin gets all permissions
  if (superAdminRole) {
    for (const perm of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: perm.id },
      });
    }
  }

  // Admin gets management permissions
  if (adminRole) {
    const adminPerms = createdPermissions.filter((p) =>
      p.name.startsWith('admin:') || p.name.startsWith('user:') || p.name.startsWith('meeting:')
    );
    for (const perm of adminPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }
  }

  // User gets basic permissions
  if (userRole) {
    const userPerms = createdPermissions.filter((p) =>
      !p.name.startsWith('admin:')
    );
    for (const perm of userPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: userRole.id, permissionId: perm.id },
      });
    }
  }

  console.log('✅ Assigned role permissions');
  console.log('🎉 Database seeding complete!');
}

function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Full system access with all permissions',
    [UserRole.ADMIN]: 'Administrative access to manage users and meetings',
    [UserRole.MODERATOR]: 'Can moderate meetings and content',
    [UserRole.USER]: 'Standard user with basic features',
    [UserRole.GUEST]: 'Limited access for guest participants',
  };
  return descriptions[role];
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
