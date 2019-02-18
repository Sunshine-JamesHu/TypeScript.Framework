import { BaseApplicationService } from "../BaseApplicationService";
import { IStoreService } from "./IStoreService";
import { StoreInfo } from "../../core/entities/stores/StoreInfo";
import { IRepository } from "../../core/repository/IRepository";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";
import { EsQuery } from "../../core/repository/dtos/EsQuery";
import { BrandInfo } from "../../core/entities/brands/BrandInfo";
import { TableAreas } from "../../core/entities/stores/TableAreas";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { AddCacheDto } from "../../core/cache/dtos/AddCacheDto";

export class StoreService extends BaseApplicationService implements IStoreService {
    private readonly _storeTablesCacheKey = "StoreTables";

    private readonly _storeInfoR: IRepository<StoreInfo, string>;
    private readonly _storeTableAreas: IRepository<TableAreas, string>;
    private readonly _urls = {
        "StoreInfo": "IStores/storeInfo"
    };

    constructor() {
        super();
        this.Cache.AddCache(new AddCacheDto(this._storeTablesCacheKey, null, 0)); //门店桌台信息不更新

        this._storeInfoR = RepositoryFactory.GetRepositoryInstance(StoreInfo);
        this._storeTableAreas = RepositoryFactory.GetRepositoryInstance(TableAreas);
    }


    private GetFullUrl(url: string) {
        return `${this.GlobalUrl.CloudStoreApi}${url}`;
    }


    GetBrandStoreInfo(data?: { storeId?: number, brandId?: number, refreshCache?: boolean }): Promise<StoreInfo | null> {
        console.warn("请不要使用这个接口,移步 [GetBrandStoreinfoByApi]");
        return Promise.reject();
        // let storeInfo = this.GetStoreInfo();
        // let storeId = storeInfo ? storeInfo.storeId : "";
        // if (data && data.storeId)
        //     storeId = data.storeId;

        // let query = new EsQuery({
        //     Filter: {
        //         id: storeId
        //     },
        //     Select: ["store_id", "brand_id", "id", "name", "brand_name", "maling_global", "maling_rules", "maling_rules_name", "pay_mode", "pay_mode_name", "status"],
        //     Size: 1
        // });
        // return this._storeInfoR.GetAll(query).then((res: any) => {
        //     if (res.data && res.data.length > 0) {

        //         let data = res.data[0];
        //         let fullStoreInfo = new StoreInfo(data.id, data.name);

        //         fullStoreInfo.brandId = Number(data.brand_id);
        //         fullStoreInfo.brandName = data.brand_name;

        //         fullStoreInfo.molingGlobal = data.maling_global;
        //         fullStoreInfo.molingRuleName = data.maling_rules_name;
        //         fullStoreInfo.molingRules = data.maling_rules;

        //         fullStoreInfo.payMode = data.pay_mode;
        //         fullStoreInfo.payModeName = data.pay_mode_name;

        //         if ((!data || !data.storeId) || (data && data.refreshCache)) {
        //             //更新门店信息 和品牌信息
        //             this.ConfigCenter.SetStoreInfo(fullStoreInfo);
        //             let brandInfo = new BrandInfo(fullStoreInfo.brandId, fullStoreInfo.brandName);
        //             this.ConfigCenter.SetBrandInfo(brandInfo);
        //         }
        //         return fullStoreInfo;
        //     }
        //     return null;
        // });
    }

    GetBrandStoreinfoByApi(data?: { storeId?: number, brandId?: number, refreshCache?: boolean }): Promise<StoreInfo | null> {
        let url = this.GetFullUrl(this._urls.StoreInfo);

        let brandId: number | string;
        let storeId: number | string;
        if (data && data.storeId && data.brandId) {
            brandId = data.brandId;
            storeId = data.storeId;
        }
        else {
            brandId = "#";
            storeId = "#";
        }
        let reqData = { "brandId": brandId, "storeId": storeId };

        let that = this;
        return this.Request.Request("POST", url, { p: reqData }).then((res: any) => {
            if (res && res.result.message == "") {
                console.log(res.result.data);
                let data = res.result.data;
                let fullStoreInfo = new StoreInfo(data.id, data.name);
                fullStoreInfo._id = "FullData";
                fullStoreInfo.brandId = Number(data.brandId);
                fullStoreInfo.brandName = data.brandName;

                fullStoreInfo.molingGlobal = data.malingGlobal;
                fullStoreInfo.molingRuleName = data.malingRulesName;
                fullStoreInfo.molingRules = data.malingRules;

                fullStoreInfo.payMode = data.payMode;
                fullStoreInfo.payModeName = data.payModeName;

                fullStoreInfo.tableCount = data.tablecount;


                //构建品牌名称
                let oldBrandInfo = that.GetBrandInfo();
                if (oldBrandInfo && oldBrandInfo.brandName && !fullStoreInfo.brandName)
                    fullStoreInfo.brandName = oldBrandInfo.brandName;


                if ((!data || !data.storeId || !data.brandId) || (data && data.refreshCache)) {
                    //更新门店信息 和品牌信息
                    this.ConfigCenter.SetStoreInfo(fullStoreInfo);
                    let brandInfo = new BrandInfo(fullStoreInfo.brandId, fullStoreInfo.brandName);
                    this.ConfigCenter.SetBrandInfo(brandInfo);
                }
                return fullStoreInfo;
            }
            return null;
        });
    }

    GetStoreTables(): Promise<any> {
        let that = this;

        let getCacheInput = new GetCacheInput(this._storeTablesCacheKey, function () {
            let query = new EsQuery({
                Filter: {
                    brandId: "#",
                    storeId: "#"
                },
                Size: 1
            })
            return that._storeTableAreas.GetAll(query).then((res: any) => {
                let areaInfo = res.data[0];
                let tableArr = [];
                console.log(areaInfo);
                if (areaInfo && areaInfo.areas && areaInfo.areas.length > 0) {
                    //设置了桌号
                    for (let index = 0; index < areaInfo.areas.length; index++) {
                        const element = areaInfo.areas[index];
                        let tempTableNum = 0;
                        for (let deskId = 0; deskId < element.count; deskId++) {
                            tempTableNum++;

                            //开启了幸运数字
                            if (areaInfo.luckyNumber && (tempTableNum + "").indexOf('4') > -1)
                                tempTableNum++;

                            let tureDeskId = element.name + tempTableNum;
                            let obj = {
                                deskId: tureDeskId,
                                deskAlias: '',
                                areaName: element.name
                            };

                            //构建桌台别名
                            if (element.alias) {
                                let deskAlias = element.alias[tureDeskId];
                                if (deskAlias && deskAlias.value)
                                    obj.deskAlias = deskAlias.value;
                            }

                            tableArr.push(obj);
                        }

                    }
                } else {
                    const tableCount = that.GetStoreInfo().tableCount;
                    let tempTableNum = 1;
                    while (true) {
                        //开启了幸运数字
                        if (areaInfo.luckyNumber && (tempTableNum + "").indexOf('4') > -1)
                            tempTableNum++;

                        let obj = { deskId: tempTableNum, deskAlias: '', areaName: 'all' };
                        tableArr.push(obj);

                        if (tableArr.length >= tableCount)
                            break;

                        tempTableNum++;
                    }
                }
                return tableArr.length > 0 ? tableArr : null;
            });
        });

        let result = that.GetResult();
        return this.Cache.GetCacheAsync(getCacheInput).then((res: any) => {
            result.success = true;
            result.data = res;
            return result;
        });
    }

    GetImplementsService(): string {
        return "IStoreService";
    }

}