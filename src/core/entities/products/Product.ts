import { FullAuditEntity, BaseEntity } from "../baseEntities/BaseEntity";

class ProductBase {
    constructor() {
        this.name = undefined;
        this.alias = undefined;
        this.intro = undefined;
        this.pinyin = undefined;
        this.kitchen = undefined;
        this.unit = undefined;
        this.category = undefined;
        this.options = undefined;
        this.picInfo = undefined;
        this.components = undefined;
        this.scales = undefined;
        this.tags = undefined;
        this.salesTime = undefined;

        this.productsList = undefined;
        this.zixuanProducts = undefined;
        this.rule = undefined;
        this.limit = undefined;
        this.status = undefined;
    }

    public name?: string;
    public alias?: string;
    public intro?: string;
    public pinyin?: string;

    public productsList: any;
    public zixuanProducts: any;
    public rule: any;
    public limit?: string; //其实的数据是数字的
    public status?: any;

    
    public kitchen?: {
        station: { id: string },
        maxcount: number
    };
    public unit?: {
        id: string,
        label: string
    };
    public category?: {
        id: string,
        name: string
    };
    public options?: {
        [key: string]: boolean
    };
    public picInfo?: {
        default: number;
        items: Array<{ url: string, info: any }>
    };

    public components?: {
        id: string,
        order: string;
        name: string;
        type: string;
        options: {
            limit: number,
            require: boolean
        }
        items: Array<{ id: string, name: string, price: number }>
    };

    public scales?: Array<{ price: number, name: string, id: number }>
    public tags?: Array<{ label: string }>;
    public salesTime?: any;

}

export class Product extends BaseEntity<string> {
    constructor() {
        super();
        this.type = undefined;
        this.allStore = undefined;
        this.brand_name = undefined;
        this.base = new ProductBase();
        this.isExtra = undefined;
        this.operateperson = undefined;
        this.storeIds = undefined;
        this.onsaleing = undefined;
    }
    public type?: string;
    public allStore?: boolean;
    public onsaleing?: { storeId: number, status: number }[];
    public brand_name?: string;
    public base?: ProductBase;
    public isExtra?: boolean;
    public operateperson?: string;
    public storeIds?: { [key: number]: boolean };


    GetEntityInfo(): { Name: string; Index: string; Type: string; } {
        return {
            Name: "Product",
            Index: "ebossh",
            Type: "products"
        }
    };

}
