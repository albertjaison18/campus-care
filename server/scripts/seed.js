import dotenv from 'dotenv';
import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { User, Issue } from '../src/models.js';

export async function seedDemo() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || !DEMO_PASSWORD || DEMO_PASSWORD.length < 12) {
    throw new Error('Seeding requires ADMIN_EMAIL and passwords of at least 12 characters in the environment.');
  }
  const admin = await User.findOneAndUpdate({ email: ADMIN_EMAIL.toLowerCase() },
    { $setOnInsert: { name: 'Campus Administrator', role: 'admin', passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12) } },
    { upsert: true, returnDocument: 'after' });
  let student = await User.findOne({ email: 'student@campus.example' });
  if (!student) student = await User.create({ name: 'Alex Student', email: 'student@campus.example',
    role: 'student', passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12) });
  await Issue.updateMany({ reporter: student._id }, [
    { $set: { location: { $replaceAll: { input: '$location', find: String.fromCharCode(194,183), replacement: String.fromCharCode(183) } } } }
  ]);
  if (await Issue.exists({ reporter: student._id })) return;
  const examples = [
    ['Projector not working in Room 204', 'The projector powers on, but the image stays blank with two different laptops. Please check the HDMI connection before the next class.', 'Academic block · Room 204', 'Classrooms', 'High', 'In progress', 'IT support', 1],
    ['Wi-Fi disconnects in the library', 'The library wireless network disconnects repeatedly in the reading area. Several students noticed the same issue this afternoon.', 'Central library · First floor', 'IT & Wi-Fi', 'Medium', 'Open', 'Unassigned', 2],
    ['Water cooler needs maintenance', 'The water cooler near the main staircase is leaking onto the floor. The surrounding area becomes slippery after use.', 'Main block · Ground floor', 'Facilities', 'High', 'Open', 'Unassigned', 3],
    ['Broken light near the east walkway', 'One of the pathway lights near the east entrance is not working. The walkway is difficult to see after evening classes.', 'East entrance · Walkway', 'Safety', 'High', 'In progress', 'Facilities team', 4],
    ['Classroom fan repaired', 'The ceiling fan in the second row was making a loud rattling noise and stopping intermittently during lectures.', 'Academic block · Room 102', 'Facilities', 'Medium', 'Resolved', 'Facilities team', 5],
    ['Restroom cleaning request', 'The washbasin area needs attention and one of the soap dispensers is empty. Please schedule a cleaning round.', 'Science block · Second floor', 'Sanitation', 'Medium', 'Resolved', 'Housekeeping', 6],
    ['Computer lab keyboard replaced', 'The keyboard at workstation twelve has several keys that do not respond. It prevents completing lab exercises.', 'Computer lab · Workstation 12', 'IT & Wi-Fi', 'Low', 'Closed', 'IT support', 7],
    ['Whiteboard marker tray is loose', 'The marker tray is coming away from the wall and could fall. Please secure the brackets when the room is free.', 'Academic block · Room 301', 'Classrooms', 'Low', 'Open', 'Unassigned', 8],
  ];
  await Issue.insertMany(examples.map(([title, description, location, category, priority, status, assignee, days]) => {
    const createdAt = new Date(Date.now() - days * 86400000);
    const history = [{ actor: student.name, message: 'Reported this issue.', kind: 'created', at: createdAt }];
    if (status !== 'Open') history.push({ actor: admin.name, message: 'Changed status from Open to In progress.', kind: 'status', at: new Date(+createdAt + 3600000) });
    if (['Resolved', 'Closed'].includes(status)) history.push({ actor: admin.name, message: 'Changed status from In progress to Resolved.', kind: 'status', at: new Date(+createdAt + 7200000) });
    if (status === 'Closed') history.push({ actor: admin.name, message: 'Changed status from Resolved to Closed.', kind: 'status', at: new Date(+createdAt + 10800000) });
    return { title, description, location, category, priority, status, assignee, reporter: student._id, history,
      createdAt, updatedAt: history.at(-1).at, resolvedAt: ['Resolved', 'Closed'].includes(status) ? new Date(+createdAt + 7200000) : null };
  }));
  console.log('Created fictional campus reports for local demonstration.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  dotenv.config();
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  await seedDemo();
  await mongoose.disconnect();
}
