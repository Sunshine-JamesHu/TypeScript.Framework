import { IApplicationService } from "../IApplicationService";
import { StoreInfo } from "../../core/entities/stores/StoreInfo";

export interface IStoreService extends IApplicationService {

    /**
     * 获取门店的详情信息 Es (已经弃用，请不要使用)
     * @param data 门店Id
     */
    GetBrandStoreInfo(data?: { storeId?: number, brandId?: number, refreshCache?: boolean }): Promise<StoreInfo | null>;

    /**
     * 获取门店的详情信息 MySql
     * @param data 
     */
    GetBrandStoreinfoByApi(data?: { storeId?: number, brandId?: number, refreshCache?: boolean }): Promise<StoreInfo | null>;

    /**
     * 获取门店桌台信息
     */
    GetStoreTables(): Promise<any>;
}