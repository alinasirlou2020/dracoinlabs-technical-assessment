const express = require('express');
const router = express.Router();
const {
  deployContract,
  listContracts,
  mint,
  transfer,
  getBalance,
  getHistory,
} = require('../controllers/ledgerController');

router.post('/deploy', deployContract);
router.get('/contracts', listContracts);

router.post('/:contractAddress/mint', mint);
router.post('/:contractAddress/transfer', transfer);
router.get('/:contractAddress/balance/:address', getBalance);
router.get('/:contractAddress/history', getHistory);

module.exports = router;