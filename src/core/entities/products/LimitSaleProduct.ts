import { BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";
import { IHasCreationTime, IHasModificationTime } from "../baseEntities/IAudit";

export class LimitSaleProduct extends BaseEntity<string> implements IStore, IHasCreationTime, IHasModificationTime {
    constructor() {
        super();

        this.productId = undefined;
        this.created = 0;
        this.limit = undefined;
        this.modified = 0;
        this.name = undefined;
        this.productId = undefined;
        this.sold = 0;
        this.status = undefined;
        this.storeId = 0;
    }

    public created?: number;
    public limit?: number;
    public modified?: number;
    public name?: string;
    public productId?: string;
    public sold?: number;
    public status?: number;
    public storeId?: number;


    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "LimitSaleProduct",
            Index: "ebossh",
            Type: "limitSaleProducts"
        };
    }

    ImplementsIStore(): boolean {
        return true;
    }

    ImplementsIHasModificationTime(): boolean {
        return true;
    }

    ImplementsIHasCreationTime(): boolean {
        return true;
    }

}