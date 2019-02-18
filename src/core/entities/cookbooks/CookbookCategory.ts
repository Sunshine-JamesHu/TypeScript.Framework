import { BaseEntity } from "../baseEntities/BaseEntity";
import { IStore } from "../baseEntities/IStore";

export class CookbookCategory extends BaseEntity<string> implements IStore {
    public storeId?: number;
    public items?: any[];
    public name: string;

    constructor() {
        super();
        this.id = undefined;
        this.items = undefined;
        this.name = "";
        this.brandId = undefined;
        this.storeId = undefined;
    }

    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "CookbookCategory",
            Index: "ebossh",
            Type: "cookbookcategory"
        }
    }

    ImplementsIStore(): boolean {
        return true;
    }

}