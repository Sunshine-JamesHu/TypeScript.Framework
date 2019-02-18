
interface Component {
    id: string;
    name?: string;
    items: {
        id: string; //Id
        name?: string, //名称
        price?: number, //价格
        count: number //选了几份
    }[];
    type?: string;
}

export class ProductDto {
    constructor(data: {
        id: string, scaleId: string, count: number,
        name?: string, scaleName?: string, price?: number, type?: string, limit?: number, kitchen: any,
        subProducts?: ProductDto[], components?: Component[], exinfo?: any, groupId?: number | string, weight?: number
        groupName?: string, categoryId?: string
    }) {
        this.id = data.id;
        this.scaleId = data.scaleId;
        this.count = data.count;
        this.components = data.components;

        this.name = data.name;
        this.scaleName = data.scaleName;
        this.price = data.price;
        this.type = data.type;
        this.limit = data.limit;
        this.products = data.subProducts;
        this.exinfo = data.exinfo;

        this.groupId = data.groupId;
        this.groupName = data.groupName;

        this.categoryId = data.categoryId;
        this.kitchen = data.kitchen;
        this.weight = data.weight;
    }
    id: string;
    name?: string;
    scaleId: string;
    scaleName?: string;
    count: number;
    price?: number;
    products?: ProductDto[];
    type?: string;
    limit?: number;
    exinfo?: any;
    groupId?: number | string;
    groupName?: string;

    components?: Component[];

    categoryId?: string;

    kitchen: any;
    weight?: number;
}

