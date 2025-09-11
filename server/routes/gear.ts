import { Router } from 'express';
import { 
  handleGetAllGear, 
  handleCreateGear, 
  handleUpdateGear, 
  handleDeleteGear 
} from './gear/basicOperations';
import { handlePatchGear } from './gear/patchOperations';
import { handleBulkOperations, handleLegacyBulkDelete } from './gear/bulkOperations';
import { handleGetGearHistory, handleRevertGear } from './gear/historyOperations';

const router = Router();

// Basic CRUD operations
router.get('/', handleGetAllGear);
router.post('/', handleCreateGear);
router.put('/:id', handleUpdateGear);
router.delete('/:id', handleDeleteGear);

// Advanced operations
router.patch('/:id', handlePatchGear);
router.patch('/bulk', handleBulkOperations);

// History and versioning
router.get('/:id/history', handleGetGearHistory);
router.post('/:id/revert/:historyId', handleRevertGear);

// Legacy compatibility
router.post('/bulk-delete', handleLegacyBulkDelete);

export default router;