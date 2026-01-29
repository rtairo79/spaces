import nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    room: true;
    location: true;
    programType: true;
  };
}>;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendReservationConfirmation(
  to: string,
  reservation: ReservationWithRelations
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Room Reservation Request Received',
    html: `
      <h2>Room Reservation Request</h2>
      <p>Your room reservation request has been submitted.</p>
      <h3>Details:</h3>
      <ul>
        <li>Room: ${reservation.room.name}</li>
        <li>Location: ${reservation.location.name}</li>
        <li>Date: ${new Date(reservation.date).toLocaleDateString()}</li>
        <li>Time: ${reservation.startTime} - ${reservation.endTime}</li>
      </ul>
      <p>You will receive a confirmation email once your request is reviewed.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendReservationApproval(
  to: string,
  reservation: ReservationWithRelations
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Room Reservation Approved',
    html: `
      <h2>Room Reservation Approved!</h2>
      <p>Your room reservation has been approved.</p>
      <h3>Details:</h3>
      <ul>
        <li>Room: ${reservation.room.name}</li>
        <li>Location: ${reservation.location.name}</li>
        <li>Date: ${new Date(reservation.date).toLocaleDateString()}</li>
        <li>Time: ${reservation.startTime} - ${reservation.endTime}</li>
      </ul>
      <p>Please arrive on time. If you need to cancel, please contact us as soon as possible.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendReservationDecline(
  to: string,
  reservation: ReservationWithRelations
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Room Reservation Declined',
    html: `
      <h2>Room Reservation Declined</h2>
      <p>Unfortunately, your room reservation request has been declined.</p>
      <h3>Details:</h3>
      <ul>
        <li>Room: ${reservation.room.name}</li>
        <li>Location: ${reservation.location.name}</li>
        <li>Date: ${new Date(reservation.date).toLocaleDateString()}</li>
        <li>Time: ${reservation.startTime} - ${reservation.endTime}</li>
      </ul>
      <p>Please contact us if you have any questions or would like to make another reservation.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendRoomReleasedNotification(
  to: string,
  reservation: ReservationWithRelations
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Room Reservation Released - No Check-In',
    html: `
      <h2>Room Reservation Released</h2>
      <p>Your room reservation has been released because you did not check in within the grace period.</p>
      <h3>Details:</h3>
      <ul>
        <li>Room: ${reservation.room.name}</li>
        <li>Location: ${reservation.location.name}</li>
        <li>Date: ${new Date(reservation.date).toLocaleDateString()}</li>
        <li>Time: ${reservation.startTime} - ${reservation.endTime}</li>
      </ul>
      <p>The room is now available for walk-in bookings. If you still need a room, please check our availability and make a new reservation.</p>
      <p>If you believe this was an error, please contact the library staff.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Simplified type for reminder emails
interface ReminderReservation {
  room: { name: string };
  location: { name: string };
  date: Date;
  startTime: string;
  endTime: string;
}

export async function sendReservationReminder(
  to: string,
  reservation: ReminderReservation,
  reminderType: '24h' | '1h'
): Promise<void> {
  const timeLabel = reminderType === '24h' ? '24 hours' : '1 hour';
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Room Reservation Reminder - ${timeLabel} Until Your Booking`,
    html: `
      <h2>Reservation Reminder</h2>
      <p>This is a reminder that your room reservation is coming up in ${timeLabel}.</p>
      <h3>Details:</h3>
      <ul>
        <li>Room: ${reservation.room.name}</li>
        <li>Location: ${reservation.location.name}</li>
        <li>Date: ${new Date(reservation.date).toLocaleDateString()}</li>
        <li>Time: ${reservation.startTime} - ${reservation.endTime}</li>
      </ul>
      <h3>Check-In Instructions:</h3>
      <p>Please remember to check in when you arrive. You can check in up to 15 minutes before your reservation starts. If you don't check in within 15 minutes after your start time, your reservation may be released to walk-in users.</p>
      <p>Need to cancel? Please do so as soon as possible so others can use the room.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}