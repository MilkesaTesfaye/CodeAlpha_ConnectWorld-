import prisma from '../../config/database';

/**
 * Get meeting analytics for a time range.
 */
export async function getMeetingAnalytics(userId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalMeetings, completedMeetings, totalParticipants] = await Promise.all([
    prisma.meeting.count({
      where: {
        hostId: userId,
        createdAt: { gte: since },
        deletedAt: null,
      },
    }),
    prisma.meeting.count({
      where: {
        hostId: userId,
        status: 'ENDED',
        createdAt: { gte: since },
        deletedAt: null,
      },
    }),
    prisma.meetingParticipant.count({
      where: {
        meeting: { hostId: userId, deletedAt: null },
        status: 'JOINED',
        joinedAt: { gte: since },
      },
    }),
  ]);

  // Compute average meeting duration from ended meetings
  const endedMeetings = await prisma.meeting.findMany({
    where: {
      hostId: userId,
      status: 'ENDED',
      startedAt: { not: null },
      endedAt: { not: null },
      deletedAt: null,
    },
    select: { startedAt: true, endedAt: true },
  });

  let averageDuration = 0;
  if (endedMeetings.length > 0) {
    const totalSeconds = endedMeetings.reduce((sum, m) => {
      return sum + ((m.endedAt!.getTime() - m.startedAt!.getTime()) / 1000);
    }, 0);
    averageDuration = Math.round(totalSeconds / endedMeetings.length);
  }

  // Meetings by day for charting
  const meetingsByDay = await prisma.meeting.groupBy({
    by: ['createdAt'],
    where: {
      hostId: userId,
      createdAt: { gte: since },
      deletedAt: null,
    },
    _count: true,
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by date
  const dailyCounts: Record<string, number> = {};
  meetingsByDay.forEach((m: any) => {
    const day = new Date(m.createdAt).toISOString().split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + m._count;
  });

  return {
    totalMeetings,
    completedMeetings,
    totalParticipants,
    averageDurationMs: averageDuration * 1000,
    averageDurationSec: averageDuration,
    dailyMeetings: dailyCounts,
    period: `${days} days`,
  };
}

/**
 * Get user activity analytics.
 */
export async function getUserActivityAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [newUsers, activeUsers, totalSessions] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: since } },
    }),
    prisma.session.count({
      where: { createdAt: { gte: since }, isRevoked: false },
    }),
  ]);

  return {
    newUsers,
    activeUsers,
    totalSessions,
    period: `${days} days`,
  };
}

/**
 * Get file storage analytics.
 */
export async function getFileAnalytics() {
  const [totalFiles, totalSize] = await Promise.all([
    prisma.file.count({ where: { isDeleted: false } }),
    prisma.file.aggregate({
      _sum: { size: true },
      where: { isDeleted: false },
    }),
  ]);

  // Files by type
  const filesByType = await prisma.file.groupBy({
    by: ['mimeType'],
    where: { isDeleted: false },
    _count: true,
    _sum: { size: true },
  });

  return {
    totalFiles,
    totalSize: totalSize._sum?.size || 0,
    filesByType: filesByType.map((f: any) => ({
      mimeType: f.mimeType,
      count: f._count,
      totalSize: f._sum?.size || 0,
    })),
  };
}
