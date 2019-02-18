import { BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class RefundProduct extends BaseEntity<string> implements IStore {
    constructor() {
        super();

        this.ordersId = undefined;
        this.productId = undefined;
        this.isRefund = 0;
        this.amount = 0;
        this.created = 0;
        this.name = undefined;
        this.reasonId = undefined;
        this.refundAmount = undefined;
        this.storeId = undefined;
        this.detailId = undefined;
        this.canSell = undefined;
        this.status = undefined;
    }

    public storeId?: number;
    public ordersId?: string;
    public productId?: string;
    public isRefund: number; //这是退款数量
    public amount: number;
    public created: number; //创建时间
    public name?: string;
    public reasonId?: string;
    public refundAmount?: number;
    public detailId?: string;
    public canSell?: boolean;
    public status?: boolean;

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "RefundProduct",
            Index: "ebossh",
            Type: "productsRefunds"
        };
    }

    ImplementsIStore(): boolean {
        return true;
    }

}