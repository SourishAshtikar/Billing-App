import express from 'express';
import { getProjects, createProject, getProjectById, updateProject, deleteProject, removeResourceFromProject } from '../controllers/projectController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getProjects);
router.post('/', protect, admin, createProject);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, admin, updateProject);
router.delete('/:id', protect, admin, deleteProject);
router.delete('/:projectId/resources/:userId', protect, admin, removeResourceFromProject);

export default router;
