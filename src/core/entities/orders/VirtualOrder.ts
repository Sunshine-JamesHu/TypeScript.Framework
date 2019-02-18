import { BaseEntity } from "../baseEntities/BaseEntity";

export class VirtualOrder extends BaseEntity<string>  {
    constructor() {
        super();
        this.allStore = undefined;
        this.stores = [];
        this.base = undefined;
        this.products = undefined;
    }

    allStore?: boolean;
    stores: any[];
    base?: {
        name: string,
        status: number,
        type: string,
        price: number | string,
    }
    products?: {
        grade: any,
        coupons: any[],
        actives: any[]
    }

    ImplementsIStore(): boolean {
        return true;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "VirtualOrder",
            Index: "virtualorders",
            Type: "products"
        }
    }
}