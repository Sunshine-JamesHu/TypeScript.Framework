import { IApplicationService } from "../IApplicationService";
import { ProductType } from "../../core/entities/productTypes/ProductType";

export interface IProductTypeService extends IApplicationService {

    /**
     * 获取品牌下的所有商品类型
     */
    GetBrandProductTypes(): Promise<ProductType[]>;

}