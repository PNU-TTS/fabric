/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

function Transaction(id, target, price, quantity, supplier, buyer) {
    this.id = id;
    
    this.target = target;
    this.price = price;
    this.quantity = quantity;

    this.supplier = supplier;
    this.buyer = buyer;
}

function printMethodEntry(functionName) {
    console.info('========= START: ' + functionName + ' =========')
}

function printMethodExit(functionName) {
    console.info('========= FINISH: ' + functionName + ' E =========')
}

class PnuCC extends Contract {

    isDataValid(byteData) {
        return byteData && byteData.length != 0;
    }

    async initLedger(ctx) {
        console.info('============= Initialize Ledger ===========');
    }

    async createNewTransaction(ctx, id, target, price, quantity, supplier, buyer) {
        printMethodEntry(`Create New Transaction ID: ${id}`);

        let transactionAsBytes = await ctx.stub.getState(id);
        if (this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} already exist`);
        }

        const transaction = new Transaction(
            id = id,
            target = target,
            price = price,
            quantity = quantity,
            supplier = supplier,
            buyer = buyer
        );
        console.log(`${id}, ${price}`);
        console.log(`${JSON.stringify(transaction)}`);
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(transaction)));

        printMethodExit(`Create New Transaction ID: ${id}`);
    }

    async executeTransaction(ctx, id, buyer) {
        printMethodEntry(`Execute Transaction ID: ${id}`);

        let transactionAsBytes = await ctx.stub.getState(id);
        if (!this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} does not exist`);
        }
        
        const transaction = JSON.parse(transactionAsBytes);
        transaction.buyer = buyer;
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(transaction)));

        printMethodExit(`Execute Transaction ID: ${id}`);
    }

    async queryTransactionById(ctx, id) {
        printMethodEntry('Query Transaction By Id: ${id}');

        let transactionAsBytes = await ctx.stub.getState(id);
        if (!this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} does not exist`);
        }
        
        printMethodExit('Query Transaction By Id: ${id}');
        return transactionAsBytes.toString();
    }

    async queryAllTransactions(ctx) {
        printMethodEntry('Query All Transactions');

        const startKey = '';
        const endKey = '';
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }

        //allResults.push({ Key: "key", Record: "recordYJ" });
        printMethodExit('Query All Transactions');
        return JSON.stringify(allResults);
    }
}

module.exports = PnuCC;
