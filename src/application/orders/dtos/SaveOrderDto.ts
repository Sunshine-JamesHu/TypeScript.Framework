export class SaveOrderDto {
    constructor() {
        this.ordersArray = [];
        this.infos = {};
        this.payMode = "post-pay";
        this.deskType = "桌号";
    }

    public payMode: string;
    public optype?: string;
    public deskType: string;

    public ordersArray?: {
        id: string, //商品Id
        scaleId: string, //规格Id
        components: {
            id: string, //加料组Id
            items: {
                id: string, //加料Id
                c: number //数量
            }[]
        }[],
        cnt: number
    }[];

    public infos: {
        person?: number,
        eatType?: string,
        deskId?: string;
        deskAlias?: string,
        ordersType?: string,
        syName?: string,
        syId?: number,
        memberId?: number,
        ordersId?: string;
        storeId?: number | string,
        brandId?: number | string,
        channleType?: string,
        subject?: string,
        memberRemark?: string
    };
}
