import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { User, Issue, CATEGORIES, STATUSES, PRIORITIES, ASSIGNEES } from './models.js';

const publicUser = user => ({ id: String(user._id), name: user.name, email: user.email, role: user.role });
const problem = (status, message) => Object.assign(new Error(message), { status });
const cleanText = (min, max) => z.string().trim().min(min).max(max);
const email = z.email().max(254).transform(value => value.toLowerCase());
const password = z.string().min(12, 'Use at least 12 characters.').max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be 72 UTF-8 bytes or fewer.');
const issueFields = {
  title: cleanText(5, 120), description: cleanText(15, 3000), location: cleanText(2, 120),
  category: z.enum(CATEGORIES), priority: z.enum(PRIORITIES),
};
const createIssue = z.object(issueFields).strict();
const editIssue = createIssue.partial().refine(data => Object.keys(data).length > 0, 'Choose something to update.');
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
  status: z.enum(STATUSES).optional(), category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(), search: cleanText(0, 100).optional(),
  sort: z.enum(['newest', 'oldest', 'updated']).default('newest'),
});

export function createApp(config = {}) {
  const app = express();
  const secret = config.jwtSecret || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
  const production = process.env.NODE_ENV === 'production';
  const origins = (process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (production) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin(origin, cb) { cb(null, !origin || origins.includes(origin)); }, credentials: true }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  // Reject cross-origin writes even when a browser attaches an authentication cookie.
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && !origins.includes(req.headers.origin)) {
      return next(problem(403, 'This origin is not allowed.'));
    }
    res.set('Cache-Control', 'no-store');
    next();
  });
  if (config.rateLimit !== false) {
    app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false,
      message: { message: 'Too many requests. Please try again later.' } }));
    app.use(['/api/auth/login', '/api/auth/register'], rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
      standardHeaders: 'draft-8', legacyHeaders: false,
      message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' } }));
  }
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/api' };
  function signIn(res, user) {
    const token = jwt.sign({ sub: String(user._id) }, secret, { expiresIn: '8h', issuer: 'campus-care', audience: 'campus-care-web' });
    res.cookie('campus_session', token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  }
  async function auth(req, res, next) {
    try {
      const token = req.cookies.campus_session;
      if (!token) throw new Error();
      const payload = jwt.verify(token, secret, { issuer: 'campus-care', audience: 'campus-care-web', algorithms: ['HS256'] });
      req.user = await User.findById(payload.sub);
      if (!req.user) throw new Error();
      next();
    } catch { next(problem(401, 'Please sign in to continue.')); }
  }
  function admin(req, res, next) {
    return req.user.role === 'admin' ? next() : next(problem(403, 'Administrator access is required.'));
  }
  async function ownedIssue(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) throw problem(404, 'Issue not found.');
    req.issue = await Issue.findOne({ _id: req.params.id, ...(req.user.role === 'admin' ? {} : { reporter: req.user._id }) });
    if (!req.issue) throw problem(404, 'Issue not found.');
    next();
  }
  async function populatedIssue(id) { return Issue.findById(id).populate('reporter', 'name email').lean(); }
  const event = (req, kind, message) => ({ actor: req.user.name, kind, message, at: new Date() });

  app.get('/api/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' }));
  app.post('/api/auth/register', async (req, res) => {
    const input = z.object({ name: cleanText(2, 80), email, password }).strict().parse(req.body);
    if (await User.exists({ email: input.email })) throw problem(409, 'An account with this email already exists.');
    const user = await User.create({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), role: 'student' });
    signIn(res, user);
    res.status(201).json({ user: publicUser(user) });
  });
  app.post('/api/auth/login', async (req, res) => {
    const input = z.object({ email, password: z.string().min(1).max(72) }).strict().parse(req.body);
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    // A comparison is performed even when no user exists to reduce timing differences.
    const fallback = '$2b$12$4rM7fsQY7q8XHW5a3R3jzeTYPK1pVhZHAQK.EhRZVvNP7oIIf4A0K';
    const valid = await bcrypt.compare(input.password, user?.passwordHash || fallback);
    if (!user || !valid) throw problem(401, 'Email or password is incorrect.');
    signIn(res, user);
    res.json({ user: publicUser(user) });
  });
  app.post('/api/auth/logout', (req, res) => { res.clearCookie('campus_session', cookieOptions); res.status(204).end(); });
  app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
  app.get('/api/meta', auth, (req, res) => res.json({ categories: CATEGORIES, statuses: STATUSES, priorities: PRIORITIES, assignees: ASSIGNEES }));

  app.get('/api/issues/stats', auth, async (req, res) => {
    const match = req.user.role === 'admin' ? {} : { reporter: req.user._id };
    const rows = await Issue.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const counts = Object.fromEntries(STATUSES.map(status => [status, rows.find(row => row._id === status)?.count || 0]));
    const categories = await Issue.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]);
    res.json({ total: Object.values(counts).reduce((a, b) => a + b, 0), counts, categories });
  });
  app.get('/api/issues', auth, async (req, res) => {
    const query = listQuery.parse(req.query);
    const filter = req.user.role === 'admin' ? {} : { reporter: req.user._id };
    for (const key of ['status', 'category', 'priority']) if (query[key]) filter[key] = query[key];
    if (query.search) {
      const literal = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['title', 'description', 'location'].map(key => ({ [key]: { $regex: literal, $options: 'i' } }));
    }
    const sorts = { newest: { createdAt: -1, _id: -1 }, oldest: { createdAt: 1, _id: 1 }, updated: { updatedAt: -1, _id: -1 } };
    const [items, total] = await Promise.all([
      Issue.find(filter).select('-history').populate('reporter', 'name email').sort(sorts[query.sort])
        .skip((query.page - 1) * query.limit).limit(query.limit).lean(), Issue.countDocuments(filter),
    ]);
    res.json({ items, total, page: query.page, pages: Math.max(1, Math.ceil(total / query.limit)) });
  });
  app.post('/api/issues', auth, async (req, res) => {
    const input = createIssue.parse(req.body);
    const issue = await Issue.create({ ...input, reporter: req.user._id, history: [event(req, 'created', 'Reported this issue.')] });
    res.status(201).json({ issue: await populatedIssue(issue._id) });
  });
  app.get('/api/issues/:id', auth, ownedIssue, async (req, res) => res.json({ issue: await populatedIssue(req.issue._id) }));
  app.patch('/api/issues/:id', auth, ownedIssue, async (req, res) => {
    const input = editIssue.parse(req.body);
    if (req.issue.status !== 'Open') throw problem(409, 'Only open reports can be edited. Add a comment for other updates.');
    if (req.issue.history.length >= 200) throw problem(409, 'This report has reached its activity limit.');
    Object.assign(req.issue, input);
    req.issue.history.push(event(req, 'edited', 'Updated the report details.'));
    await req.issue.save();
    res.json({ issue: await populatedIssue(req.issue._id) });
  });
  app.delete('/api/issues/:id', auth, ownedIssue, async (req, res) => {
    if (req.issue.status !== 'Open') throw problem(409, 'Only open reports can be deleted.');
    const deleted = await Issue.deleteOne({ _id: req.issue._id, status: 'Open', __v: req.issue.__v });
    if (!deleted.deletedCount) throw problem(409, 'This report changed. Refresh and try again.');
    res.status(204).end();
  });
  app.post('/api/issues/:id/comments', auth, ownedIssue, async (req, res) => {
    const input = z.object({ message: cleanText(1, 1000) }).strict().parse(req.body);
    if (req.issue.history.length >= 200) throw problem(409, 'This report has reached its activity limit.');
    req.issue.history.push(event(req, 'comment', input.message));
    await req.issue.save();
    res.status(201).json({ issue: await populatedIssue(req.issue._id) });
  });
  app.patch('/api/issues/:id/manage', auth, admin, ownedIssue, async (req, res) => {
    const input = z.object({ status: z.enum(STATUSES), assignee: z.enum(ASSIGNEES), priority: z.enum(PRIORITIES) }).strict().parse(req.body);
    if (req.issue.history.length >= 200) throw problem(409, 'This report has reached its activity limit.');
    if (input.status !== req.issue.status) {
      const transitions = { Open: ['In progress', 'Closed'], 'In progress': ['Open', 'Resolved'], Resolved: ['In progress', 'Closed'], Closed: ['Open'] };
      if (!transitions[req.issue.status].includes(input.status)) throw problem(409, 'That status transition is not allowed.');
      req.issue.history.push(event(req, 'status', `Changed status from ${req.issue.status} to ${input.status}.`));
      req.issue.resolvedAt = input.status === 'Resolved' ? new Date() : input.status === 'Closed' ? req.issue.resolvedAt : null;
    }
    if (input.assignee !== req.issue.assignee) req.issue.history.push(event(req, 'assignment', `Assigned to ${input.assignee}.`));
    if (input.priority !== req.issue.priority) req.issue.history.push(event(req, 'edited', `Changed priority to ${input.priority}.`));
    if (req.issue.history.length > 200) throw problem(409, 'This update would exceed the activity limit.');
    Object.assign(req.issue, input);
    await req.issue.save();
    res.json({ issue: await populatedIssue(req.issue._id) });
  });
  app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
  const dist = fileURLToPath(new URL('../../client/dist', import.meta.url));
  if (existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.issues[0]?.message || 'Check the information you entered.',
      fields: Object.fromEntries(err.issues.map(issue => [issue.path.join('.'), issue.message])) });
    if (err.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
    if (err.name === 'VersionError') return res.status(409).json({ message: 'Someone updated this report. Refresh and try again.' });
    const status = err.status || 500;
    if (status >= 500 && config.logErrors !== false) console.error(err);
    res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
  });
  return app;
}
