/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

function printMethodEntry(functionName) { console.info('========= START: ' + functionName + ' =========') }
function printMethodExit(functionName) { console.info('========= FINISH: ' + functionName + ' =========') }

function IDGenerator(name, id) { return `${name}_${id}` }

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

function Certificate(id, supplier, quantity, is_jeju, supply_date, expire_date) {
    this.id = id;
    this.supplier = supplier;
    this.quantity = quantity;
    this.is_jeju = is_jeju;
    this.supply_date = supply_date;
    this.expire_date = expire_date;
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

    /**
     * 인증서 등록
     * 
     * @param {공급자 ID} supplier 
     * @param {인증서 수량} quantity 
     * @param {제주도 발전 여부} is_jeju 
     * @param {공급 일자} supply_date 
     * @param {만료 일자} expire_date 
     */
    async registerCertificate(ctx, supplier, quantity, is_jeju, supply_date, expire_date) {
        printMethodEntry('Register New Certificate');

        const currentDateTime = new Date();
        const currentTimeInSeconds = parseInt(currentDateTime.getTime() / 1000);

        const id = IDGenerator("CERTIFICATE", currentTimeInSeconds);
        const certificate = new Certificate(
            id,
            supplier,
            quantity,
            is_jeju,
            supply_date,
            expire_date
        )

        console.log(`${JSON.stringify(certificate)}`);
        
        await ctx.stub.putState(`${id}`, Buffer.from(JSON.stringify(certificate)));

        printMethodExit('Register New Certificate');
    }

    /**
     * 등록된 인증서 조회
     * 
     * @param {공급자 ID} supplier 
     */
     async queryCertificates(ctx, supplier) {
        printMethodEntry('Query REC');
        const allResults = [];
        
        for await (const {key, value} of ctx.stub.getStateByRange('', '')) {
            const strValue = Buffer.from(value).toString('utf8');
            let transaction;
            try {
                transaction = JSON.parse(strValue);
                if ( transaction.id.startsWith("CERTIFICATE") && transaction.supplier == supplier ) {
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
     * 인증서 판매 등록
     * 
     * @param {인증서 ID} target 
     * @param {인증서 개당 가격} price 
     * @param {인증서 판매 수량} quantity 
     * @param {공급자 ID} supplier 
     */
    async createNewTransaction(ctx, target, price, quantity, supplier) {
        printMethodEntry('Create New Transaction');

        let certificateAsBytes = await ctx.stub.getState(target);
        if (!this.isDataValid(certificateAsBytes)) { throw new Error(`${target} does not exist`); }
        const certificate = JSON.parse(certificateAsBytes);
        if (certificate.quantity < quantity) { throw new Error(`${target}'s quantity is not enough!`); }

        const currentDateTime = new Date();
        const currentTimeInSeconds = parseInt(currentDateTime.getTime() / 1000);
        
        const id = IDGenerator("TRANSACTION", this.NEXT_TRANSACTION_ID);
        
        const transaction = new Transaction(
            id,
            target, price, quantity,
            supplier, null,
            currentTimeInSeconds,
            null
        );

        console.log(`${JSON.stringify(transaction)}`);
        
        await ctx.stub.putState(transaction.id, Buffer.from(JSON.stringify(transaction)));
        
        certificate.quantity -= quantity;
        await ctx.stub.putState(certificate.id, Buffer.from(JSON.stringify(certificate)));

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
        printMethodEntry(`Query Transaction By Id: ${id}`);

        let transactionAsBytes = await ctx.stub.getState(id);
        if (!this.isDataValid(transactionAsBytes)) {
            throw new Error(`Certificate with ${id} does not exist`);
        }
        
        printMethodExit(`Query Transaction By Id: ${id}`);
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
                if ( transaction.id.startsWith("TRANSACTION") ) {
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
                if ( transaction.id.startsWith("TRANSACTION") && transaction.executedDate == null ) {
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
                if ( transaction.id.startsWith("TRANSACTION") && transaction.executedDate != null ) {
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
                if ( transaction.id.startsWith("TRANSACTION") && transaction.supplier == supplier) {
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
                if ( transaction.id.startsWith("TRANSACTION") && transaction.buyer == buyer) {
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