import axios, { AxiosResponse } from "axios";
import { RegistryClient } from './../RegistryClient';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function axios200Response(data: object): AxiosResponse<any> {
    return {
        data: data,
        status: 200,
        statusText: "OK",
        config: {},
        headers: {}
    }
};

describe("Registry client", () => {
    it("get peers from registry", async () => {
        mockedAxios.get.mockImplementation((url: string, data: any) => {
            expect(url).toBe("registry_url")
            expect(data).toBeUndefined()
            return Promise.resolve(axios200Response({}));
        });
        const response = await new RegistryClient("registry_url").getPeersFromRegistry();
        expect(response).toBeDefined();
    });

    it("send my ip to registry", async () => {
        mockedAxios.post.mockImplementation((url: string, data: any) => {
            expect(url).toBe("registry_url")
            expect(data).toEqual({ ip: "my_ip" })
            return Promise.resolve(axios200Response({}));
        });
        const response = await new RegistryClient("registry_url").sendIpToRegistry("my_ip");
        expect(response).toBeDefined();
    });

    it("remove my ip from registry", async () => {
        mockedAxios.delete.mockImplementation((url: string, data: any) => {
            expect(url).toBe("registry_url/my_ip")
            expect(data).toBeUndefined()
            return Promise.resolve(axios200Response({}));
        });
        const response = await new RegistryClient("registry_url").removeIpFromRegistry("my_ip");
        expect(response).toBeDefined();
    });
});  