
import { IApplicationService } from "../IApplicationService";
import { ProductDto } from "./dtos/ProductDto";
import { ShoppingCartDto } from "./dtos/ShoppingCartDto";

/**
 * 购物车服务
 */
export interface IShoppingCartService extends IApplicationService {

    /**
     * 初始化购物车
     * @param data  初始化所需参数
     */
    InitShoppingCart(data: { person: number, deskId: string, deskName?: string, memberId?: number, orderId?: string, areaName?: string, eatType?: string }): boolean;

    /**
     * 添加购物车商品
     * @param product 
     */
    AddProduct(product: ProductDto): boolean;

    /**
     * 删除购物车中的商品
     * @param product 
     */
    DelProduct(product: ProductDto): boolean;

    /**
     * 清空购物车
     */
    ClearShoppingCart(): boolean;

    RemoveShoppingCart(): boolean;

    /**
     * 获取购物车信息
     */
    GetShoppingCartInfo(): ShoppingCartDto;

    /**
     * 获取下单数据
     */
    GetSaveOrderData(): any;

    /**
     * 修改购物车信息
     * @param infos 信息
     */
    UpdateShopCartInfo(infos: { key: string, val: any }[]): any;

}