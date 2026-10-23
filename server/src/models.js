import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
}, { timestamps: true });

export const CATEGORIES = ['Facilities', 'IT & Wi-Fi', 'Classrooms', 'Sanitation', 'Safety', 'Other'];
export const STATUSES = ['Open', 'In progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const ASSIGNEES = ['Unassigned', 'Facilities team', 'IT support', 'Housekeeping', 'Campus security', 'Academic office'];
const eventSchema = new Schema({
  actor: { type: String, required: true },
  message: { type: String, required: true, maxlength: 1000 },
  kind: { type: String, enum: ['status', 'comment', 'assignment', 'created', 'edited'], required: true },
  at: { type: Date, default: Date.now },
}, { _id: true });
const issueSchema = new Schema({
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 3000 },
  location: { type: String, required: true, maxlength: 120 },
  category: { type: String, enum: CATEGORIES, required: true },
  priority: { type: String, enum: PRIORITIES, default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'Open' },
  assignee: { type: String, enum: ASSIGNEES, default: 'Unassigned' },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  history: { type: [eventSchema], default: [] },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true, optimisticConcurrency: true });
issueSchema.index({ reporter: 1, status: 1, createdAt: -1 });
issueSchema.index({ status: 1, createdAt: -1 });
export const User = model('User', userSchema);
export const Issue = model('Issue', issueSchema);
