import { Database } from '../../database/Database';
import { forgeIndexedOrderResponse } from '../../Fixtures';
import { Peers } from '../../peer/Peers';
import { RootService } from '../RootService';

describe("Root service", () => {

    let fakeDb: Partial<Database>;
    let fakePeers: Partial<Peers>;
    const indexedOrderResponse = forgeIndexedOrderResponse(1653854738949, 1653854738959);

    beforeEach(() => {
        fakeDb = {
            getOrdersERC20: jest.fn(() => Promise.resolve(
                {
                    orders: { "aze": indexedOrderResponse },
                    pagination: {
                        first: "1",
                        last: "1"
                    },
                    ordersForQuery: 1
                }
            )),
        };
        fakePeers = {
            getPeers: jest.fn(() => [])
        };
    })

    test("get", async () => {
        const expected =
        {
            databaseOrders: 1,
            peers: [],
            network: 5,
            registry: '0x6787cD07B0E6934BA9c3D1eBf3866eF091697128',
        };

        const result = await new RootService(fakePeers as Peers, fakeDb as Database, 5).get();

        expect(result).toEqual(expected);
    });
});