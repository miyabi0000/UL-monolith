import { Router } from 'express';
import { 
  handleGetAllGear, 
  handleGetGearById,
  handleGetGearSummary,
  handleCreateGear, 
  handleUpdateGear, 
  handleDeleteGear 
} from './gear/basicOperations';
import { handlePatchGear } from './gear/patchOperations';
import { handleBulkOperations, handleLegacyBulkDelete } from './gear/bulkOperations';
import { handleGetGearHistory, handleRevertGear } from './gear/historyOperations';

const router = Router();

// Basic CRUD operations
router.get('/', handleGetAllGear);           // GET /api/v1/gear (list with filters)
router.get('/summary', handleGetGearSummary); // GET /api/v1/gear/summary
router.get('/:id', handleGetGearById);       // GET /api/v1/gear/:id
router.post('/', handleCreateGear);          // POST /api/v1/gear
router.put('/:id', handleUpdateGear);        // PUT /api/v1/gear/:id
router.delete('/:id', handleDeleteGear);     // DELETE /api/v1/gear/:id

// Advanced operations  
router.patch('/bulk', handleBulkOperations);
router.patch('/:id', handlePatchGear);

// History and versioning
router.get('/:id/history', handleGetGearHistory);
router.post('/:id/revert/:historyId', handleRevertGear);

// Legacy compatibility
router.post('/bulk-delete', handleLegacyBulkDelete);

export default router;