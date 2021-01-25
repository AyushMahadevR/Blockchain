const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const Blockchain = require('./blockchain')
const { v4: uuidv4 } = require('uuid')
const port = process.argv[2]
const rp = require('request-promise')

const nodeAddress = uuidv4().split('-').join('')

const bitcoin = new Blockchain()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/blockchain', function (req, res) {
    res.send(bitcoin);
})

app.post('/transcation', function (req, res) {
    const newTranscation = req.body
    const blockIndex = bitcoin.addTranscationToPendingTranscations(newTranscation)
    res.json({ "status": "success", "msg": `Transcation will be added in the block number: ${blockIndex}` })
})

app.post('/transcation/broadcast', function (req, res) {
    const { amount, sender, recipient } = req.body
    const newTranscation = bitcoin.createNewTranscation(amount, sender, recipient)
    bitcoin.addTranscationToPendingTranscations(newTranscation)
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const transcationOptions = {
            uri: networkNodeUrl + '/transcation',
            method: 'POST',
            body: newTranscation,
            json: true
        }
        requestPromises.push(rp(transcationOptions))
    })
    Promise.all(requestPromises)
        .then(data => {
            res.json({ "status": "success", "msg": "Transcation created and broadcasted successfully." })
        })
})

app.get('/mine', function (req, res) {
    const { index, hash: previousBlockHash } = bitcoin.getLastBlock()
    const currentBlockData = { transcations: bitcoin.pendingTranscations, index: index + 1 }
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce)
    bitcoin.createNewTranscation(12.5, "00", nodeAddress)
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash)
    //broadcast to other nodes
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/recieve-new-block',
            method: 'POST',
            body: { newBlock },
            json: true
        }
        requestPromises.push(rp(requestOptions))
    })
    Promise.all(requestPromises)
        .then(data => {
            const requestOptions = {
                uri: bitcoin.currentNodeUrl + '/transcation/broadcast',
                method: 'POST',
                body: { amount: 12.5, sender: "00", recipient: nodeAddress },
                json: true
            }
            return rp(requestOptions)
        })
        .then(data => {
            res.json({ "status": "success", "msg": "New block mined successfully.", "block": newBlock })
        })
})

app.post('/register-and-broadcast-node', function (req, res) {
    // add/register the newurl to current networknode.
    const { newNodeUrl } = req.body
    const newNodeNotPresent = bitcoin.networkNodes.indexOf(newNodeUrl) === -1
    const notCurrentNodeUrl = newNodeUrl !== bitcoin.currentNodeUrl
    if (newNodeNotPresent && notCurrentNodeUrl) bitcoin.networkNodes.push(newNodeUrl)
    // broadcast and register to all networknodes of this node.
    const httpPromiseRequests = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const registerRequestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl },
            json: true
        }
        httpPromiseRequests.push(rp(registerRequestOptions))
    })
    Promise.all(httpPromiseRequests)
        .then((data) => {
            // bulk request back all the nodes that have register this new node. to sync
            const bulkRequsetOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl] },
                json: true
            }
            return rp(bulkRequsetOptions)
        })
        .then((data) => {
            res.json({ "status": "success", "msg": "New node registerd with network successfully." })
        })
})

app.post('/register-node', function (req, res) {
    const { newNodeUrl } = req.body;
    const newNodeNotPresent = bitcoin.networkNodes.indexOf(newNodeUrl) === -1
    const notCurrentNodeUrl = newNodeUrl !== bitcoin.currentNodeUrl
    if (newNodeNotPresent && notCurrentNodeUrl) bitcoin.networkNodes.push(newNodeUrl)
    res.json({ "status": "success", "msg": "New node registered successfully." })
})

app.post('/register-nodes-bulk', function (req, res) {
    const { allNetworkNodes } = req.body;
    allNetworkNodes.forEach(networkNodeUrl => {
        const newNodeNotPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) === -1
        const notCurrentNodeUrl = networkNodeUrl !== bitcoin.currentNodeUrl
        if (newNodeNotPresent && notCurrentNodeUrl) bitcoin.networkNodes.push(networkNodeUrl)
    })
    res.json({ "status": "success", "msg": "Bulk node registrations successful." })
})

app.post('/recieve-new-block', function (req, res) {
    const { newBlock } = req.body
    const lastBlock = bitcoin.getLastBlock()
    const correctHash = lastBlock.hash === newBlock.previousBlockHash
    const correctIndex = (lastBlock.index + 1) === newBlock.index
    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock)
        bitcoin.pendingTranscations = []
        res.json({ "status": "success", "msg": "New block recieved successfully.", "newBlock": newBlock })
    } else {
        res.json({ status: "failed", msg: "New block rejected", newBlock })
    }
})

// consensus (agreement / harmoney between all nodes) 
// ie. Synchronization of blocks to current blockchain by looking through all network nodes.
app.get('/consensus', function (req, res) {
    const requestPromises = []
    bitcoin.networkNodes.forEach(nodeUrl => {
        const requestOptions = {
            uri: nodeUrl + '/blockchain',
            method: 'GET',
            json: true
        }
        requestPromises.push(rp(requestOptions))
    })

    Promise.all(requestPromises)
        .then(blockchains => {
            const currentChainLength = bitcoin.chain.length
            let maxChainLength = currentChainLength
            let newLongestChain = null
            let pendingTranscations = []

            blockchains.forEach(blockchain => {
                if (blockchain.chain.length > maxChainLength) {
                    maxChainLength = blockchain.chain.length
                    newLongestChain = blockchain.chain
                    pendingTranscations = blockchain.pendingTranscations
                }
            })

            if (!newLongestChain || (newLongestChain && !(bitcoin.chainIsValid(newLongestChain)))) {
                res.json({ status: "success", msg: "Current chain has not been replaced.", chain: bitcoin.chain })
            } else {
                bitcoin.chain = newLongestChain
                bitcoin.pendingTranscations = pendingTranscations
                res.json({ status: "success", msg: "This chain has been replaced.", chain: bitcoin.chain })
            }
        })
})

app.get('/block/:blockHash', function (req, res) {
    const blockHash = req.params.blockHash
    const block = bitcoin.getBlock(blockHash)
    res.json({ status: "success", block })
})

app.get('/transcation/:transcationId', function (req, res) {
    const transcationId = req.params.transcationId
    const transcation = bitcoin.getTranscation(transcationId)
    res.json({ status: "success", ...transcation })
})

app.get('/address/:addressId', function (req, res) {


})

app.listen(port, function () {
    console.log('Listening in port ' + port)
})