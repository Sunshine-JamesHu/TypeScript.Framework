import { FullAuditEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class OrderVoucher extends FullAuditEntity<string> implements IStore {
    count?: number;
    faceVal?: number;
    price?: number;
    orderId?: string;
    voucherId?: string;
    voucherName?: string;
    discountFee?: number;
    key?: string;
    creationTime?: number;

    constructor() {
        super();

        this.count = undefined;
        this.faceVal = undefined;
        this.price = undefined;
        this.orderId = undefined;
        this.voucherId = undefined;
        this.voucherName = undefined;
        this.discountFee = undefined;
        this.key = undefined;
        this.creationTime = undefined;
        
    }

    ImplementsIStore(): boolean {
        return true;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "OrderVoucher",
            Index: "report",
            Type: "orderVoucher"
        }
    }

}