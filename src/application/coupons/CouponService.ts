import { ICouponService } from "./ICouponService";
import { BaseApplicationService } from "../BaseApplicationService";
import { IRepository } from "../../core/repository/IRepository";
import { CouponRule } from "../../core/entities/coupons/CouponRule";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { EsQuery } from "../../core/repository/dtos/EsQuery";
import { Common } from "../../core/common/Common";

export class CouponService extends BaseApplicationService implements ICouponService {
    private readonly _rCouponRule: IRepository<CouponRule, string>;

    private readonly _couponRuleCacheKey = "CouponRule";

    private readonly _urls = {
        getCoupons: "IMembers/couponList",
        coupons: "ICoupons"
    };

    private GetFullUrl(url: string) {
        return this.GlobalUrl.CloudStoreApi + url;
    }

    constructor() {
        super();
        this._rCouponRule = RepositoryFactory.GetRepositoryInstance<CouponRule, string>(CouponRule);

        this.Cache.AddCache({
            key: this._couponRuleCacheKey,
            data: null,
            timeSpan: 1000 * 60 * 30
        }); // 优惠券规则缓存30分钟
    }

    /**
     * 获取品牌优惠券规则
     */
    GetBrandCouponRule(): Promise<any> {
        let that = this;
        let getCache = new GetCacheInput(this._couponRuleCacheKey, function () {
            let query = new EsQuery({ Filter: { brandId: "#" }, Size: 5 });
            return that._rCouponRule.GetAll(query).then((res: any) => {
                if (res.data.length < 1) {
                    return new CouponRule();
                } else return res.data[0];
            });
        });
        return this.Cache.GetCacheAsync(getCache);
    }

    GetCouponInfoByIds(ids: number[] | string[]): Promise<any> {
        let url = this.GetFullUrl(this._urls.coupons);

        let reqData = {
            filter:
            {
                where:
                {
                    "id": { "inq": Common.Distinct(ids) },
                    "status": 1
                }
            }
        }
        return this.Request.Request("GET", url, reqData);
    }

    GetImplementsService(): string {
        return "ICouponService";
    }

}
