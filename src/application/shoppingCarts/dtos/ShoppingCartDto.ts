import { ProductDto } from "./ProductDto";

export class ShoppingCartDto {
    constructor(data: {
        deskId: string, person: number, memberId?: number,
        eatType?: string, deskName?: string, orderId?: string, areaName?: string
    }) {
        this.deskId = data.deskId;
        this.deskName = data.deskName ? data.deskName : data.deskId;
        this.areaName = data.areaName;
        
        this.memberId = data.memberId;
        this.person = data.person;

        this.eatType = data.eatType ? data.eatType : "堂食";
        this.totalPrice = 0;
        this.products = [];
        this.orderId = data.orderId;

       
    }
    deskId: string;
    deskName?: string;
    eatType?: string;
    person: number;
    totalPrice: number;
    memberId?: number;
    products?: ProductDto[];
    orderId?: string;
    areaName?: string;
}