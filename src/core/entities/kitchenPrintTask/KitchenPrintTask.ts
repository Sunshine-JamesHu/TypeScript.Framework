import { FullAuditEntity } from "../baseEntities/BaseEntity";

export class KitchenPrintTask extends FullAuditEntity<string> {
    constructor() {
        super();

        let now = new Date().getTime();
        this.startTime = now;
        this.created = now;
        this.nono = undefined;
        this.status = 0;
        this.eatType = undefined;
        this.products = [];
        this.orderId = undefined;
        this.deskName = undefined;
        this.channleType = undefined;
        this.remark = undefined;
    }

    startTime?: number;
    nono?: number;
    status: number;
    eatType?: string;
    products?: any[];
    orderId?: string;
    deskName?: string;
    channleType?: string;
    remark?: string;

    ImplementsIStore(): boolean {
        return true;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "KitchenPrintTask",
            Index: "ebossh",
            Type: "KitchenPrintTask"
        }
    }
}