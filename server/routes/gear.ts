import { Router } from 'express';
import { 
  handleGetAllGear, 
  handleGetGearById,
  handleGetGearSummary,
  handleCreateGear, 
  handleUpdateGear, 
  handleDeleteGear 
} from './gear/basicOperations';

const router = Router();

// Basic CRUD operations - 完全DB実装
router.get('/', handleGetAllGear);           // GET /api/v1/gear (list with filters)
router.get('/summary', handleGetGearSummary); // GET /api/v1/gear/summary
router.get('/:id', handleGetGearById);       // GET /api/v1/gear/:id
router.post('/', handleCreateGear);          // POST /api/v1/gear
router.put('/:id', handleUpdateGear);        // PUT /api/v1/gear/:id
router.delete('/:id', handleDeleteGear);     // DELETE /api/v1/gear/:id

export default router;