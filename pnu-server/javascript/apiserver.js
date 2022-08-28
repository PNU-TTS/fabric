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

function printSystemLog(functionName) {
    console.info('========= ' + functionName + ' =========')
}

// curl http://localhost:8080/query/allTransactions/
app.get('/query/allTransactions/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
        printSystemLog('Connect Success');

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        const result = await contract.evaluateTransaction('queryAllTransactions');
        printSystemLog('API Success');

        res.status(200).json({response: result.toString()});
    } catch (error) {
        res.status(500).json({error: error});
    }
});

// curl /query/transaction/2
app.get('/query/transaction/:transactionId', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
        printSystemLog('Connect Success');

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        const result = await contract.evaluateTransaction('queryTransactionById', req.params.transactionId);
        printSystemLog('API Success');
        res.status(200).json({response: result.toString()});
    } catch (error) {
        res.status(500).json({error: error});
    }
});

// curl -d '{"userID": "cyj", "txID": "1", "target": "target", "price": 50000, "quantity": 300, "supplier": "supp", "buyer": "cyj"}' -H "Content-Type: application/json" -X POST http://localhost:8080/create/transaction/
app.post('/create/transaction/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get(req.body.userID);
        if (!identity) {
            console.log(`An identity for the user "${req.body.userID}" does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: req.body.userID, discovery: { enabled: true, asLocalhost: true } });
        printSystemLog('Connect Success');

        const network = await gateway.getNetwork('rec-trade-channel');
        const contract = network.getContract('pnucc');

        await contract.submitTransaction('createNewTransaction', 
            req.body.txID,
            req.body.target,
            req.body.price,
            req.body.quantity,
            req.body.supplier,
            req.body.buyer
        )
        printSystemLog('API Success');
        res.status(200).json({response: "Successfully created transaction"});
        await gateway.disconnect();
    } catch (error) {
        res.status(500).json({error: error});
    }
});


// curl -d '{"enrollmentID": "cyj", "departmentName": "buyer"}' -H "Content-Type: application/json" -X POST http://localhost:8080/register/
app.post('/register/', async function (req, res) {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        console.log(`CCP path: ${ccpPath}`);

        const identity = await wallet.get(req.body.enrollmentID);
        if (identity) {
            console.log(`An identity for the user "${req.body.enrollmentID}" already exist in the wallet`);
            return;
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.rec-client-peer-org.pnu.com'].url;
        const ca = new FabricCAServices(caURL);

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
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
        
        printSystemLog('API Success');
        res.status(200).json({response: `Successfully register "${req.body.enrollmentID}" and imported it into the wallet`});
    } catch (error) {
        res.status(500).json({error: error});
    }
});


app.listen(8080);