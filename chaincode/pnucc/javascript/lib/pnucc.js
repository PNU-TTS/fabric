/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

function printMethodEntry(functionName) { console.info('========= START: ' + functionName + ' =========') }
function printMethodExit(functionName) { console.info('========= FINISH: ' + functionName + ' =========') }

function Transaction(id, target, price, quantity, supplier, buyer, registeredDate, executedDate) {
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
    }

    // REC 매도 등록
    async createNewTransaction(ctx, target, price, quantity, supplier) {
        printMethodEntry('Create New Transaction');

        const currentDateTime = new Date();
        const currentTimeInSeconds = parseInt(currentDateTime.getTime() / 1000);

        const transaction = new Transaction(
            this.NEXT_TRANSACTION_ID,
            target, price, quantity,
            supplier, null,
            currentTimeInSeconds,
            null
        );

        console.log(`${JSON.stringify(transaction)}`);
        
        await ctx.stub.putState(`${this.NEXT_TRANSACTION_ID}`, Buffer.from(JSON.stringify(transaction)));

        this.NEXT_TRANSACTION_ID += 1;
        printMethodExit('Create New Transaction ID');
    }

    /**
     * 인증서 구매
     * 
     * @param {거래 내역 ID} id 
     * @param {구매자 ID} buyer 
     */
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

    /**
     * ID 값으로 거래 내역 조회 
     * 
     * @param {거래 내역 ID} id 
     */
    async queryTransactionById(ctx, id) {
        printMethodEntry('Query Transaction By Id: ${id}');

        let transactionAsBytes = await ctx.stub.getState(id);
        if (!this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} does not exist`);
        }
        
        printMethodExit('Query Transaction By Id: ${id}');
        return transactionAsBytes.toString();
    }

    /**
     * 모든 거래 내역 조회
     * 
     */
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

    /**
     * 구매가 완료되지 않은 모든 거래 내역 조회
     * 
     */
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

    /**
     * 구매가 완료된 모든 거래 내역 조회
     * 
     */
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

    /**
     * 공급자 ID로 거래 내역 조회
     * 
     * @param {공급자 ID} supplier 
     */
    async queryTransactionBySupplier(ctx, supplier) {
        printMethodEntry('Query Transactions By Supplier');
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                if (transaction.supplier == supplier) {
                    allResults.push({ Transaction: transaction });
                }
            } catch (err) {
                console.log(err);
            }
        }

        printMethodExit('Query Transactions By Supplier');
        return JSON.stringify(allResults);
    }

    /**
     * 구매자 ID 값으로 거래 내역 조회
     * 
     * @param {구매자 ID} buyer  
     */
    async queryTransactionByBuyer(ctx, buyer) {
        printMethodEntry('Query Transactions By Buyer');
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                if (transaction.buyer == buyer) {
                    allResults.push({ Transaction: transaction });
                }
            } catch (err) {
                console.log(err);
            }
        }

        printMethodExit('Query Transactions By Buyer');
        return JSON.stringify(allResults);
    }
}

module.exports = PnuCC;
