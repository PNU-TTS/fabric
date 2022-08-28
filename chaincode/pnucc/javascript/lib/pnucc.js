/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

function printMethodEntry(functionName) { console.info('========= START: ' + functionName + ' =========') }
function printMethodExit(functionName) { console.info('========= FINISH: ' + functionName + ' E =========') }

function Transaction(
    id, target, price, quantity, 
    supplier, buyer, 
    registeredDate, executedDate) {
    this.id = id;
    
    this.target = target;
    this.price = price;
    this.quantity = quantity;

    this.supplier = supplier;
    this.buyer = buyer;

    this.registeredDate = registeredDate;
    this.executedDate = executedDate;
}

class PnuCC extends Contract {

    isDataValid(byteData) { return byteData && byteData.length != 0; }

    async initLedger(ctx) { 
        printMethodEntry('Initialize Ledger'); 
        this.NEXT_TRANSACTION_ID = 1;
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                this.NEXT_TRANSACTION_ID += 1;
            } catch (err) {
                console.log(err);
            }
        }

        printMethodEntry(`Registered Transactions Amount: ${this.NEXT_TRANSACTION_ID}`); 
    }

    // REC 매도 등록
    async createNewTransaction(ctx, target, price, quantity, supplier) {
        printMethodEntry('Create New Transaction');

        let transactionAsBytes = await ctx.stub.getState(id);

        if (this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} already exist`);
        }

        const currentDateTime = new Date();
        const transaction = new Transaction(
            id = this.NEXT_TRANSACTION_ID, 
            target = target, price = price, quantity = quantity,
            supplier = supplier, buyer = null,
            registeredDate = parseInt(currentDateTime.getTime() / 1000),
            executedDate = null
        );

        this.NEXT_TRANSACTION_ID += 1;

        console.log(`${id}, ${price}`);
        console.log(`${JSON.stringify(transaction)}`);
        
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(transaction)));

        printMethodExit('Create New Transaction ID');
    }

    async executeTransaction(ctx, id, buyer) {
        printMethodEntry(`Execute Transaction ID: ${id}`);

        let transactionAsBytes = await ctx.stub.getState(id);

        if (!this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} does not exist`);
        }
        
        const transaction = JSON.parse(transactionAsBytes);
        transaction.buyer = buyer;
        const currentDateTime = new Date();
        transaction.executedDate = parseInt(currentDateTime.getTime() / 1000);

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
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                allResults.push({ Transaction: transaction });
            } catch (err) {
                console.log(err);
            }
        }

        printMethodExit('Query All Transactions');
        return JSON.stringify(allResults);
    }

    async queryUnexecutedTransactions(ctx) {
        printMethodEntry('Query Unexecuted Transactions');
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                if (transaction.executedDate == null) {
                    allResults.push({ Transaction: transaction });
                }
            } catch (err) {
                console.log(err);
            }
        }

        printMethodExit('Query All Transactions');
        return JSON.stringify(allResults);
    }

    async queryExecutedTransactions(ctx) {
        printMethodEntry('Query Unexecuted Transactions');
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                if (transaction.executedDate != null) {
                    allResults.push({ Transaction: transaction });
                }
            } catch (err) {
                console.log(err);
            }
        }

        printMethodExit('Query All Transactions');
        return JSON.stringify(allResults);
    }
}

module.exports = PnuCC;
