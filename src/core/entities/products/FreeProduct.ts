import { BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class FreeProduct extends BaseEntity<string> implements IStore {
    constructor() {
        super();

        this.ordersId = undefined;
        this.productId = undefined;
        this.cnt = 0;
        this.detailId = undefined;
        this.created = 0;
        this.name = undefined;
        this.reasonId = undefined;
        this.status = 0;
        this.storeId = undefined;
        this.amount = 0;
    }

    public amount: number;
    public storeId?: number;
    public ordersId?: string;
    public productId?: string;
    public cnt: number; //这是退款数量
    public created: number; //创建时间
    public name?: string;
    public reasonId?: string;
    public detailId?: string;
    public status: number;


    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "FreeProduct",
            Index: "ebossh",
            Type: "freeProducts"
        };
    }

    ImplementsIStore(): boolean {
        return true;
    }

}