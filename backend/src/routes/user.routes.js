const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { listUsers, createUser, bulkCreate, updateUser, deleteUser, resetPassword } = require('../controllers/user.controller');

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get   ('/',          listUsers);
router.post  ('/',          createUser);
router.post  ('/bulk',      bulkCreate);
router.patch ('/:id',          updateUser);
router.delete('/:id',          deleteUser);
router.patch ('/:id/password', resetPassword);

module.exports = router;
