import { IApplicationService } from "../IApplicationService";
import { Product } from "../../core/entities/products/Product";

export interface IProductService extends IApplicationService {

    /**
     * 获取本品牌下的所有商品
     * @param data  请求数据
     */
    GetBrandAllProducts(data: {
        dataType?: number,  //数据格式  0:Map 1:List
    }): Promise<Product[] | { [key: string]: Product; }>

    /**
     * 获取本门店所有上架的商品
     * @param data  请求数据
     */
    GetStoreProducts(data?: {
        dataType?: number,  //数据格式  0:Map 1:List
        refresh?: boolean   //是否强制刷新
    }): Promise<any[] | { [key: string]: any; }>


    /**
     * 获取本门店所有 有优惠的商品数据
     */
    GetProductDiscount(): Promise<any>;

    /**
     * 获取品牌的所有按人数收费的商品
     */
    GetBrandExtraProducts(): Promise<any>;

    /**
     * 获取热销商品
     */
    GetHotSaleProducts():Promise<any>;

    /**
     * 获取限售商品
     */
    GetLimitSaleProducts():Promise<any>;

    GetStoreCookbookCategory(data?: { refresh?: boolean }): Promise<any>;
}