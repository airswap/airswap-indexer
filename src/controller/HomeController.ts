import { Request, Response } from 'express';
import { Database } from '../database/Database.js';
import { Peers } from '../peer/Peers.js';
export class HomeController {

    private peers: Peers;
    private registry: string;
    private database: Database;

    constructor(peers: Peers, database: Database, registry: string) {
        this.peers = peers;
        this.registry = registry;
        this.database = database;
    }

    get = (request: Request, response: Response) => {
        console.log("R<---", request.method, request.url, request.body);
        response.json({
            peers: this.peers.getPeers(),
            registry: this.registry,
            database: this.database.getEntries(),
        });
    }
}