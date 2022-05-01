import { PeersClient } from '../client/PeersClient.js';
import { Database } from '../database/Database.js';

const HTTP_PREFIX = "http://";

export class Peers {

  peers: string[];
  database: Database;
  host: string;
  client: PeersClient;

  constructor(database: Database, host: string, client: PeersClient) {
    this.peers = [];
    this.database = database;
    this.host = host;
    this.client = client;
  };

  addPeer = (url: string) => {
    this.addPeers([url]);
  }

  addPeers = (urls: string[]) => {
    this.peers = [...new Set([...this.peers, ...urls])]
  }

  removePeer = (address: string) => {
    const peerToRemove = this.peers.filter((peerUrl) => peerUrl === address)[0];
    if (!peerToRemove) {
      return;
    }
    this.peers = this.peers.filter((client) => client != peerToRemove);
  };

  peerExists = (address: string) => {
    return !!this.peers.filter((peerUrl) => peerUrl === address)[0];
  };

  getConnectablePeers = () => {
    const availablePeers = this.peers.map((url) => url.replace(HTTP_PREFIX, ""));
    return availablePeers.filter((ip) => ip != this.host);
  };

  containsUnknownPeers = (peersUrl: string[]) => {
    return peersUrl.filter((ip) => this.peers.indexOf(ip) == -1).length > 0;
  }

  broadcast = (method: string, path: string, body?: any) => {
    this.peers.forEach((clientUrl) => {
      if (clientUrl && clientUrl != this.host) {
        console.log(HTTP_PREFIX + clientUrl + path, body);
        this.client.sendTo(method, HTTP_PREFIX + clientUrl + path, body);
      }
    });
  }

  broadcastMyHostToOtherPeer = () => {
    this.peers.forEach((clientUrl) => {
      if (clientUrl && clientUrl != this.host) {
        this.client.addPeer(HTTP_PREFIX + clientUrl, this.host);
      }
    });
  };

  broadcastDisconnectionToOtherPeer = () => {
    this.peers.forEach((clientUrl) => {
      if (clientUrl && clientUrl != this.host) {
        this.client.removePeer(HTTP_PREFIX + clientUrl, this.host);
      }
    });
  };

  getPeers = () => {
    return this.peers;
  };
}
