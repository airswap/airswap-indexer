import { AddressZero } from '@ethersproject/constants';
import { FullOrder, FullOrderERC20 } from '@airswap/types';
import { forgeDbOrderERC20, forgeDbOrderMarketPlace, forgeFullOrderMarketPlace, forgeIndexedOrderERC20, forgeIndexedOrderMarketPlace, forgeIndexedOrderResponseERC20, forgeIndexedOrderResponseMarketPlace } from '../../Fixtures';
import { IndexedOrder } from '../../model/IndexedOrder';
import { AceBaseClient } from "../AcebaseClient";
import { Database } from '../Database';
import { InMemoryDatabase } from '../InMemoryDatabase';
import { DbOrderERC20, DbOrderMarketPlace } from '../../model/DbOrderTypes';
import { IndexedOrder as IndexedOrderResponse, SortField, SortOrder } from '@airswap/types';

describe("Database implementations", () => {
    let inMemoryDatabase: InMemoryDatabase;
    let acebaseClient: AceBaseClient;
    const addedOn = new Date().getTime();
    const expiryDate = new Date().getTime() + 10;

    beforeAll(async () => {
        inMemoryDatabase = new InMemoryDatabase();
        acebaseClient = new AceBaseClient();
        await acebaseClient.connect("dbtest", true);
        await inMemoryDatabase.connect("dbtest", true);
    });

    beforeEach(async () => {
        await inMemoryDatabase.erase();
        await acebaseClient.erase();
    });

    afterAll(async () => {
        await inMemoryDatabase.close();
        await acebaseClient.close();
    });

    describe('get IndexedOrder by Request Filters', () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await getOrderERC20By(inMemoryDatabase); });
            test("acebaseDb", async () => { await getOrderERC20By(acebaseClient); });
        })
        describe('erc20', () => {
            test("inMemoryDb", async () => { await getOrderMarketPlaceBy(inMemoryDatabase); });
            test("acebaseDb", async () => { await getOrderMarketPlaceBy(acebaseClient); });
        })
    });

    describe("Should add & get IndexedOrder", () => {
        describe('erc20', () => {

            test("inMemoryDb", async () => { await getAndAddOtcOrder(inMemoryDatabase); });
            test("acebaseDb", async () => { await getAndAddOtcOrder(acebaseClient); });
        })
        describe("markeplace", () => {
            test("inMemoryDb", async () => { await getAndAddOrderMarketPlace(inMemoryDatabase); });
            test("acebaseDb", async () => { await getAndAddOrderMarketPlace(acebaseClient); });
        })
    });

    describe("Should set filters when adding IndexedOrder", () => {
        test("inMemoryDb", async () => { await shouldAddfiltersOnOtcAdd(inMemoryDatabase); });
        test("acebaseDb", async () => { await shouldAddfiltersOnOtcAdd(acebaseClient); });
    });

    describe("Should add all & get orders", () => {
        test("inMemoryDb", async () => { await addAllAndGetOrders(inMemoryDatabase); });
        test("acebaseDb", async () => { await addAllAndGetOrders(acebaseClient); });
    });

    describe("Should delete IndexedOrder", () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await shouldDeleteOtcOrder(inMemoryDatabase); });
            test("acebaseDb", async () => { await shouldDeleteOtcOrder(acebaseClient); });
        })
        describe('marketplace', () => {
            test("inMemoryDb", async () => { await shouldDeleteOrderMarketPlace(inMemoryDatabase); });
            test("acebaseDb", async () => { await shouldDeleteOrderMarketPlace(acebaseClient); });
        })
    });

    describe("Should delete expired IndexedOrder", () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await shouldDeleteExpiredOtcOrder(inMemoryDatabase); });
            test("acebaseDb", async () => { await shouldDeleteExpiredOtcOrder(acebaseClient); });
        })

        describe('marketplace', () => {
            test("inMemoryDb", async () => { await shouldDeleteExpiredMarketPlaceOrder(inMemoryDatabase); });
            test("acebaseDb", async () => { await shouldDeleteExpiredMarketPlaceOrder(acebaseClient); });
        })
    });

    describe("Should return true if IndexedOrder erc20 exists", () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await ERC20OrderExists(inMemoryDatabase); });
            test("acebaseDb", async () => { await ERC20OrderExists(acebaseClient); });
        })

        describe('marketplace', () => {
            test("inMemoryDb", async () => { await marketPlaceOrderExists(inMemoryDatabase); });
            test("acebaseDb", async () => { await marketPlaceOrderExists(acebaseClient); });
        })
    });

    describe("Should return false if IndexedOrder does not exist", () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await ERC20OrderDoesNotExist(inMemoryDatabase); });
            test("acebaseDb", async () => { await ERC20OrderDoesNotExist(acebaseClient); });
        })

        describe('marketplace', () => {
            test("inMemoryDb", async () => { await marketPlaceOrderDoesNotExist(inMemoryDatabase); });
            test("acebaseDb", async () => { await marketPlaceOrderDoesNotExist(acebaseClient); });
        })
    });

    describe("Should return IndexedOrder", () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await addERC20Order(inMemoryDatabase); });
            test("acebaseDb", async () => { await addERC20Order(acebaseClient); });
        })
        describe('marketPlace', () => {
            test("inMemoryDb", async () => { await addMarketPlaceOrder(inMemoryDatabase); });
            test("acebaseDb", async () => { await addMarketPlaceOrder(acebaseClient); });
        })
    });


    describe("Should not return IndexedOrder", () => {
        describe('erc20', () => {
            test("inMemoryDb", async () => { await renturnsNullOnUnknownHashERC20(inMemoryDatabase); });
            test("acebaseDb", async () => { await renturnsNullOnUnknownHashERC20(acebaseClient); });
        })
        describe('marketplace', () => {
            test("inMemoryDb", async () => { await renturnsNullOnUnknownHashMarketPlace(inMemoryDatabase); });
            test("acebaseDb", async () => { await renturnsNullOnUnknownHashMarketPlace(acebaseClient); });
        })
    });

    describe("sha 256 does not change", () => {
        test("inMemoryDb", async () => { await hashObject(inMemoryDatabase); });
        test("acebaseDb", async () => { await hashObject(acebaseClient); });
    });

    async function getOrderERC20By(db: Database) {
        const dbOrder1: DbOrderERC20 = {
            nonce: "nonce",
            expiry: 1653138423537,
            signerWallet: "signerWallet",
            signerToken: "signerToken",
            signerAmount: "2",
            approximatedSignerAmount: BigInt(2),
            senderToken: "senderToken",
            senderAmount: "1",
            approximatedSenderAmount: BigInt(1),
            v: "v",
            r: "r",
            s: "s",
            chainId: 5,
            swapContract: AddressZero,
            protocolFee: "4",
            senderWallet: AddressZero,
        };
        const order1: FullOrderERC20 = {
            nonce: "nonce",
            expiry: "1653138423537",
            signerWallet: "signerWallet",
            signerToken: "signerToken",
            signerAmount: "2",
            senderToken: "senderToken",
            senderAmount: "1",
            v: "v",
            r: "r",
            s: "s",
            protocolFee: "4",
            senderWallet: AddressZero,
            chainId: 5,
            swapContract: AddressZero
        };
        const dbOrder2: DbOrderERC20 = {
            nonce: "nonce",
            expiry: 1653138423537,
            signerWallet: "signerWallet",
            signerToken: "blip",
            signerAmount: "20",
            approximatedSignerAmount: BigInt(20),
            senderToken: "another",
            senderAmount: "10",
            approximatedSenderAmount: BigInt(10),
            v: "v",
            r: "r",
            s: "s",
            chainId: 5,
            swapContract: AddressZero,
            protocolFee: "4",
            senderWallet: AddressZero,
        };
        const order2: FullOrderERC20 = {
            nonce: "nonce",
            expiry: "1653138423537",
            signerWallet: "signerWallet",
            signerToken: "blip",
            signerAmount: "20",
            senderToken: "another",
            senderAmount: "10",
            v: "v",
            r: "r",
            s: "s",
            protocolFee: "4",
            senderWallet: AddressZero,
            chainId: 5,
            swapContract: AddressZero
        };
        const dbOrder3: DbOrderERC20 = {
            nonce: "nonce",
            expiry: 1653138423537,
            signerWallet: "signerWallet",
            signerToken: "signerToken",
            signerAmount: "3",
            approximatedSignerAmount: BigInt(3),
            senderToken: "senderToken",
            senderAmount: "100",
            approximatedSenderAmount: BigInt(100),
            v: "v",
            r: "r",
            s: "s",
            chainId: 5,
            swapContract: AddressZero,
            protocolFee: "4",
            senderWallet: AddressZero,
        };
        const order3: FullOrderERC20 = {
            nonce: "nonce",
            expiry: "1653138423537",
            signerWallet: "signerWallet",
            signerToken: "signerToken",
            signerAmount: "3",
            senderToken: "senderToken",
            senderAmount: "100",
            v: "v",
            r: "r",
            s: "s",
            protocolFee: "4",
            senderWallet: AddressZero,
            chainId: 5,
            swapContract: AddressZero
        };

        const otcOrder1 = new IndexedOrder(dbOrder1, 1653138423537, "id1");
        const expectedOtcOrder1: IndexedOrderResponse<FullOrderERC20> = { order: order1, addedOn: 1653138423537, hash: "id1" };
        const otcOrder2 = new IndexedOrder(dbOrder2, 1653138423527, "id2");
        const expectedOtcOrder2: IndexedOrderResponse<FullOrderERC20> = { order: order2, addedOn: 1653138423527, hash: "id2" };
        const otcOrder3 = new IndexedOrder(dbOrder3, 1653138423517, "id3");
        const expectedOtcOrder3: IndexedOrderResponse<FullOrderERC20> = { order: order3, addedOn: 1653138423517, hash: "id3" };
        await db.addOrderERC20(otcOrder1);
        await db.addOrderERC20(otcOrder2);
        await db.addOrderERC20(otcOrder3);

        const ordersFromToken = await db.getOrderERC20By({ page: 1, signerTokens: ["signerToken"] });
        expect(ordersFromToken).toEqual({
            orders: { "id1": expectedOtcOrder1, "id3": expectedOtcOrder3 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 2
        });

        const anotherToken = await db.getOrderERC20By({ page: 1, senderTokens: ["another"] });
        expect(anotherToken).toEqual({
            orders: { "id2": expectedOtcOrder2 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });

        const minSignerAmountFromToken = await db.getOrderERC20By({ page: 1, minSignerAmount: BigInt(15) });
        expect(minSignerAmountFromToken).toEqual({
            orders: { "id2": expectedOtcOrder2 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });

        const maxSignerAmountFromToken = await db.getOrderERC20By({ page: 1, maxSignerAmount: BigInt(5) });
        expect(maxSignerAmountFromToken).toEqual({
            orders: { "id1": expectedOtcOrder1, "id3": expectedOtcOrder3 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 2
        });

        const minSenderAmount = await db.getOrderERC20By({ page: 1, minSenderAmount: BigInt(20) });
        expect(minSenderAmount).toEqual({
            orders: { "id3": expectedOtcOrder3 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });

        const maxSenderAmount = await db.getOrderERC20By({ page: 1, maxSenderAmount: BigInt(15) });
        expect(maxSenderAmount).toEqual({
            orders: { "id1": expectedOtcOrder1, "id2": expectedOtcOrder2 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 2
        });

        const senderAmountAsc = await db.getOrderERC20By({ page: 1, sortField: SortField.SENDER_AMOUNT, sortOrder: SortOrder.ASC });
        expect(Object.keys(senderAmountAsc.orders)).toEqual(["id1", "id2", "id3"]);

        const senderAmountDesc = await db.getOrderERC20By({ page: 1, sortField: SortField.SENDER_AMOUNT, sortOrder: SortOrder.DESC, senderTokens: ["senderToken"] });
        expect(Object.keys(senderAmountDesc.orders)).toEqual(["id3", "id1"]);

        const signerAmountAsc = await db.getOrderERC20By({ page: 1, sortField: SortField.SIGNER_AMOUNT, sortOrder: SortOrder.ASC });
        expect(Object.keys(signerAmountAsc.orders)).toEqual(["id1", "id3", "id2"]);

        const signerAmountDesc = await db.getOrderERC20By({ page: 1, sortField: SortField.SIGNER_AMOUNT, sortOrder: SortOrder.DESC, signerTokens: ["signerToken"] });
        expect(Object.keys(signerAmountDesc.orders)).toEqual(["id3", "id1"]);

        const minSignerAmountDesc = await db.getOrderERC20By({ page: 1, sortField: SortField.SIGNER_AMOUNT, sortOrder: SortOrder.DESC });
        expect(Object.keys(minSignerAmountDesc.orders)).toEqual(["id2", "id3", "id1"]);

        const maxAddedOn = await db.getOrderERC20By({ page: 1, maxAddedDate: 1653138423527 });
        expect(maxAddedOn).toEqual({
            orders: { "id1": expectedOtcOrder1, "id2": expectedOtcOrder2 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 2
        });

        const specificOne = await db.getOrderERC20By({
            page: 1,
            signerTokens: ["signerToken"],
            senderTokens: ["senderToken"],
            minSignerAmount: BigInt(0),
            maxSignerAmount: BigInt(5),
            minSenderAmount: BigInt(1),
            maxSenderAmount: BigInt(3),
        });
        expect(specificOne).toEqual({
            orders: { "id1": expectedOtcOrder1, },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });

        return Promise.resolve();
    }

    async function getOrderMarketPlaceBy(db: Database) {
        const dbOrder1: DbOrderMarketPlace = forgeDbOrderMarketPlace(5);
        dbOrder1.signer.wallet = "aWalletAddress"
        dbOrder1.sender.wallet = "aWalletAddress"
        dbOrder1.sender.amount = "1"
        dbOrder1.sender.approximatedAmount = BigInt(1)
        dbOrder1.signer.amount = "1"
        dbOrder1.signer.approximatedAmount = BigInt(1)
        const order1: FullOrder = forgeFullOrderMarketPlace(5);
        order1.signer.wallet = "aWalletAddress"
        order1.sender.wallet = "aWalletAddress"
        order1.sender.amount = "1"
        order1.signer.amount = "1"

        const dbOrder2: DbOrderMarketPlace = forgeDbOrderMarketPlace(1);
        dbOrder2.sender.wallet = "anotherWalletAddress"
        dbOrder2.sender.amount = "2"
        dbOrder2.sender.approximatedAmount = BigInt(2)
        dbOrder2.signer.amount = "3"
        dbOrder2.signer.approximatedAmount = BigInt(3)
        const order2: FullOrder = forgeFullOrderMarketPlace(1);
        order2.sender.wallet = "anotherWalletAddress"
        order2.sender.amount = "2"
        order2.signer.amount = "3"

        const dbOrder3: DbOrderMarketPlace = forgeDbOrderMarketPlace(3);
        dbOrder3.signer.wallet = "aWalletAddress"
        dbOrder3.sender.amount = "3"
        dbOrder3.sender.approximatedAmount = BigInt(3)
        dbOrder3.signer.amount = "2"
        dbOrder3.signer.approximatedAmount = BigInt(2)
        const order3: FullOrder = forgeFullOrderMarketPlace(3);
        order3.signer.wallet = "aWalletAddress"
        order3.sender.amount = "3"
        order3.signer.amount = "2"

        const indexedOrder1 = new IndexedOrder(dbOrder1, 1653138423537, "id1");
        const expectedOtcOrder1: IndexedOrderResponse<FullOrder> = { order: order1, addedOn: 1653138423537, hash: "id1" };
        const indexedOrder2 = new IndexedOrder(dbOrder2, 1653138423527, "id2");
        const expectedOtcOrder2: IndexedOrderResponse<FullOrder> = { order: order2, addedOn: 1653138423527, hash: "id2" };
        const indexedOrder3 = new IndexedOrder(dbOrder3, 1653138423517, "id3");
        const expectedOtcOrder3: IndexedOrderResponse<FullOrder> = { order: order3, addedOn: 1653138423517, hash: "id3" };
        await db.addOrderMarketPlace(indexedOrder1);
        await db.addOrderMarketPlace(indexedOrder2);
        await db.addOrderMarketPlace(indexedOrder3);

        const ordersFromSignerAddress = await db.getOrderMarketPlaceBy({ page: 1, signerAddress: "aWalletAddress" });
        expect(ordersFromSignerAddress).toEqual({
            orders: { "id1": expectedOtcOrder1, "id3": expectedOtcOrder3 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 2
        });

        const ordersFromOtherSenderAddress = await db.getOrderMarketPlaceBy({ page: 1, senderAddress: "anotherWalletAddress" });
        expect(ordersFromOtherSenderAddress).toEqual({
            orders: { "id2": expectedOtcOrder2 },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });

        const senderAmountAsc = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.SENDER_AMOUNT, sortOrder: SortOrder.ASC });
        expect(Object.keys(senderAmountAsc.orders)).toEqual(["id1", "id2", "id3"]);

        const senderAmountDesc = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.SENDER_AMOUNT, sortOrder: SortOrder.DESC, signerAddress: "aWalletAddress" });
        expect(Object.keys(senderAmountDesc.orders)).toEqual(["id3", "id1"]);

        const signerAmountAsc = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.SIGNER_AMOUNT, sortOrder: SortOrder.ASC });
        expect(Object.keys(signerAmountAsc.orders)).toEqual(["id1", "id3", "id2"]);

        const signerAmountDesc = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.SIGNER_AMOUNT, sortOrder: SortOrder.DESC, signerAddress: "aWalletAddress" });
        expect(Object.keys(signerAmountDesc.orders)).toEqual(["id3", "id1"]);

        const minSignerAmountDesc = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.SIGNER_AMOUNT, sortOrder: SortOrder.DESC });
        expect(Object.keys(minSignerAmountDesc.orders)).toEqual(["id2", "id3", "id1"]);

        const orderByExpiryASC = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.EXPIRY, sortOrder: SortOrder.ASC });
        expect(Object.keys(orderByExpiryASC.orders)).toEqual(["id2", "id3", "id1"]);
        const orderByExpiryDESC = await db.getOrderMarketPlaceBy({ page: 1, sortField: SortField.EXPIRY, sortOrder: SortOrder.DESC });
        expect(Object.keys(orderByExpiryDESC.orders)).toEqual(["id1", "id3", "id2"]);

        const specificOne = await db.getOrderMarketPlaceBy({
            page: 1,
            signerAddress: "aWalletAddress",
            senderAddress: "aWalletAddress",
        });
        expect(specificOne).toEqual({
            orders: { "id1": expectedOtcOrder1, },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });

        return Promise.resolve();
    }

    async function getAndAddOtcOrder(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        const expectedIndexedOrder = forgeIndexedOrderResponseERC20(addedOn, expiryDate);

        await db.addOrderERC20(indexedOrder);
        const orders = await db.getOrdersERC20();

        expect(orders).toEqual({
            orders: { hash: expectedIndexedOrder, },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });
        return Promise.resolve();
    }

    async function getAndAddOrderMarketPlace(db: Database) {
        const indexedOrder = forgeIndexedOrderMarketPlace(addedOn, expiryDate);
        const expectedIndexedOrder = forgeIndexedOrderResponseMarketPlace(addedOn, expiryDate);

        await db.addOrderMarketPlace(indexedOrder);
        const orders = await db.getOrdersMarketPlace();

        expect(orders).toEqual({
            orders: { hash: expectedIndexedOrder, },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });
        return Promise.resolve();
    }

    async function addAllAndGetOrders(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        const anotherOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        const expectedIndexedOrder = forgeIndexedOrderResponseERC20(addedOn, expiryDate);
        const expectedAnotherOrder = forgeIndexedOrderResponseERC20(addedOn, expiryDate);
        anotherOrder.hash = "another_hash";
        expectedAnotherOrder.hash = "another_hash";

        await db.addAllOrderERC20({ "hash": indexedOrder, "another_hash": anotherOrder });
        const orders = await db.getOrdersERC20();

        expect(orders).toEqual({
            orders: { hash: expectedIndexedOrder, "another_hash": expectedAnotherOrder },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 2
        });
        return Promise.resolve();
    }

    async function shouldAddfiltersOnOtcAdd(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        const anotherOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        anotherOrder.hash = "another_hash";
        (anotherOrder.order as DbOrderERC20).senderAmount = "15";
        (anotherOrder.order as DbOrderERC20).approximatedSenderAmount = BigInt(15);
        (anotherOrder.order as DbOrderERC20).signerAmount = "50";
        (anotherOrder.order as DbOrderERC20).approximatedSignerAmount = BigInt(50);

        await db.addAllOrderERC20({ "hash": indexedOrder, "another_hash": anotherOrder });
        const filters = await db.getFiltersERC20();

        expect(filters).toEqual({
            senderToken: { "0x0000000000000000000000000000000000000000": { max: BigInt(15), min: BigInt(10) } },
            signerToken: { "0x0000000000000000000000000000000000000000": { max: BigInt(50), min: BigInt(5) } }
        });
        return Promise.resolve();
    }

    async function shouldDeleteOtcOrder(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        await db.addOrderERC20(indexedOrder);

        await db.deleteOrderERC20("nonce", AddressZero);
        const orders = await db.getOrdersERC20();

        expect(orders).toEqual({
            orders: {},
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 0
        });
        return Promise.resolve();
    }

    async function shouldDeleteOrderMarketPlace(db: Database) {
        const indexedOrder: IndexedOrder<DbOrderMarketPlace> = forgeIndexedOrderMarketPlace(addedOn, expiryDate);
        await db.addOrderMarketPlace(indexedOrder);

        await db.deleteOrderMarketplace("nonce", AddressZero);
        const orders = await db.getOrdersMarketPlace();

        expect(orders).toEqual({
            orders: {},
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 0
        });
        return Promise.resolve();
    }

    async function shouldDeleteExpiredOtcOrder(db: Database) {
        const indexedOrder: IndexedOrder<DbOrderERC20> = forgeIndexedOrderERC20(1000, 2000);
        const indexedOrder2 = forgeIndexedOrderERC20(1000, 1000);
        const indexedOrder3 = forgeIndexedOrderERC20(1000, 500000);
        await db.addOrderERC20(indexedOrder);
        await db.addOrderERC20(indexedOrder2);
        await db.addOrderERC20(indexedOrder3);
        const expected = forgeIndexedOrderResponseERC20(1000, 500000);

        await db.deleteExpiredOrderERC20(300);
        const orders = await db.getOrdersERC20();

        expect(orders).toEqual({
            orders: { hash: expected },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });
        return Promise.resolve();
    }

    async function shouldDeleteExpiredMarketPlaceOrder(db: Database) {
        const indexedOrder: IndexedOrder<DbOrderMarketPlace> = forgeIndexedOrderMarketPlace(1000, 2000);
        const indexedOrder2 = forgeIndexedOrderMarketPlace(1000, 1000);
        const indexedOrder3 = forgeIndexedOrderMarketPlace(1000, 500000);
        await db.addOrderMarketPlace(indexedOrder);
        await db.addOrderMarketPlace(indexedOrder2);
        await db.addOrderMarketPlace(indexedOrder3);
        const expected = forgeIndexedOrderResponseMarketPlace(1000, 500000);

        await db.deleteExpiredOrderMarketPlace(300);
        const orders = await db.getOrdersMarketPlace();

        expect(orders).toEqual({
            orders: { hash: expected },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });
        return Promise.resolve();
    }

    async function ERC20OrderExists(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        await db.addOrderERC20(indexedOrder);

        const orderExists = await db.orderERC20Exists("hash");

        expect(orderExists).toBe(true);
        return Promise.resolve();
    }

    async function marketPlaceOrderExists(db: Database) {
        const indexedOrder = forgeIndexedOrderMarketPlace(addedOn, expiryDate);
        await db.addOrderMarketPlace(indexedOrder);

        const orderExists = await db.orderMarketPlaceExists("hash");

        expect(orderExists).toBe(true);
        return Promise.resolve();
    }

    async function ERC20OrderDoesNotExist(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        await db.addOrderERC20(indexedOrder);

        const orderExists = await db.orderERC20Exists("unknownHash");

        expect(orderExists).toBe(false);
        return Promise.resolve();
    }

    async function marketPlaceOrderDoesNotExist(db: Database) {
        const indexedOrder = forgeIndexedOrderMarketPlace(addedOn, expiryDate);
        await db.addOrderMarketPlace(indexedOrder);

        const orderExists = await db.orderMarketPlaceExists("unknownHash");

        expect(orderExists).toBe(false);
        return Promise.resolve();
    }

    async function addERC20Order(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        const expectedIndexedOrder = forgeIndexedOrderResponseERC20(addedOn, expiryDate);
        await db.addOrderERC20(indexedOrder);

        const orderExists = await db.getOrderERC20("hash");

        expect(orderExists).toEqual({
            orders: { hash: expectedIndexedOrder },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });
        return Promise.resolve();
    }

    async function addMarketPlaceOrder(db: Database) {
        const indexedOrder = forgeIndexedOrderMarketPlace(addedOn, expiryDate);
        const expectedIndexedOrder = forgeIndexedOrderResponseMarketPlace(addedOn, expiryDate);
        await db.addOrderMarketPlace(indexedOrder);

        const orderExists = await db.getOrderMarketPlace("hash");

        expect(orderExists).toEqual({
            orders: { hash: expectedIndexedOrder },
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 1
        });
        return Promise.resolve();
    }

    async function renturnsNullOnUnknownHashERC20(db: Database) {
        const indexedOrder = forgeIndexedOrderERC20(addedOn, expiryDate);
        await db.addOrderERC20(indexedOrder);

        const orderExists = await db.getOrderERC20("unknownHash");

        expect(orderExists).toEqual({
            orders: {},
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 0
        });
        return Promise.resolve();
    }

    async function renturnsNullOnUnknownHashMarketPlace(db: Database) {
        const indexedOrder = forgeIndexedOrderMarketPlace(addedOn, expiryDate);
        await db.addOrderMarketPlace(indexedOrder);

        const orderExists = await db.getOrderMarketPlace("unknownHash");

        expect(orderExists).toEqual({
            orders: {},
            pagination: {
                first: "1",
                last: "1"
            },
            ordersForQuery: 0
        });
        return Promise.resolve();
    }

    async function hashObject(db: Database) {
        const indexedOrder = new IndexedOrder(forgeDbOrderERC20(1653138423547), new Date(1653138423537).getTime(), "hash");

        const hash = db.generateHash(indexedOrder);

        expect(hash).toBe("5cfd1a4837f91f4b690c739ecf08b26d3cfa5f69e0891a108df50b1fd0a0d892");
        return Promise.resolve();
    }
});