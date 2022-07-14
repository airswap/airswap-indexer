import { ClientError } from './../model/error/ClientError';
import { Express, Request, Response } from "express";
import { IndexedOrderError } from '../model/error/IndexedOrderError.js';
import { NotFound } from '../model/error/NotFound.js';
import { JsonRpcResponse } from '../model/response/JsonRpcResponse.js';
import { RootService } from '../service/RootService.js';
import { Peers } from './../peer/Peers.js';
import { OrderService } from './../service/OrderService.js';

export class RequestForQuote {
    private server: Express;
    private orderService: OrderService;
    private rootService: RootService;
    private peers: Peers;

    constructor(server: Express, orderService: OrderService, rootService: RootService, peers: Peers) {
        this.server = server;
        this.rootService = rootService;
        this.orderService = orderService;
        this.orderService = orderService;
        this.peers = peers;
    }

    async run() {
        this.server.get('*', async (request: Request, response: Response) => {
            console.log("R<---", request.method, request.url, request.body);
            const result = await this.rootService.get();
            response.json(result);
        });

        this.server.post('*', async (request: Request, response: Response) => {
            console.log("R<---", request.method, request.url, request.body);
            const { id, method, params = [] } = request.body;

            if (Object.keys(this.orderService.methods).indexOf(method) === -1) {
                const error = new NotFound("Method does not exist.");
                response.status(error.code);
                response.json(new JsonRpcResponse(id, error));
                return;
            }

            if (params.length !== 1 && params[0] !== undefined) {
                const error = new ClientError("Empty params");
                response.status(error.code);
                response.json(new JsonRpcResponse(id, error));
                return;
            }

            const parameters = params[0];

            try {
                let result;
                response.status(200);
                switch (method) {
                    case this.orderService.methods.getOrders:
                        result = await this.orderService.getOrders(parameters, parameters.orderHash);
                        break;
                    case this.orderService.methods.addOrder:
                        await this.orderService.addOrder(parameters);
                        this.peers.broadcast(request.method, request.url, request.body);
                        response.status(201);
                        break;
                }
                response.json(new JsonRpcResponse(id, result));
            } catch (error) {
                const err = error as IndexedOrderError;
                response.status(err.code);
                response.json(new JsonRpcResponse(id, err))
            }
        });
    }
}
