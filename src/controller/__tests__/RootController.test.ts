import { Order } from '@airswap/typescript';
import { Request, Response } from 'express';
import { Database } from '../../database/Database';
import { OtcOrder } from './../../model/OtcOrder';
import { Peers } from './../../peer/Peers';
import { RootController } from './../RootController';
describe("Home controller", () => {

    let fakeDb: Partial<Database>;
    let fakePeers: Partial<Peers>;
    let registryAddress = "registry";
    const OtcOrder = forgeOtcOrder(1653854738949, 1653854738959);

    beforeEach(() => {
        fakeDb = {
            getOrders: jest.fn(() => Promise.resolve(({ "aze": OtcOrder })) as Promise<Record<string, OtcOrder>>),
        };
        fakePeers = {
            getPeers: jest.fn(() => [])
        };
    })

    test("/", async () => {
        const mockRequest = {
            body: undefined,
            params: {},
            method: "GET",
            url: "/"
        } as Request;

        const mockResponse = {
            json: jest.fn()
        } as Partial<Response>;

        const expected =
        {
            database: {
                aze: {
                    addedOn: 1653854738949,
                    id: "id",
                    order: {
                        expiry: "1653854738959",
                        nonce: "nonce",
                        r: "r",
                        s: "s",
                        senderAmount: "10",
                        senderToken: "ETH",
                        signerAmount: "5",
                        signerToken: "dai",
                        signerWallet: "signerWallet",
                        v: "v",

                    },
                },
            },
            peers: [],
            registry: "registry",
        };

        await new RootController(fakePeers as Peers, fakeDb as Database, registryAddress).get(mockRequest, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledWith(expected);
    });
});

function forgeOtcOrder(expectedAddedDate = new Date().getTime(), expiryDate = new Date().getTime() + 10) {
    return new OtcOrder(forgeOrder(`${expiryDate}`), expectedAddedDate, "id");
}

function forgeOrder(expiryDate: string): Order {
    return {
        nonce: "nonce",
        expiry: expiryDate,
        signerWallet: "signerWallet",
        signerToken: "dai",
        signerAmount: "5",
        senderToken: "ETH",
        senderAmount: "10",
        v: "v",
        r: "r",
        s: "s"
    };
}