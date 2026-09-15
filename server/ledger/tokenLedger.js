/**
 * tokenLedger.js
 *
 * A minimal, in-memory "smart contract" simulator.
 * It mimics the core primitives of an ERC-20-style token contract
 * (mint / transfer / balanceOf / totalSupply) without touching any
 * real blockchain, node, or wallet infrastructure.
 *
 * Every property gets its own independent ledger, keyed by a
 * "contract address" string (e.g. the tokenDetails.contractAddress
 * already used on the frontend, such as "0x1234...5678").
 *
 * State is kept in memory for simplicity. Swap the Map-based storage
 * for a Mongoose model (see server/models) if persistence is needed
 * later - the public methods below would not need to change.
 */

const crypto = require('crypto');

class TokenContract {
  constructor({ contractAddress, symbol, name, owner }) {
    this.contractAddress = contractAddress;
    this.symbol = symbol;
    this.name = name || symbol;
    this.owner = owner || 'SYSTEM';
    this.balances = new Map(); // address -> integer token balance
    this.totalSupply = 0;
    this.history = []; // append-only "chain" of events
  }

  _record(type, payload) {
    const entry = {
      type,
      ...payload,
      timestamp: new Date().toISOString(),
    };
    // hash chained to the previous entry, loosely mimicking a block link
    const prevHash = this.history.length
      ? this.history[this.history.length - 1].hash
      : '0'.repeat(64);
    entry.prevHash = prevHash;
    entry.hash = crypto
      .createHash('sha256')
      .update(prevHash + JSON.stringify({ type, ...payload }))
      .digest('hex');
    this.history.push(entry);
    return entry;
  }

  balanceOf(address) {
    return this.balances.get(address) || 0;
  }

  mint(toAddress, amount) {
    if (amount <= 0) throw new Error('Mint amount must be positive');
    const current = this.balanceOf(toAddress);
    this.balances.set(toAddress, current + amount);
    this.totalSupply += amount;
    return this._record('MINT', { to: toAddress, amount });
  }

  transfer(fromAddress, toAddress, amount) {
    if (amount <= 0) throw new Error('Transfer amount must be positive');
    const fromBalance = this.balanceOf(fromAddress);
    if (fromBalance < amount) throw new Error('Insufficient balance');

    this.balances.set(fromAddress, fromBalance - amount);
    this.balances.set(toAddress, this.balanceOf(toAddress) + amount);

    return this._record('TRANSFER', { from: fromAddress, to: toAddress, amount });
  }

  getAllBalances() {
    return Object.fromEntries(this.balances);
  }
}

/**
 * TokenLedger acts as the "chain" registry: it deploys and looks up
 * individual TokenContract instances, similar to how a factory
 * contract would track deployed token contracts on-chain.
 */
class TokenLedger {
  constructor() {
    this.contracts = new Map(); // contractAddress -> TokenContract
  }

  deployContract({ contractAddress, symbol, name, owner }) {
    if (this.contracts.has(contractAddress)) {
      return this.contracts.get(contractAddress);
    }
    const contract = new TokenContract({ contractAddress, symbol, name, owner });
    this.contracts.set(contractAddress, contract);
    return contract;
  }

  getContract(contractAddress) {
    const contract = this.contracts.get(contractAddress);
    if (!contract) {
      throw new Error(`No contract deployed at address ${contractAddress}`);
    }
    return contract;
  }

  listContracts() {
    return Array.from(this.contracts.values()).map((c) => ({
      contractAddress: c.contractAddress,
      symbol: c.symbol,
      name: c.name,
      totalSupply: c.totalSupply,
    }));
  }
}

// Singleton instance shared across the app (mirrors a single deployed chain state)
const ledger = new TokenLedger();

module.exports = { ledger, TokenLedger, TokenContract };