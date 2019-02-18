import { BaseApplicationService } from "../BaseApplicationService";
import { IProductTypeService } from "./IProductTypeService";
import { ProductType } from "../../core/entities/productTypes/ProductType";
import { IRepository } from "../../core/repository/IRepository";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { EsQuery } from "../../core/repository/dtos/EsQuery";
import { AddCacheDto } from "../../core/cache/dtos/AddCacheDto";

export class ProductTypeService extends BaseApplicationService implements IProductTypeService {

    private readonly _rProductType: IRepository<ProductType, string>;
    private readonly _allProductTypesCacheKey = "AllProductTypes";

    constructor() {
        super();
        this._rProductType = RepositoryFactory.GetRepositoryInstance<ProductType, string>(ProductType);
        this.Cache.AddCache(new AddCacheDto(this._allProductTypesCacheKey, null, 1000 * 60 * 120));
    }

    GetBrandProductTypes(): Promise<ProductType[]> {
        let that = this;
        let input = new GetCacheInput(this._allProductTypesCacheKey,
            function () {
                let query = new EsQuery({
                    Filter: {
                        brandId: "#",
                        allStore: true
                    },
                    Size: 100
                });
                return that._rProductType.GetAll(query).then(res => {
                    let data = res.data;

                    //手动加入两个类
                    let taoCanType = { name: "固定套餐", id: "-1", sortIndex: 0, allStore: true } as ProductType;
                    data.push(taoCanType);

                    let zixuanType = { name: "自选套餐", id: "-2", sortIndex: 0, allStore: true } as ProductType;
                    data.push(zixuanType);

                    return data;
                });
            })
        return this.Cache.GetCacheAsync(input);
    }

    GetImplementsService(): string {
        return "IProductTypeService";
    }

}