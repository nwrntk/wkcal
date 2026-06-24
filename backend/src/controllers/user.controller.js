const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/password');

const prisma = new PrismaClient();

const safeUser = ({ id, username, name, nick_name, email, role, createdAt }) =>
  ({ id, username, name, nick_name, email, role, createdAt });

const listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, nick_name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const { username, password, name, nick_name } = req.body;
    if (!username || !password) {
      return res.status(422).json({ success: false, message: 'username and password are required' });
    }
    const hashed = await hashPassword(password);
    const email = `${username}@calculus.local`;
    const user = await prisma.user.create({
      data: { username, password: hashed, name: name || '', nick_name: nick_name || '', email },
    });
    res.status(201).json({ success: true, data: safeUser(user) });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: `Username "${req.body.username}" already exists` });
    }
    next(err);
  }
};

const bulkCreate = async (req, res, next) => {
  try {
    const rows = req.body.users;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(422).json({ success: false, message: 'No users provided' });
    }

    const results = { created: [], failed: [] };

    for (const row of rows) {
      const { username, password, name, nick_name } = row;
      if (!username || !password) {
        results.failed.push({ username, reason: 'Missing username or password' });
        continue;
      }
      try {
        const hashed = await hashPassword(password);
        const email = `${username}@calculus.local`;
        const user = await prisma.user.create({
          data: { username, password: hashed, name: name || '', nick_name: nick_name || '', email },
        });
        results.created.push(safeUser(user));
      } catch (e) {
        results.failed.push({ username, reason: e.code === 'P2002' ? 'Username already exists' : e.message });
      }
    }

    res.status(201).json({ success: true, data: results });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nick_name, role } = req.body;
    const data = {};
    if (name      !== undefined) data.name      = name;
    if (nick_name !== undefined) data.nick_name = nick_name;
    if (role      !== undefined) {
      if (!['USER','ADMIN'].includes(role)) {
        return res.status(422).json({ success: false, message: 'Invalid role' });
      }
      if (id === req.user.sub && role !== 'ADMIN') {
        return res.status(400).json({ success: false, message: 'Cannot demote your own account' });
      }
      data.role = role;
    }
    const user = await prisma.user.update({ where: { id }, data });
    res.json({ success: true, data: safeUser(user) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found' });
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(422).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { listUsers, createUser, bulkCreate, updateUser, deleteUser, resetPassword };
