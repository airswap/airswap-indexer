import { HealthCheckResponse } from '@airswap/libraries';
import { OrderERC20 } from '@airswap/typescript';
import bodyParser from "body-parser";
import express from 'express';
import http from "http";
import supertest from "supertest";
import { forgeJsonRpcResponse, forgeOrderResponse } from '../../Fixtures';
import { Peers } from '../../peer/Peers';
import { ClientError } from './../../model/error/ClientError';
import { OrderService } from './../../service/OrderService';
import { RootService } from './../../service/RootService';
import { IndexerServer } from './../IndexerServer';

jest
    .useFakeTimers()
    .setSystemTime(new Date(1653900784706));

describe("Order controller", () => {

    let fakePeers: Partial<Peers>;
    let fakeOrderService: Partial<OrderService>;
    let fakeRootService: Partial<RootService>;
    let webserver: express.Express;
    let server: http.Server;

    beforeEach(() => {
        webserver = express();
        webserver.use(bodyParser.json());
        server = webserver.listen(9875, () => { console.log("listening") });

        fakeRootService = {
            get: jest.fn()
        }
        fakePeers = {
            getPeers: jest.fn(() => []),
            broadcast: jest.fn()
        };
        fakeOrderService = {
            getOrdersERC20: jest.fn(),
            addOrderERC20: jest.fn()
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
        server.close();
    });

    describe("GET *", () => {
        test("should give basic info", done => {
            const result: HealthCheckResponse = { registry: "registry", peers: [], databaseOrders: 100 };
            const expected = {
                "jsonrpc": "2.0",
                "id": "-1",
                result
            };
            // @ts-ignore
            fakeRootService.get.mockImplementation(() => Promise.resolve(result));

            new IndexerServer(webserver, fakeOrderService as OrderService, fakeRootService as RootService, fakePeers as Peers).run();
            supertest(webserver)
                .get("/")
                .then(response => {
                    expect(response.body).toEqual(expected);
                    expect(response.statusCode).toBe(200);
                    done();
                });
        });
    });

    describe("POST *", () => {
        test("should return 404 on unknow method", done => {
            const expected = {
                id: "-1",
                jsonrpc: "2.0",
                result: {
                    code: 404,
                    message: "Method does not exist."
                }
            };
            new IndexerServer(webserver, fakeOrderService as OrderService, fakeRootService as RootService, fakePeers as Peers).run();
            supertest(webserver)
                .post("/")
                .type("json")
                .send({ id: "-1", method: "unknonwn" })
                .then(response => {
                    expect(response.body).toEqual(expected);
                    expect(response.statusCode).toBe(404);
                    done();
                });
        });

        test("should return 400 if params is not an array", done => {
            const expected = {
                id: "-1",
                jsonrpc: "2.0",
                result: {
                    code: 400,
                    message: "Empty params"
                }
            };
            new IndexerServer(webserver, fakeOrderService as OrderService, fakeRootService as RootService, fakePeers as Peers).run();
            supertest(webserver)
                .post("/")
                .type("json")
                .send({ id: "-1", method: "getOrdersERC20", params: {} })
                .then(response => {
                    expect(response.body).toEqual(expected);
                    expect(response.statusCode).toBe(400);
                    done();
                });
        });
    });

    describe('Get orders', () => {
        test("nominal", (done) => {
            const expected = forgeJsonRpcResponse("-1", forgeOrderResponse());
            fakeOrderService.getOrdersERC20 = jest.fn().mockResolvedValue(forgeOrderResponse());

            new IndexerServer(webserver, fakeOrderService as OrderService, fakeRootService as RootService, fakePeers as Peers).run();

            supertest(webserver)
                .post("/")
                .type("json")
                .send({ id: "-1", method: "getOrdersERC20", params: [{ filters: true }] })
                .then(response => {
                    expect(response.body).toEqual(expected);
                    expect(response.statusCode).toBe(200);
                    expect(fakeOrderService.getOrdersERC20).toHaveBeenCalledWith({ "filters": true });
                    done();
                });
        });
    });


    describe("Add Order", () => {
        test("Add order nominal & broadcast", done => {
            const order = forgeOrder(1653900784696);
            const payload = { id: "-1", method: "addOrderERC20", params: [order] };
            new IndexerServer(webserver, fakeOrderService as OrderService, fakeRootService as RootService, fakePeers as Peers).run();
            supertest(webserver)
                .post("/")
                .type("json")
                .send(payload)
                .then(response => {
                    expect(response.body).toEqual({ id: "-1", "jsonrpc": "2.0", "result": { "message": "Added" } });
                    expect(response.statusCode).toBe(201);
                    expect(fakeOrderService.addOrderERC20).toHaveBeenCalledWith(order);
                    expect(fakePeers.broadcast).toHaveBeenCalledWith("POST", "/", payload);
                    done();
                });
        });

        test("Add order error, no broadcast", done => {
            const order = forgeOrder(1653900784696);
            const payload = { id: "-1", method: "addOrderERC20", params: [order] };

            fakeOrderService.addOrderERC20 = jest.fn().mockImplementation(() => {
                throw new ClientError("an error");
            })
            new IndexerServer(webserver, fakeOrderService as OrderService, fakeRootService as RootService, fakePeers as Peers).run();

            supertest(webserver)
                .post("/")
                .type("json")
                .send(payload)
                .then(response => {
                    expect(response.body).toEqual(
                        {
                            id: "-1", "jsonrpc": "2.0",
                            "result": {
                                "code": 400,
                                "message": "an error"
                            }
                        });
                    expect(response.statusCode).toBe(400);
                    expect(fakeOrderService.addOrderERC20).toHaveBeenCalledWith(order);
                    expect(fakePeers.broadcast).not.toHaveBeenCalled();
                    done();
                });
        });
    });
});

function forgeOrder(expiryDate: number): OrderERC20 {
    return {
        nonce: "nonce",
        expiry: `${expiryDate}`,
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