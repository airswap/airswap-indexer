import { IndexedOrderResponse, OrderResponse, RequestFilter, SortField, SortOrder } from '@airswap/libraries';
import { AceBase, AceBaseLocalSettings, DataReference } from 'acebase';
import crypto from "crypto";
import fs from "fs";
import { computePagination } from '../mapper/pagination/index.js';
import { mapAnyToFullOrder } from '../mapper/mapAnyToFullOrder.js';
import { IndexedOrder } from '../model/IndexedOrder.js';
import { Database } from './Database.js';
import { Filters } from './filter/Filters.js';

const ENTRY_REF = "otcOrders";
const elementPerPage = 20;

export class AceBaseClient implements Database {

    private db!: AceBase;
    private filters!: Filters;
    private ref!: DataReference;

    public async connect(databaseName: string, deleteOnStart = false): Promise<void> {
        const options = { storage: { path: '.' }, logLevel: 'error' } as AceBaseLocalSettings;
        const dbName = `${databaseName}.acebase`;
        if (deleteOnStart && fs.existsSync(dbName)) {
            await fs.promises.rm(dbName, { recursive: true });
        }
        this.db = new AceBase(databaseName, options);
        return new Promise((resolve, reject) => {
            this.db.ready(() => {
                this.ref = this.db.ref(ENTRY_REF);
                this.db.indexes.create(`${ENTRY_REF}`, 'hash');
                this.db.indexes.create(`${ENTRY_REF}`, 'addedOn');
                this.db.indexes.create(`${ENTRY_REF}`, "approximatedSignerAmount");
                this.db.indexes.create(`${ENTRY_REF}`, "approximatedSenderAmount");
                this.db.indexes.create(`${ENTRY_REF}`, "signerToken");
                this.db.indexes.create(`${ENTRY_REF}`, "senderToken");
                resolve();
            });
        });
    }

    public constructor() {
        this.filters = new Filters();
    }

    getFiltersERC20(): Promise<Filters> {
        return Promise.resolve(this.filters);
    }

    async getOrderERC20By(requestFilter: RequestFilter): Promise<OrderResponse> {
        const query = this.ref.query();

        if (requestFilter.signerTokens != undefined) {
            query.filter('signerToken', 'in', requestFilter.signerTokens);
        }
        if (requestFilter.senderTokens != undefined) {
            query.filter('senderToken', 'in', requestFilter.senderTokens);
        }
        if (requestFilter.minSenderAmount != undefined) {
            query.filter('approximatedSenderAmount', '>=', requestFilter.minSenderAmount);
        }
        if (requestFilter.maxSenderAmount != undefined) {
            query.filter('approximatedSenderAmount', '<=', requestFilter.maxSenderAmount);
        }
        if (requestFilter.minSignerAmount != undefined) {
            query.filter('approximatedSignerAmount', '>=', requestFilter.minSignerAmount);
        }
        if (requestFilter.maxSignerAmount != undefined) {
            query.filter('approximatedSignerAmount', '<=', requestFilter.maxSignerAmount);
        }
        if (requestFilter.maxAddedDate != undefined) {
            query.filter('addedOn', '>=', requestFilter.maxAddedDate);
        }

        const isAscSort = requestFilter.sortOrder == SortOrder.ASC;
        if (requestFilter.sortField == SortField.SIGNER_AMOUNT) {
            query.sort('approximatedSignerAmount', isAscSort)
        } else if (requestFilter.sortField == SortField.SENDER_AMOUNT) {
            query.sort('approximatedSenderAmount', isAscSort)
        }

        const totalResults = await query.take(1000000).count()
        const entriesSkipped = (requestFilter.page - 1) * elementPerPage;
        const data = await query.skip(entriesSkipped).take(elementPerPage).get();
        const mapped = data.reduce((total, indexedOrder) => {
            const mapped = this.datarefToRecord(indexedOrder.val());
            return { ...total, ...mapped };
        }, {} as Record<string, IndexedOrderResponse>);
        const pagination = computePagination(elementPerPage, totalResults, requestFilter.page);
        return Promise.resolve({
            orders: mapped,
            pagination: pagination,
            ordersForQuery: totalResults
        });
    }

    close(): Promise<void> {
        return this.db.close()
    }

    async addOrder(indexedOrder: IndexedOrder): Promise<void> {
        let toAdd = { ...indexedOrder, ...indexedOrder.order };
        //@ts-ignore
        delete toAdd.order;
        await this.ref.push(toAdd);
        this.filters.addSignerToken(indexedOrder.order.signerToken, indexedOrder.order.approximatedSignerAmount);
        this.filters.addSenderToken(indexedOrder.order.senderToken, indexedOrder.order.approximatedSenderAmount);
        return Promise.resolve();
    }

    async addAll(orders: Record<string, IndexedOrder>): Promise<void> {
        await Promise.all(Object.keys(orders).map(async hash => {
            await this.addOrder(orders[hash]);
        }));
        return Promise.resolve();
    }

    async deleteOrderERC20(nonce: string, signerWallet: string): Promise<void> {
        await this.ref.query()
            .filter('nonce', '==', nonce)
            .filter('signerWallet', '==', signerWallet)
            .remove();
        return Promise.resolve();
    }

    async deleteExpiredOrderERC20(timestampInSeconds: number) {
        await this.ref.query()
            .filter('expiry', '<', timestampInSeconds)
            .remove();
        return Promise.resolve();
    }

    async getOrderERC20(hash: string): Promise<OrderResponse> {
        const query = await this.ref.query()
            .filter('hash', '==', hash)
            .get();
        const serializedOrder = query.values()?.next()?.value?.val();
        if (!serializedOrder) {
            return Promise.resolve({
                orders: {},
                pagination: computePagination(elementPerPage, 0),
                ordersForQuery: 0
            });
        }
        const result: Record<string, IndexedOrderResponse> = {};
        result[hash] = this.datarefToRecord(serializedOrder)[hash];
        return Promise.resolve({
            orders: result,
            pagination: computePagination(elementPerPage, 1),
            ordersForQuery: 1
        });
    }

    async getOrdersERC20(): Promise<OrderResponse> {
        const data = await this.ref.query().take(1000000).get(); // bypass default limitation 
        const totalResults = await this.ref.query().take(1000000).count();
        let mapped = {} as Record<string, IndexedOrderResponse>;
        data.forEach(dataSnapshot => {
            const mapp = this.datarefToRecord(dataSnapshot.val());
            mapped = { ...mapped, ...mapp };
        });
        return Promise.resolve({
            orders: mapped,
            pagination: computePagination(totalResults, totalResults),
            ordersForQuery: totalResults
        });
    }

    async erase() {
        this.filters = new Filters();
        return await this.db.ref(ENTRY_REF).remove();
    }

    private datarefToRecord(data: any): Record<string, IndexedOrderResponse> {
        const mapped: Record<string, IndexedOrderResponse> = {};
        mapped[data.hash] = {
            order: mapAnyToFullOrder(data),
            addedOn: data.addedOn,
            hash: data.hash
        };
        return mapped;
    }

    async orderERC20Exists(hash: string): Promise<boolean> {
        return await this.ref.query()
            .filter('hash', '==', hash).exists();
    }

    generateHash(indexedOrder: IndexedOrder) {
        const lightenOrder = { ...indexedOrder.order };
        //@ts-ignore
        delete lightenOrder.approximatedSenderAmount;
        //@ts-ignore
        delete lightenOrder.approximatedSignerAmount;
        const stringObject = JSON.stringify(lightenOrder);
        const hashed = crypto.createHash("sha256").update(stringObject, "utf-8");
        return hashed.digest("hex");
    }
}