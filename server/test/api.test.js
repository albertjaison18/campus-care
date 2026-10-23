import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, Issue } from '../src/models.js';
let mongo, app, alice, bob, admin, aliceUser, issueId;
const password = randomBytes(18).toString('hex');
const report = { title: 'Library Wi-Fi drops connection', description: 'The library network disconnects every few minutes near the reading desks.',
  location: 'Library first floor', category: 'IT & Wi-Fi', priority: 'Medium' };
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14', downloadDir: fileURLToPath(new URL('../../.local-data/mongodb-binaries', import.meta.url)) } });
  await mongoose.connect(mongo.getUri('campus_care_test'));
  await User.init();
  app = createApp({ jwtSecret: randomBytes(48).toString('hex'), rateLimit: false, logErrors: false });
  alice = request.agent(app); bob = request.agent(app); admin = request.agent(app);
  aliceUser = (await alice.post('/api/auth/register').send({ name: 'Alice Test', email: 'alice@example.test', password }).expect(201)).body.user;
  await bob.post('/api/auth/register').send({ name: 'Bob Test', email: 'bob@example.test', password }).expect(201);
  await User.create({ name: 'Test Administrator', email: 'admin@example.test', role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
  await admin.post('/api/auth/login').send({ email: 'admin@example.test', password }).expect(200);
}, { timeout: 120000 });
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
test('protected routes reject anonymous requests', async () => {
  await request(app).get('/api/issues').expect(401);
  await request(app).get('/api/issues/stats').expect(401);
});
test('registration cannot create an administrator and duplicate emails are rejected', async () => {
  await request(app).post('/api/auth/register').send({ name: 'Intruder', email: 'intruder@example.test', password, role: 'admin' }).expect(400);
  await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'ALICE@example.test', password }).expect(409);
});
test('passwords are hashed and omitted from public responses', async () => {
  const stored = await User.findById(aliceUser.id).select('+passwordHash');
  assert.notEqual(stored.passwordHash, password);
  assert.ok(await bcrypt.compare(password, stored.passwordHash));
  const me = (await alice.get('/api/auth/me').expect(200)).body.user;
  assert.equal(me.passwordHash, undefined);
  assert.equal(me.role, 'student');
});
test('login rejects bad credentials and sets an HTTP-only session cookie', async () => {
  await request(app).post('/api/auth/login').send({ email: 'alice@example.test', password: 'incorrect' }).expect(401);
  await request(app).post('/api/auth/login').send({ email: 'unknown@example.test', password: 'incorrect' }).expect(401);
  const response = await request(app).post('/api/auth/login').send({ email: 'alice@example.test', password }).expect(200);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  assert.match(response.headers['set-cookie'][0], /SameSite=Lax/);
});
test('invalid reports and forged fields are rejected', async () => {
  await alice.post('/api/issues').send({ ...report, title: 'x' }).expect(400);
  await request(app).post('/api/auth/register').send({ name: 'Unicode Test', email: 'unicode@example.test', password: String.fromCodePoint(0x1f600).repeat(25) }).expect(400);
  await alice.post('/api/issues').send({ ...report, status: 'Resolved' }).expect(400);
  await alice.post('/api/issues').send({ ...report, reporter: 'forged-owner' }).expect(400);
});
test('creating a report stores real MongoDB data with owner and history', async () => {
  const response = await alice.post('/api/issues').send(report).expect(201);
  issueId = response.body.issue._id;
  const stored = await Issue.findById(issueId);
  assert.equal(String(stored.reporter), aliceUser.id);
  assert.equal(stored.status, 'Open');
  assert.equal(stored.history[0].kind, 'created');
});
test('other students cannot read, edit, delete, comment on or count another student’s issue', async () => {
  await bob.get('/api/issues/' + issueId).expect(404);
  await bob.patch('/api/issues/' + issueId).send({ title: 'Attempted edit' }).expect(404);
  await bob.delete('/api/issues/' + issueId).expect(404);
  await bob.post('/api/issues/' + issueId + '/comments').send({ message: 'Attempted comment' }).expect(404);
  assert.equal((await bob.get('/api/issues').expect(200)).body.total, 0);
  assert.equal((await bob.get('/api/issues/stats').expect(200)).body.total, 0);
});
test('owners can edit open reports and comments are stored in activity history', async () => {
  await alice.patch('/api/issues/' + issueId).send({ location: 'Library second floor' }).expect(200);
  const response = await alice.post('/api/issues/' + issueId + '/comments').send({ message: 'Still happening this morning.' }).expect(201);
  assert.equal(response.body.issue.history.at(-1).message, 'Still happening this morning.');
});
test('students cannot use administrator controls', async () => {
  await alice.patch('/api/issues/' + issueId + '/manage').send({ status: 'In progress', assignee: 'IT support', priority: 'High' }).expect(403);
});
test('admins can assign work and follow valid status transitions', async () => {
  assert.equal((await admin.get('/api/issues').expect(200)).body.total, 1);
  await admin.patch('/api/issues/' + issueId + '/manage').send({ status: 'Resolved', assignee: 'IT support', priority: 'High' }).expect(409);
  const result = await admin.patch('/api/issues/' + issueId + '/manage').send({ status: 'In progress', assignee: 'IT support', priority: 'High' }).expect(200);
  assert.equal(result.body.issue.assignee, 'IT support');
  await alice.patch('/api/issues/' + issueId).send({ title: 'Should not be edited' }).expect(409);
  await alice.delete('/api/issues/' + issueId).expect(409);
  const resolved = await admin.patch('/api/issues/' + issueId + '/manage').send({ status: 'Resolved', assignee: 'IT support', priority: 'High' }).expect(200);
  assert.ok(resolved.body.issue.resolvedAt);
  await admin.patch('/api/issues/' + issueId + '/manage').send({ status: 'Closed', assignee: 'IT support', priority: 'High' }).expect(200);
});
test('search, filters, statistics, and pagination return consistent results', async () => {
  const result = await alice.get('/api/issues?search=Library&status=Closed&priority=High&limit=1').expect(200);
  assert.equal(result.body.total, 1);
  assert.equal(result.body.items.length, 1);
  const stats = (await alice.get('/api/issues/stats').expect(200)).body;
  assert.equal(stats.counts.Closed, 1);
  await alice.get('/api/issues?limit=10000').expect(400);
  await alice.get('/api/issues?page=-1').expect(400);
  await alice.get('/api/issues?status[$ne]=Closed').expect(200);
  const literal = await alice.get('/api/issues?search=%5B').expect(200);
  assert.equal(literal.body.total, 0);
});
test('open reports can be deleted and invalid ids return safe errors', async () => {
  const created = (await alice.post('/api/issues').send({ ...report, title: 'A report to remove' }).expect(201)).body.issue;
  await alice.delete('/api/issues/' + created._id).expect(204);
  await alice.get('/api/issues/' + created._id).expect(404);
  await alice.get('/api/issues/invalid-id').expect(404);
});
test('cross-origin writes are blocked and logout clears access', async () => {
  await alice.post('/api/issues').set('Origin', 'https://untrusted.example').send(report).expect(403);
  await alice.post('/api/auth/logout').expect(204);
  await alice.get('/api/auth/me').expect(401);
});


test('production emits secure cookies and serves the compiled frontend with SPA fallback', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let productionApp;
  try { productionApp = createApp({ jwtSecret: randomBytes(48).toString('hex'), rateLimit: false, logErrors: false }); }
  finally { process.env.NODE_ENV = previous || 'test'; }
  const response = await request(productionApp).post('/api/auth/login').send({ email: 'admin@example.test', password }).expect(200);
  assert.match(response.headers['set-cookie'][0], /Secure/);
  await request(productionApp).get('/api/health').expect(200);
  const page = await request(productionApp).get('/').expect(200);
  assert.match(page.text, /Campus Care/);
  await request(productionApp).get('/dashboard').expect(200);
});
