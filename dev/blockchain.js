const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v4: uuidv4 } = require('uuid')

function Blockchain() {
    this.chain = [];
    this.pendingTranscations = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    // creating genesis block
    this.createNewBlock(777, 'block', 'chain');
}


Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        nonce,
        previousBlockHash,
        hash,
        transcations: this.pendingTranscations
    };

    this.pendingTranscations = [];
    this.chain.push(newBlock);
    return newBlock;
}

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTranscation = function (amount, sender, recipient) {
    const newTranscation = { amount, sender, recipient, transcationId: uuidv4().split('-').join('') };
    return newTranscation;
}

Blockchain.prototype.addTranscationToPendingTranscations = function (newTranscation) {
    this.pendingTranscations.push(newTranscation);
    // returns which block index will this new transcation will be recorded(in the future).
    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = `${previousBlockHash}${nonce.toString()}${JSON.stringify(currentBlockData)}`;
    const hash = sha256(dataAsString);
    return hash;
}

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function (blockchain) {
    let isValidChain = true;

    for (let i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i - 1];
        const blockHash = this.hashBlock(previousBlock['hash'], { transcations: currentBlock['transcations'], index: currentBlock['index'] }, currentBlock['nonce']);
        if (blockHash.substring(0, 4) !== '0000') isValidChain = false;
        if (currentBlock['previousBlockHash'] !== previousBlock['hash']) isValidChain = false;
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 777;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === 'block';
    const correctHash = genesisBlock['hash'] === 'chain';
    const correctTransactions = genesisBlock['transcations'].length === 0;

    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) isValidChain = false;

    return isValidChain;
}

Blockchain.prototype.getBlock = function (blockHash) {
    const block = this.chain.find(blck => blck.hash === blockHash);
    return block ? block : null;
}

Blockchain.prototype.getTranscation = function (transcationId) {
    let transaction = null;
    let block = null;
    block:
    for (let i = 0; i < this.chain.length; i++) {
        for (let j = 0; j < this.chain[i].transcations.length; j++) {
            if (this.chain[i].transcations[j].transcationId === transcationId) {
                transaction = this.chain[i].transcations[j];
                block = this.chain[i];
                break block;
            }
        }
    }
    return { transaction, block };
}

Blockchain.prototype.getAddressData = function (address) {
    const addressTranscations = [];
    this.chain.forEach(block => {
        block.transcations.forEach(transcation => {
            if (transcation.sender === address || transcation.recipient === address) {
                addressTranscations.push(transcation);
            }
        })
    })

    let balance = 0;
    addressTranscations.forEach(transcation => {
        if (transcation.sender === address) { balance -= transcation.amount; }
        else if (transcation.recipient === address) { balance += transcation.amount; }
    })
    return { addressTranscations, balance };
}




module.exports = Blockchain;