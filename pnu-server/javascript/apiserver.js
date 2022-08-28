var express = require('express');
var bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');

var app = express();
app.use(bodyParser.json());

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'pnu-network', 'organizations', 'peerOrganizations', 'rec-client-peer-org.pnu.com', 'connection-rec-client-peer-org.json');
function printSystemLog(functionName) { console.info('========= ' + functionName + ' =========') }

/**
 * REC 거래 ID 값을 기반으로 조회하는 API
 */
app.get('/query/transaction/:transactionId', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get('appUser');
        if (!identity) {
            res.status(401).json({error: 'An identity for the user "appUser" does not exist in the wallet'});
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        const result = await contract.evaluateTransaction('queryTransactionById', req.params.transactionId);
        res.status(200).json({response: result.toString()});
    } catch (error) {
        res.status(500).json({error: error});
    }
});

/**
 * 모든 거래 내역을 조회하는 API
 */
 app.get('/query/allTransactions/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get('appUser');
        if (!identity) {
            res.status(401).json({error: 'Run the registerUser.js application before retrying'});
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        const result = await contract.evaluateTransaction('queryAllTransactions');

        res.status(200).json({response: result.toString()});
    } catch (error) {
        res.status(500).json({error: error});
    }
});

/**
 * 미체결된 거래 내역을 조회하는 API
 */
 app.get('/queryUnexecutedTransactions/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get('appUser');
        if (!identity) {
            res.status(401).json({error: 'An identity for the user "appUser" does not exist in the wallet'});
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        const result = await contract.evaluateTransaction('queryUnexecutedTransactions');
        res.status(200).json({response: result.toString()});
    } catch (error) {
        res.status(500).json({error: error});
    }
});

/**
 * 체결된 거래 내역을 조회하는 API
 */
 app.get('/query/executedTransactions/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get('appUser');
        if (!identity) {
            res.status(401).json({error: 'An identity for the user "appUser" does not exist in the wallet'});
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        const result = await contract.evaluateTransaction('queryExecutedTransactions');
        res.status(200).json({response: result.toString()});
    } catch (error) {
        res.status(500).json({error: error});
    }
});

/**
 * REC 매도 등록 API
 * 
 * @method  POST
 * 
 * @param target    Django에 등록된 REC ID 값
 * @param price     REC 개당 가격
 * @param quantity  REC 개수
 * @param supplier  REC 공급자
 */
app.post('/create/transaction/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get(req.body.userID);
        if (!identity) {
            res.status(401).json({error: `An identity for the user "${req.body.userID}" does not exist in the wallet`});
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));        
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: req.body.userID, discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        await contract.submitTransaction('createNewTransaction', 
            req.body.target,
            req.body.price,
            req.body.quantity,
            req.body.supplier,
        )

        res.status(200).json({response: "Successfully created transaction"});
        await gateway.disconnect();
        
    } catch (error) {
        res.status(500).json({error: error});
    }
});

/**
 * REC 매수 API
 * 
 * @method  POST
 * 
 * @param id        Transaction ID
 * @param buyer     구매자 ID
 */
 app.post('/executeTransaction/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get(req.body.userID);
        if (!identity) {
            res.status(401).json({error: `An identity for the user "${req.body.userID}" does not exist in the wallet`});
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));        
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: req.body.userID, discovery: { enabled: true, asLocalhost: true } });

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        await contract.submitTransaction('executeTransaction', 
            req.body.id,
            req.body.buyer
        )

        res.status(200).json({response: "Successfully executed transaction"});
        await gateway.disconnect();
        
    } catch (error) {
        res.status(500).json({error: error});
    }
});

/**
 * 사용자 등록 API
 * 
 * @param departmentName    buyer 또는 supplier   
 * @param enrollmentID      등록할 사용자 ID
 */
app.post('/register/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get(req.body.enrollmentID);
        if (identity) {
            res.status(406).json({error: `"${req.body.enrollmentID}" already exist in the wallet`});
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const caURL = ccp.certificateAuthorities['ca.rec-client-peer-org.pnu.com'].url;
        const ca = new FabricCAServices(caURL);

        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            res.status(400).json({error: 'An identity for the admin user "admin" does not exist in the wallet'});
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        const secret = await ca.register({
            affiliation: `rec-client-peer-org.${req.body.departmentName}`,
            enrollmentID: req.body.enrollmentID,
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: req.body.enrollmentID,
            enrollmentSecret: secret
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'RecClientPeerOrgMSP',
            type: 'X.509',
        };

        await wallet.put(req.body.enrollmentID, x509Identity);
        res.status(200).json({response: `Successfully register "${req.body.enrollmentID}" and imported it into the wallet`});

    } catch (error) {
        res.status(500).json({error: error});
    }
});


app.listen(8080);