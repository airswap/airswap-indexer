import { Request, Response } from 'express';
import { Database } from '../../database/Database';
import { Entry } from './../../model/Entry';
import { TransactionStatus } from './../../model/TransactionStatus';
import { Peers } from './../../peer/Peers';
import { EntryController } from './../EntryController';
describe("Entry controller", () => {

    let fakeDb: Partial<Database>;
    let fakePeers: Partial<Peers>;
    const entry = new Entry("by", "from", "to", 3, 4, TransactionStatus.IN_PROGRESS);

    beforeEach(() => {
        fakeDb = {
            getEntries: jest.fn(() => ({ "aze": entry }) as Record<string, Entry>),
            addEntry: jest.fn(),
            getEntry: jest.fn(),
            entryExists: jest.fn(),
            generateId: jest.fn(),
            isIdConsistent: jest.fn(),
            editEntry: jest.fn()
        };
        fakePeers = {
            getPeers: jest.fn(() => []),
            broadcast: jest.fn()
        };
    })

    test("get entries", () => {
        const mockRequest = {
            body: undefined,
            params: {},
            method: "GET",
            url: "/entries"
        } as Request;

        const mockResponse = {
            json: jest.fn()
        } as Partial<Response>;

        const expected =
        {
            aze: {
                by: "by",
                from: "from",
                nb: 3,
                price: 4,
                status: "IN_PROGRESS",
                to: "to",
            },
        };

        new EntryController(fakePeers as Peers, fakeDb as Database).getEntries(mockRequest, mockResponse as Response);

        expect(mockResponse.json).toHaveBeenCalledWith(expected);
    });

    describe("Add Entry", () => {
        test("Add entry nominal & broadcast", () => {
            const mockRequest = {
                body: entry,
                params: {},
                method: "POST",
                url: "/entries"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.generateId.mockImplementation(() => "a");
            //@ts-ignore
            fakeDb.entryExists.mockImplementation(() => false);

            const expected = entry;

            new EntryController(fakePeers as Peers, fakeDb as Database).addEntry(mockRequest, mockResponse as Response);

            expect(fakeDb.isIdConsistent).toHaveBeenCalledTimes(0);
            expect(fakeDb.generateId).toHaveBeenCalledWith(expected);
            expect(fakeDb.entryExists).toHaveBeenCalledWith("a");
            expect(fakeDb.addEntry).toHaveBeenCalledWith(expected, "a");
            expect(fakePeers.broadcast).toHaveBeenCalledWith("POST", "/entries/a", entry);
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
        });

        test("Add entry from broadcast", () => {
            const mockRequest = {
                body: entry,
                params: { entryId: "a" } as Record<string, any>,
                method: "POST",
                url: "/entries/a"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.entryExists.mockImplementation(() => false);            
            //@ts-ignore
            fakeDb.isIdConsistent.mockImplementation(() => true);

            const expected = entry;

            new EntryController(fakePeers as Peers, fakeDb as Database).addEntry(mockRequest, mockResponse as Response);

            expect(fakeDb.isIdConsistent).toHaveBeenCalledWith(entry, "a");
            expect(fakeDb.generateId).toBeCalledTimes(0);
            expect(fakeDb.entryExists).toHaveBeenCalledWith("a");
            expect(fakeDb.addEntry).toHaveBeenCalledWith(expected, "a");
            expect(fakePeers.broadcast).toHaveBeenCalledWith("POST", "/entries/a", entry);
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
        });

        test("Add: already added", () => {
            const mockRequest = {
                body: entry,
                params: {},
                method: "POST",
                url: "/entries"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.generateId.mockImplementation(() => "a");
            //@ts-ignore
            fakeDb.entryExists.mockImplementation(() => true);

            const expected = entry;

            new EntryController(fakePeers as Peers, fakeDb as Database).addEntry(mockRequest, mockResponse as Response);

            expect(fakeDb.isIdConsistent).toHaveBeenCalledTimes(0);
            expect(fakeDb.generateId).toHaveBeenCalledWith(expected);
            expect(fakeDb.entryExists).toHaveBeenCalledWith("a");
            expect(fakeDb.addEntry).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
        });

        test("Add: given id is inconsistent", () => {
            const mockRequest = {
                body: entry,
                params: { entryId: "a" } as Record<string, any>,
                method: "POST",
                url: "/entries/a"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.generateId.mockImplementation(() => "b");

            new EntryController(fakePeers as Peers, fakeDb as Database).addEntry(mockRequest, mockResponse as Response);

            expect(fakeDb.isIdConsistent).toHaveBeenCalledWith(entry, "a");
            expect(fakeDb.generateId).toHaveBeenCalledTimes(0);;
            expect(fakeDb.entryExists).toHaveBeenCalledTimes(0);
            expect(fakeDb.addEntry).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
        });

        test("Missing entry", () => {
            const mockRequest = {
                body: {},
                params: {},
                method: "POST",
                url: "/entries"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            new EntryController(fakePeers as Peers, fakeDb as Database).addEntry(mockRequest, mockResponse as Response);

            expect(fakeDb.entryExists).toHaveBeenCalledTimes(0);
            expect(fakeDb.addEntry).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
        });
    });

    describe("Edit Entry", () => {
        test("Missing id", () => {
            const mockRequest = {
                body: { status: TransactionStatus.DONE },
                params: {},
                method: "PUT",
                url: "/entries"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            new EntryController(fakePeers as Peers, fakeDb as Database).editEntry(mockRequest, mockResponse as Response);

            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
            expect(fakeDb.editEntry).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
        });


        test("Missing status", () => {
            const mockRequest = {
                body: {},
                params: { entryId: "a" } as Record<string, any>,
                method: "PUT",
                url: "/entries/a"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            new EntryController(fakePeers as Peers, fakeDb as Database).editEntry(mockRequest, mockResponse as Response);

            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
            expect(fakeDb.editEntry).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
        });

        test("Entry does not exists", () => {
            const mockRequest = {
                body: { status: TransactionStatus.DONE },
                params: { entryId: "a" } as Record<string, any>,
                method: "PUT",
                url: "/entries/a"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.entryExists.mockImplementation(() => false);

            new EntryController(fakePeers as Peers, fakeDb as Database).editEntry(mockRequest, mockResponse as Response);

            expect(mockResponse.sendStatus).toHaveBeenCalledWith(403);
            expect(fakeDb.editEntry).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
        });

        test("Entry already up to date", () => {
            const entry = new Entry("by", "from", "to", 3, 4, TransactionStatus.DONE);
            const mockRequest = {
                body: { status: TransactionStatus.DONE },
                params: { entryId: "a" } as Record<string, any>,
                method: "PUT",
                url: "/entries/a"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.entryExists.mockImplementation(() => true);
            //@ts-ignore
            fakeDb.getEntry.mockImplementation(() => entry);

            new EntryController(fakePeers as Peers, fakeDb as Database).editEntry(mockRequest, mockResponse as Response);

            expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
            expect(fakeDb.entryExists).toHaveBeenCalledWith("a");
            expect(fakeDb.getEntry).toHaveBeenCalledWith("a");
            expect(fakePeers.broadcast).toHaveBeenCalledTimes(0);
        });

        test("Edit entry", () => {
            const entry = new Entry("by", "from", "to", 3, 4, TransactionStatus.IN_PROGRESS);
            const mockRequest = {
                body: { status: TransactionStatus.DONE },
                params: { entryId: "a" } as Record<string, any>,
                method: "PUT",
                url: "/entries/a"
            } as Request;

            const mockResponse = {
                json: jest.fn(),
                sendStatus: jest.fn(),
            } as Partial<Response>;

            //@ts-ignore
            fakeDb.entryExists.mockImplementation(() => true);
            //@ts-ignore
            fakeDb.getEntry.mockImplementation(() => entry);

            new EntryController(fakePeers as Peers, fakeDb as Database).editEntry(mockRequest, mockResponse as Response);

            expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
            expect(fakeDb.entryExists).toHaveBeenCalledWith("a");
            expect(fakeDb.getEntry).toHaveBeenCalledWith("a");
            expect(fakeDb.editEntry).toHaveBeenCalledWith("a", TransactionStatus.DONE);
            expect(fakePeers.broadcast).toHaveBeenCalledWith("PUT", "/entries/a", { "status": "DONE" });
        });
    });
});