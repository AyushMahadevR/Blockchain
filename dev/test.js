const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();



const t1 = bitcoin.createNewTranscation(25000, 'Amazon', 'Dexter Morgan');
const t2 = bitcoin.createNewTranscation(25000, 'Amazon', 'Dr. House');

bitcoin.addTranscationToPendingTranscations(t1);
bitcoin.addTranscationToPendingTranscations(t2);
bitcoin.createNewBlock(2332, '234fksdjfhsajdflkj', '3dsfdafsfasfasdffs');


// const transcations = [{ amount: 200, sender: 'Tesla', recipient: 'ayush' }];

// console.log(bitcoin.proofOfWork('chain', transcations));

// console.log(bitcoin.hashBlock('chain', transcations, 56878));

console.log(bitcoin.getAddressData('Tesla123'));



















// valid block test
// const b1 = {
//     "chain": [
//         {
//             "index": 1,
//             "timestamp": 1611472250421,
//             "nonce": 777,
//             "previousBlockHash": "block",
//             "hash": "chain",
//             "transcations": []
//         },
//         {
//             "index": 2,
//             "timestamp": 1611472336604,
//             "nonce": 30305,
//             "previousBlockHash": "chain",
//             "hash": "00005ff45fcca832637584d6e642461c9bb357e34ce703f1e9bb3d782b2da22f",
//             "transcations": [
//                 {
//                     "amount": 11990,
//                     "sender": "Ayush Mahadev.R",
//                     "recipient": "Philips monitor technologies limited.",
//                     "transcationId": "87b107e757e3401a9f3e173f7b6f65a2"
//                 }
//             ]
//         },
//         {
//             "index": 3,
//             "timestamp": 1611472396027,
//             "nonce": 78652,
//             "previousBlockHash": "00005ff45fcca832637584d6e642461c9bb357e34ce703f1e9bb3d782b2da22f",
//             "hash": "0000e3fb112050301cc3f8b9ff26099e0b485077323d93aa27401dad0da05c0f",
//             "transcations": [
//                 {
//                     "amount": 12.5,
//                     "sender": "00",
//                     "recipient": "982e3b3a1c114a909519e8c572cc8505",
//                     "transcationId": "6911acf871ee41c6b88c105b138bc08e"
//                 },
//                 {
//                     "amount": 287,
//                     "sender": "Ayush Mahadev.R",
//                     "recipient": "Logitech Mouse M90",
//                     "transcationId": "459c9887c599498da7d437052f5a5711"
//                 }
//             ]
//         }
//     ],
//     "pendingTranscations": [
//         {
//             "amount": 12.5,
//             "sender": "00",
//             "recipient": "982e3b3a1c114a909519e8c572cc8505",
//             "transcationId": "8b2b9564171643c58f437da99f4ac55c"
//         }
//     ],
//     "currentNodeUrl": "http://localhost:3001",
//     "networkNodes": []
// };

// console.log(bitcoin.chainIsValid(b1));