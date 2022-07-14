import { SuccessResponse } from 'model/response/SuccessResponse.js';
import { IndexedOrderError } from '../error/IndexedOrderError.js';
import { ErrorResponse } from './ErrorResponse.js';
import { OrderResponse } from './OrderResponse.js';

export class JsonRpcResponse {
    private jsonrpc = '2.0';
    private id: string;
    private result: OrderResponse | ErrorResponse | SuccessResponse | undefined;

    constructor(id: string, result: OrderResponse | IndexedOrderError | SuccessResponse | undefined) {
        this.id = id;
        if (result instanceof IndexedOrderError) {
            this.result = new ErrorResponse(result.code, result.message);
        } else {
            this.result = result;
        }
    }
}