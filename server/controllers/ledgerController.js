const { ledger } = require('../ledger/tokenLedger');

// POST /api/ledger/deploy
// body: { contractAddress, symbol, name, owner }
exports.deployContract = (req, res) => {
  try {
    const { contractAddress, symbol, name, owner } = req.body;
    if (!contractAddress || !symbol) {
      return res.status(400).json({ success: false, message: 'contractAddress and symbol are required' });
    }
    const contract = ledger.deployContract({ contractAddress, symbol, name, owner });
    res.status(201).json({
      success: true,
      contract: {
        contractAddress: contract.contractAddress,
        symbol: contract.symbol,
        name: contract.name,
        owner: contract.owner,
        totalSupply: contract.totalSupply,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/ledger/contracts
exports.listContracts = (req, res) => {
  res.status(200).json({ success: true, contracts: ledger.listContracts() });
};

// POST /api/ledger/:contractAddress/mint
// body: { to, amount }
exports.mint = (req, res) => {
  try {
    const { contractAddress } = req.params;
    const { to, amount } = req.body;
    if (!to || !amount) {
      return res.status(400).json({ success: false, message: 'to and amount are required' });
    }
    const contract = ledger.getContract(contractAddress);
    const event = contract.mint(to, Number(amount));
    res.status(200).json({
      success: true,
      event,
      balance: contract.balanceOf(to),
      totalSupply: contract.totalSupply,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/ledger/:contractAddress/transfer
// body: { from, to, amount }
exports.transfer = (req, res) => {
  try {
    const { contractAddress } = req.params;
    const { from, to, amount } = req.body;
    if (!from || !to || !amount) {
      return res.status(400).json({ success: false, message: 'from, to and amount are required' });
    }
    const contract = ledger.getContract(contractAddress);
    const event = contract.transfer(from, to, Number(amount));
    res.status(200).json({
      success: true,
      event,
      fromBalance: contract.balanceOf(from),
      toBalance: contract.balanceOf(to),
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/ledger/:contractAddress/balance/:address
exports.getBalance = (req, res) => {
  try {
    const { contractAddress, address } = req.params;
    const contract = ledger.getContract(contractAddress);
    res.status(200).json({
      success: true,
      address,
      balance: contract.balanceOf(address),
      totalSupply: contract.totalSupply,
    });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// GET /api/ledger/:contractAddress/history
exports.getHistory = (req, res) => {
  try {
    const { contractAddress } = req.params;
    const contract = ledger.getContract(contractAddress);
    res.status(200).json({ success: true, history: contract.history });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};