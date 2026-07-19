import prisma from '../../config/database';

/**
 * Get dashboard statistics for the authenticated user.
 */
export async function getDashboardStats(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalMeetings,
    upcomingMeetings,
    completedMeetings,
    totalParticipants,
    recentMeetings,
    meetingDurations,
  ] = await Promise.all([
    // Total meetings (hosted or participated)
    prisma.meeting.count({
      where: {
        deletedAt: null,
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
    }),
    // Upcoming scheduled meetings
    prisma.meeting.count({
      where: {
        deletedAt: null,
        status: 'SCHEDULED',
        scheduledAt: { gte: now },
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
    }),
    // Completed meetings
    prisma.meeting.count({
      where: {
        deletedAt: null,
        status: 'ENDED',
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
    }),
    // Total participants across all meetings
    prisma.meetingParticipant.count({
      where: {
        meeting: {
          deletedAt: null,
          OR: [{ hostId: userId }, { participants: { some: { userId } } }],
        },
      },
    }),
    // Recent meetings
    prisma.meeting.findMany({
      where: {
        deletedAt: null,
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        meetingId: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    }),
    // Ended meetings with duration data
    prisma.meeting.findMany({
      where: {
        deletedAt: null,
        status: 'ENDED',
        startedAt: { not: null },
        endedAt: { not: null },
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      select: {
        startedAt: true,
        endedAt: true,
      },
    }),
  ]);

  // Calculate average duration
  let averageDuration = 0;
  if (meetingDurations.length > 0) {
    const totalMs = meetingDurations.reduce((sum, m) => {
      return sum + (m.endedAt!.getTime() - m.startedAt!.getTime());
    }, 0);
    averageDuration = Math.round(totalMs / meetingDurations.length / 60000); // in minutes
  }

  // Meetings by day (last 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentMeetingsByDay = await prisma.meeting.findMany({
    where: {
      deletedAt: null,
      createdAt: { gte: sevenDaysAgo },
      OR: [
        { hostId: userId },
        { participants: { some: { userId } } },
      ],
    },
    select: { createdAt: true },
  });

  const meetingsByDay: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = recentMeetingsByDay.filter(
      (m) => m.createdAt.toISOString().split('T')[0] === dateStr
    ).length;
    meetingsByDay.push({ date: dateStr, count });
  }

  // Meetings by status
  const statusCounts = await Promise.all(
    (['LIVE', 'SCHEDULED', 'ENDED', 'CANCELLED'] as const).map(async (status) => {
      const count = await prisma.meeting.count({
        where: {
          deletedAt: null,
          status,
          OR: [
            { hostId: userId },
            { participants: { some: { userId } } },
          ],
        },
      });
      return { status, count };
    })
  );

  return {
    totalMeetings,
    upcomingMeetings,
    completedMeetings,
    totalParticipants,
    averageDuration,
    meetingsByDay,
    meetingsByStatus: statusCounts,
    recentMeetings,
  };
}
