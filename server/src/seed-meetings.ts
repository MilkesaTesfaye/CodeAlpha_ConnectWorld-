import './config/env';
import prisma from './config/database';
import { MeetingStatus, ParticipantRole, ParticipantStatus, MessageType, NotificationType } from '@prisma/client';

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
}

interface MeetingSeed {
  title: string;
  description: string;
  meetingId: string;
  hostEmail: string;
  status: MeetingStatus;
  meetingType: string;
  isRecurring: boolean;
  scheduledAt: Date | null;
  maxParticipants: number;
  hasWaitingRoom: boolean;
  isLocked: boolean;
  recordingEnabled: boolean;
  participants: { email: string; role: ParticipantRole; status: ParticipantStatus }[];
}

const meetingSeeds: MeetingSeed[] = [
  // ─── 1. Super Admin's All-Hands Meeting ──────────────────────────────────────
  {
    title: 'Company All-Hands Q3',
    description: 'Quarterly company-wide meeting covering Q3 goals, project updates, and team achievements.',
    meetingId: 'allhands-q3-2026',
    hostEmail: 'admin@connectworld.com',
    status: MeetingStatus.SCHEDULED,
    meetingType: 'scheduled',
    isRecurring: true,
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxParticipants: 200,
    hasWaitingRoom: false,
    isLocked: false,
    recordingEnabled: true,
    participants: [
      { email: 'manager@connectworld.com', role: ParticipantRole.CO_HOST, status: ParticipantStatus.INVITED },
      { email: 'mod@connectworld.com', role: ParticipantRole.PRESENTER, status: ParticipantStatus.INVITED },
      { email: 'alice@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.INVITED },
      { email: 'bob@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.INVITED },
      { email: 'charlie@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.INVITED },
    ],
  },
  // ─── 2. Sarah Johnson's Admin Sync ───────────────────────────────────────────
  {
    title: 'Admin Team Sync',
    description: 'Weekly admin team sync to discuss platform operations, user feedback, and upcoming features.',
    meetingId: 'admin-sync-weekly',
    hostEmail: 'manager@connectworld.com',
    status: MeetingStatus.LIVE,
    meetingType: 'recurring',
    isRecurring: true,
    scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    maxParticipants: 25,
    hasWaitingRoom: true,
    isLocked: false,
    recordingEnabled: true,
    participants: [
      { email: 'admin@connectworld.com', role: ParticipantRole.HOST, status: ParticipantStatus.JOINED },
      { email: 'mod@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.JOINED },
      { email: 'alice@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.INVITED },
    ],
  },
  // ─── 3. Mike Chen's Community Moderation ─────────────────────────────────────
  {
    title: 'Community Guidelines Review',
    description: 'Review and update community guidelines. Discuss recent moderation cases and policy changes.',
    meetingId: 'mod-review-2026',
    hostEmail: 'mod@connectworld.com',
    status: MeetingStatus.SCHEDULED,
    meetingType: 'scheduled',
    isRecurring: false,
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    maxParticipants: 15,
    hasWaitingRoom: true,
    isLocked: false,
    recordingEnabled: false,
    participants: [
      { email: 'admin@connectworld.com', role: ParticipantRole.CO_HOST, status: ParticipantStatus.INVITED },
      { email: 'manager@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.INVITED },
    ],
  },
  // ─── 4. Alice's Design Sprint ────────────────────────────────────────────────
  {
    title: 'Product Design Sprint',
    description: 'Collaborative design sprint for the new mobile interface. Bring your wireframes and ideas!',
    meetingId: 'design-sprint-mobile',
    hostEmail: 'alice@connectworld.com',
    status: MeetingStatus.SCHEDULED,
    meetingType: 'scheduled',
    isRecurring: false,
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    maxParticipants: 10,
    hasWaitingRoom: false,
    isLocked: true,
    recordingEnabled: true,
    participants: [
      { email: 'admin@connectworld.com', role: ParticipantRole.CO_HOST, status: ParticipantStatus.INVITED },
      { email: 'bob@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.INVITED },
    ],
  },
  // ─── 5. Bob's Code Review Session ────────────────────────────────────────────
  {
    title: 'Backend Code Review',
    description: 'Reviewing the new WebRTC signaling module and real-time collaboration features.',
    meetingId: 'backend-review-webrtc',
    hostEmail: 'bob@connectworld.com',
    status: MeetingStatus.ENDED,
    meetingType: 'instant',
    isRecurring: false,
    scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    maxParticipants: 8,
    hasWaitingRoom: true,
    isLocked: false,
    recordingEnabled: false,
    participants: [
      { email: 'alice@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.JOINED },
      { email: 'mod@connectworld.com', role: ParticipantRole.PARTICIPANT, status: ParticipantStatus.JOINED },
    ],
  },
  // ─── 6. Charlie's Client Consultation ────────────────────────────────────────
  {
    title: 'Client Onboarding Call',
    description: 'Initial consultation with a new enterprise client. Discuss requirements and integration options.',
    meetingId: 'client-onboarding-001',
    hostEmail: 'charlie@connectworld.com',
    status: MeetingStatus.LIVE,
    meetingType: 'instant',
    isRecurring: false,
    scheduledAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    maxParticipants: 5,
    hasWaitingRoom: true,
    isLocked: false,
    recordingEnabled: true,
    participants: [
      { email: 'bob@connectworld.com', role: ParticipantRole.CO_HOST, status: ParticipantStatus.JOINED },
    ],
  },
  // ─── 7. Quick Standup (instant meeting, no participants seeded) ─────────────
  {
    title: 'Daily Standup',
    description: 'Quick daily standup to sync on progress and blockers.',
    meetingId: 'standup-today',
    hostEmail: 'admin@connectworld.com',
    status: MeetingStatus.LIVE,
    meetingType: 'instant',
    isRecurring: false,
    scheduledAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    maxParticipants: 20,
    hasWaitingRoom: false,
    isLocked: false,
    recordingEnabled: false,
    participants: [],
  },
];

async function seedMeetings() {
  console.log('📅 Seeding sample meetings...\n');

  // Fetch all users by email
  const users = await prisma.user.findMany();
  const userMap = new Map<string, UserInfo>();
  for (const u of users) {
    userMap.set(u.email, { id: u.id, email: u.email, displayName: u.displayName || u.email });
  }

  let created = 0;
  let skipped = 0;

  for (const meetingData of meetingSeeds) {
    // Check if meeting already exists
    const existing = await prisma.meeting.findUnique({
      where: { meetingId: meetingData.meetingId },
    });

    if (existing) {
      console.log(`  ⏭️  Skipped "${meetingData.title}" (already exists)`);
      skipped++;
      continue;
    }

    const host = userMap.get(meetingData.hostEmail);
    if (!host) {
      console.error(`  ❌ Host ${meetingData.hostEmail} not found! Skipping "${meetingData.title}"`);
      skipped++;
      continue;
    }

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: meetingData.title,
        description: meetingData.description,
        meetingId: meetingData.meetingId,
        hostId: host.id,
        status: meetingData.status,
        meetingType: meetingData.meetingType,
        isRecurring: meetingData.isRecurring,
        scheduledAt: meetingData.scheduledAt,
        startedAt: meetingData.status === MeetingStatus.LIVE || meetingData.status === MeetingStatus.ENDED
          ? new Date(Date.now() - 60 * 60 * 1000)
          : null,
        endedAt: meetingData.status === MeetingStatus.ENDED
          ? new Date(Date.now() - 30 * 60 * 1000)
          : null,
        maxParticipants: meetingData.maxParticipants,
        hasWaitingRoom: meetingData.hasWaitingRoom,
        isLocked: meetingData.isLocked,
        recordingEnabled: meetingData.recordingEnabled,
      },
    });

    // Add host as HOST participant
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: host.id,
        role: ParticipantRole.HOST,
        status: meetingData.status === MeetingStatus.LIVE ? ParticipantStatus.JOINED : ParticipantStatus.INVITED,
        joinedAt: meetingData.status === MeetingStatus.LIVE ? new Date() : null,
      },
    });

    // Add other participants
    let participantCount = 1; // Count includes host
    for (const p of meetingData.participants) {
      const participantUser = userMap.get(p.email);
      if (!participantUser) {
        console.warn(`  ⚠️  Participant ${p.email} not found, skipping`);
        continue;
      }

      await prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId: participantUser.id,
          role: p.role,
          status: p.status,
          joinedAt: p.status === ParticipantStatus.JOINED ? new Date() : null,
        },
      });
      participantCount++;
    }

    // If meeting is LIVE or ENDED, add a system chat message
    if (meetingData.status === MeetingStatus.LIVE || meetingData.status === MeetingStatus.ENDED) {
      await prisma.chatMessage.create({
        data: {
          meetingId: meeting.id,
          senderId: host.id,
          content: `Welcome to the ${meetingData.title}! The meeting has started. 🚀`,
          messageType: MessageType.SYSTEM,
        },
      });
    }

    // Send notifications to invited participants
    for (const p of meetingData.participants) {
      const participantUser = userMap.get(p.email);
      if (!participantUser) continue;

      await prisma.notification.create({
        data: {
          userId: participantUser.id,
          type: NotificationType.MEETING_INVITATION,
          title: `Invitation: ${meetingData.title}`,
          message: `You've been invited to "${meetingData.title}" by ${host.displayName}`,
          data: {
            meetingId: meeting.id,
            meetingTitle: meetingData.title,
            hostName: host.displayName,
            status: p.status,
          },
        },
      });
    }

    const statusIcon = meetingData.status === MeetingStatus.LIVE ? '🔴' :
      meetingData.status === MeetingStatus.ENDED ? '✅' :
      meetingData.status === MeetingStatus.CANCELLED ? '❌' : '📅';

    console.log(`  ${statusIcon} Created "${meetingData.title}" (${meetingData.status}) — ${participantCount} participants`);
    created++;
  }

  console.log(`\n📊 Summary: ${created} meetings created, ${skipped} skipped`);
  console.log('🎉 Meeting seeding complete!');
}

seedMeetings()
  .catch((e) => {
    console.error('❌ Meeting seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
