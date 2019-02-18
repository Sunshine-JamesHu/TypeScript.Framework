import { FullAuditEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class OrderBillStatus extends FullAuditEntity<string> implements IStore {
    ordersId?: string;
    status?: number;
    payPrice?: string; //本来是Number的

    constructor() {
        super();
        this.storeId = undefined;
        this.ordersId = undefined;
        this.status = undefined;
        this.payPrice = undefined;
    }

    ImplementsIStore(): boolean {
        return true;
    }
    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "OrderBillStatus",
            Index: "ebossh",
            Type: "orderBillStatus"
        }
    }

}