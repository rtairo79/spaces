import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting enhanced seed...');

  // Create locations (same as before)
  const mainLibrary = await prisma.location.upsert({
    where: { id: 'main-lib' },
    update: {},
    create: {
      id: 'main-lib',
      name: 'Main Library',
      address: '123 Library Street, City, State 12345',
      phone: '(555) 123-4567',
      email: 'main@library.org',
      active: true,
    },
  });

  // Create room types
  const meetingRoom = await prisma.roomType.upsert({
    where: { id: 'meeting-room' },
    update: {},
    create: {
      id: 'meeting-room',
      name: 'Meeting Room',
      description: 'Large meeting space for groups',
    },
  });

  // Create equipment
  const projector = await prisma.equipment.create({
    data: {
      name: 'Projector',
      description: 'HD projector with HDMI connection',
      quantity: 5,
      active: true,
    },
  });

  const whiteboard = await prisma.equipment.create({
    data: {
      name: 'Whiteboard',
      description: 'Large whiteboard with markers',
      quantity: 10,
      active: true,
    },
  });

  const tv = await prisma.equipment.create({
    data: {
      name: 'TV Screen',
      description: '55" Smart TV with screen sharing',
      quantity: 3,
      active: true,
    },
  });

  const microphone = await prisma.equipment.create({
    data: {
      name: 'Microphone',
      description: 'Wireless microphone system',
      quantity: 2,
      active: true,
    },
  });

  console.log('Created equipment');

  // Create program types
  const programTypes = await Promise.all([
    prisma.programType.create({
      data: { name: 'Community Meeting', description: 'General community gatherings', active: true },
    }),
    prisma.programType.create({
      data: { name: 'Study Session', description: 'Individual or group study', active: true },
    }),
  ]);

  console.log('Created program types');

  // Create rooms with equipment
  const conferenceRoom = await prisma.room.create({
    data: {
      name: 'Conference Room',
      locationId: mainLibrary.id,
      roomTypeId: meetingRoom.id,
      capacity: 20,
      description: 'Large conference room with AV equipment',
      imageUrl: '/images/rooms/conference-room.jpg', // Placeholder
      termsAndConditions: `Conference Room Terms and Conditions:
1. Room must be left clean and in good condition
2. Maximum capacity must be respected
3. No food or drinks except water
4. Equipment must be returned to original state
5. Any damages must be reported immediately`,
      active: true,
      approvalMode: 'AUTO_APPROVE', // Auto-approve for this room
      timeSlots: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        ],
      },
      equipment: {
        create: [
          { equipmentId: projector.id, quantity: 1 },
          { equipmentId: whiteboard.id, quantity: 1 },
          { equipmentId: tv.id, quantity: 1 },
        ],
      },
    },
  });

  const studyRoom = await prisma.room.create({
    data: {
      name: 'Study Room 1',
      locationId: mainLibrary.id,
      roomTypeId: meetingRoom.id,
      capacity: 4,
      description: 'Quiet study room for small groups',
      imageUrl: '/images/rooms/study-room.jpg', // Placeholder
      termsAndConditions: `Study Room Terms:
1. Maintain quiet atmosphere
2. No food allowed
3. Return furniture to original arrangement`,
      active: true,
      approvalMode: 'MANUAL_REVIEW', // Requires approval
      timeSlots: {
        create: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '20:00' },
          { dayOfWeek: 2, startTime: '08:00', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '08:00', endTime: '20:00' },
          { dayOfWeek: 4, startTime: '08:00', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '08:00', endTime: '20:00' },
        ],
      },
      equipment: {
        create: [
          { equipmentId: whiteboard.id, quantity: 1 },
        ],
      },
    },
  });

  console.log('Created rooms with equipment');

  // Create users
  const hashedPassword = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: { email: 'admin@library.org' },
    update: {},
    create: {
      email: 'admin@library.org',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@library.org' },
    update: {},
    create: {
      email: 'staff@library.org',
      name: 'Staff Member',
      password: hashedPassword,
      role: 'STAFF',
      locationId: mainLibrary.id,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'patron@library.org' },
    update: {},
    create: {
      email: 'patron@library.org',
      name: 'Patron User',
      password: hashedPassword,
      role: 'PATRON',
      phone: '(555) 999-8888',
      libraryCardId: 'LIB123456',
      active: true,
    },
  });

  console.log('Created users');

  // Create email templates
  await prisma.emailTemplate.upsert({
    where: { key: 'reservation_confirmation' },
    update: {},
    create: {
      key: 'reservation_confirmation',
      name: 'Reservation Confirmation',
      subject: 'Room Reservation Request Received - {{room}}',
      body: `<h2>Room Reservation Request Received</h2>
<p>Dear {{name}},</p>
<p>We have received your room reservation request. Here are the details:</p>
<ul>
  <li><strong>Room:</strong> {{room}}</li>
  <li><strong>Location:</strong> {{location}}</li>
  <li><strong>Date:</strong> {{date}}</li>
  <li><strong>Time:</strong> {{time}}</li>
</ul>
<p>Your request is being reviewed. You will receive a confirmation email once your request is processed.</p>
<p>Thank you for using our library room booking system!</p>
<p>Best regards,<br>Library Staff</p>`,
      active: true,
    },
  });

  await prisma.emailTemplate.upsert({
    where: { key: 'reservation_approved' },
    update: {},
    create: {
      key: 'reservation_approved',
      name: 'Reservation Approved',
      subject: 'Your Room Reservation is Approved - {{room}}',
      body: `<h2 style="color: #10b981;">Room Reservation Approved!</h2>
<p>Dear {{name}},</p>
<p>Great news! Your room reservation has been <strong>approved</strong>.</p>
<ul>
  <li><strong>Room:</strong> {{room}}</li>
  <li><strong>Location:</strong> {{location}}</li>
  <li><strong>Date:</strong> {{date}}</li>
  <li><strong>Time:</strong> {{time}}</li>
</ul>
<p><strong>Important Reminders:</strong></p>
<ul>
  <li>Please arrive on time</li>
  <li>Leave the room clean and in good condition</li>
  <li>Respect the maximum capacity</li>
  <li>Contact us if you need to cancel</li>
</ul>
<p>We look forward to seeing you!</p>
<p>Best regards,<br>Library Staff</p>`,
      active: true,
    },
  });

  await prisma.emailTemplate.upsert({
    where: { key: 'reservation_declined' },
    update: {},
    create: {
      key: 'reservation_declined',
      name: 'Reservation Declined',
      subject: 'Room Reservation Update - {{room}}',
      body: `<h2>Room Reservation Update</h2>
<p>Dear {{name}},</p>
<p>We're sorry, but we are unable to approve your room reservation request at this time.</p>
<p><strong>Reservation Details:</strong></p>
<ul>
  <li><strong>Room:</strong> {{room}}</li>
  <li><strong>Location:</strong> {{location}}</li>
  <li><strong>Date:</strong> {{date}}</li>
  <li><strong>Time:</strong> {{time}}</li>
</ul>
<p>The room may already be booked for this time, or there may be other scheduling conflicts.</p>
<p>Please feel free to:</p>
<ul>
  <li>Try booking a different time slot</li>
  <li>Contact us directly for assistance</li>
  <li>Explore other available rooms</li>
</ul>
<p>We apologize for any inconvenience.</p>
<p>Best regards,<br>Library Staff</p>`,
      active: true,
    },
  });

  await prisma.emailTemplate.upsert({
    where: { key: 'reservation_reminder' },
    update: {},
    create: {
      key: 'reservation_reminder',
      name: 'Reservation Reminder',
      subject: 'Reminder: Your Room Reservation Tomorrow - {{room}}',
      body: `<h2>Reservation Reminder</h2>
<p>Dear {{name}},</p>
<p>This is a friendly reminder about your upcoming room reservation:</p>
<ul>
  <li><strong>Room:</strong> {{room}}</li>
  <li><strong>Location:</strong> {{location}}</li>
  <li><strong>Date:</strong> {{date}}</li>
  <li><strong>Time:</strong> {{time}}</li>
</ul>
<p>Please let us know if you need to cancel or make any changes.</p>
<p>See you tomorrow!</p>
<p>Best regards,<br>Library Staff</p>`,
      active: true,
    },
  });

  console.log('Created email templates');

  // Create meeting room policy setting
  await prisma.settings.upsert({
    where: { key: 'meeting_room_policy' },
    update: {},
    create: {
      key: 'meeting_room_policy',
      value: `Meeting Room Policy

1. Rooms must be reserved in advance through our online system
2. Please arrive on time for your reservation
3. Maximum occupancy must be respected at all times
4. Keep noise levels appropriate for a library setting
5. Leave the room clean and in good condition
6. Return all equipment and furniture to original positions
7. No food or drinks allowed (sealed water bottles permitted)
8. Cancel reservations as soon as possible if unable to attend
9. Repeated no-shows may result in booking restrictions
10. Equipment damage must be reported immediately

For questions or assistance, please contact library staff.`,
    },
  });

  console.log('Created settings');
  console.log('Enhanced seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });