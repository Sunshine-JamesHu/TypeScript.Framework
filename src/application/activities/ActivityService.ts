import { BaseApplicationService } from "../BaseApplicationService";
import { IActivityService } from "./IActivityService";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { Common } from "../../core/common/Common";
import { IntegralRule } from "../../core/entities/activities/IntegralRule";
import { IRepository } from "../../core/repository/IRepository";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";
import { EsQuery } from "../../core/repository/dtos/EsQuery";
import { ICouponService } from "../coupons/ICouponService";
import { ApplicationServiceFactory } from "../ApplicationServiceFactory";
import { IBrandService } from "../brands/IBrandService";
import { IMemberService } from "../members/IMemberService";
import { VirtualOrder } from "../../core/entities/orders/VirtualOrder";


export class ActivityService extends BaseApplicationService implements IActivityService {
    private readonly _cacheKey = "Actitvity";
    private readonly _urls = {
        Login: 'IActives',
    };

    private readonly _integralRuleR: IRepository<IntegralRule, string>;
    private readonly _rVirtualOrder: IRepository<VirtualOrder, string>;

    private readonly _couponS: ICouponService;
    private readonly _brandS: IBrandService;
    private readonly _memberS: IMemberService
    constructor() {
        super();
        this._integralRuleR = RepositoryFactory.GetRepositoryInstance<IntegralRule, string>(IntegralRule);
        this._rVirtualOrder = RepositoryFactory.GetRepositoryInstance<VirtualOrder, string>(VirtualOrder);

        this._couponS = ApplicationServiceFactory.GetServiceInstance("ICouponService");
        this._brandS = ApplicationServiceFactory.GetServiceInstance("IBrandService");
        this._memberS = ApplicationServiceFactory.GetServiceInstance("IMemberService");
    }


    private GetFullUrl(url: string) {
        return this.GlobalUrl.CloudStoreApi + url;
    }

    GetActivityByType(input: { type: number; }): Promise<any> {
        let url = this.GetFullUrl(this._urls.Login);
        let storeInfo = this.GetStoreInfo();
        let brandInfo = this.GetBrandInfo();
        let dataObj = new Date();
        let reqData = {
            filter: {
                where: {
                    and: [
                        // { brandId: '#' },
                        { brandId: brandInfo.brandId },
                        { activeType: input.type },
                        { startTime: { lt: dataObj.getTime() } },
                        { endTime: { gt: dataObj.getTime() } },
                        { status: 1 },
                        { or: [{ storeId: { like: '%' + storeInfo.storeId + '%' } }, { storeAll: 1 }] }
                    ]
                }
            }
        };
        // console.log("请求数据", reqData);
        return this.Request.Request("GET", url, reqData);
    }

    GetSpecialOffer(): Promise<any> {
        let cacheKey = `${this._cacheKey}_${60}`;
        let that = this;
        let getCacheInput = new GetCacheInput(cacheKey, function () {
            return that.GetActivityByType({ type: 60 }).then((res: any) => {
                if (res && res.length) {
                    let date = new Date();
                    let day = date.getDay() === 0 ? 7 : date.getDay();

                    let specialOfferList: { [key: string]: any } = {};
                    res.forEach((element: any) => {
                        let times = element.times ? JSON.parse(element.times) : [];
                        let isValid = times.find((time: any) => {
                            let startTime = new Date(time.start);
                            let endTime = new Date(time.end);
                            let isStart, isEnd;
                            // console.log("BBB", date.getHours(), endTime.getHours(), startTime.getHours());
                            if (startTime.getHours() <= date.getHours() && endTime.getHours() > date.getHours()) {
                                return true;
                            }

                            if (startTime.getHours() == date.getHours()) {
                                // 活动是否开始中
                                isStart = startTime.getMinutes() < date.getMinutes()
                            }

                            if (endTime.getHours() == date.getHours()) {
                                // 活动是否结束了
                                isEnd = endTime.getMinutes() < date.getMinutes()
                            }
                            return isStart && !isEnd;
                        });

                        //判断活动今天是不是开启的。
                        if (element.week.indexOf(day) > -1 && isValid) {
                            let rules = JSON.parse(element.config);
                            // console.log("rules", rules);
                            rules.forEach((rule: any) => {
                                if (rule.productsList) {
                                    rule.productsList.forEach((p: any) => {
                                        let pk = p.id + '_' + p.scaleId;
                                        specialOfferList[pk] = {
                                            id: element.id,
                                            typeName: element.activeTypeName,
                                            type: element.activeType,
                                            key: pk,
                                            name: element.name,
                                            price: rule.priceLimit
                                        }
                                    });
                                }
                            });
                        }
                    });
                    return specialOfferList;
                }
                return {};
            });
        });
        return that.Cache.GetCacheAsync(getCacheInput);
    }

    //#####  充值返利 或者 充值送券  是不是合并一下  #####
    GetRechargeForCoupon(): Promise<any> {
        //没有缓存  
        let that = this;
        return this.GetActivityByType({ type: 1 }).then((res: any) => {
            if (res && res.length > 0) {
                let activities: any[] = [];
                let couponIds: any[] = [];
                for (let index = 0; index < res.length; index++) {
                    const element = res[index];
                    if (element.config && element.config != "") {
                        let coupons = JSON.parse(element.config);
                        console.log(coupons)
                        coupons.forEach((coupon: any) => {
                            let obj = {
                                id: element.id,
                                status: element.status,
                                startAmount: coupon.startAmount,
                                coupons: coupon.couponId,
                                activeType: element.activeType,
                                activeTypeName: element.activeTypeName,
                                name: element.name
                            };

                            let couponIdList = coupon.couponId.map((coupon: any) => coupon.couponId);
                            couponIds = couponIds.concat(couponIdList);
                            activities.push(obj);
                        });

                    }
                }
                console.log(couponIds)
                return that._couponS.GetCouponInfoByIds(couponIds).then((couponRes: any) => {
                    couponRes.forEach((coupon: any) => {
                        for (let active of activities) {

                            for (let couponList of active.coupons) {

                                if (couponList.couponId == coupon.id) {
                                    couponList.couponInfo = coupon;
                                }
                            }

                        }
                    })
                    return activities;
                });
            }
            return [];
        });
    }

    GetRechargeForCash(): Promise<any> {
        return this.GetActivityByType({ type: 30 }).then((res: any) => {
            if (res && res.length > 0) {
                let activities: any[] = [];
                for (let index = 0; index < res.length; index++) {
                    const element = res[index];
                    if (element.config && element.config != "") {
                        let rules = JSON.parse(element.config);
                        rules.forEach((rule: any) => {
                            let obj = {
                                id: element.id,
                                status: element.status,
                                startAmount: rule.startAmount,
                                balance: Number(rule.balance),
                                activeType: element.activeType,
                                activeTypeName: element.activeTypeName,
                                name: element.name
                            };
                            activities.push(obj);
                        });
                    }
                }
                return activities;
            }
            return [];
        });
    }

    GetRechangeLevel(): Promise<any> {
        return this.Request.All([
            this._brandS.GetBrandGrades(),
            this.GetActivityByType({ type: 31 })
        ]).then((res: any) => {
            if (res && res.length > 0) {
                let gradeInfo = res[0];
                let active = res[1];

                console.log("gradeInfo", gradeInfo);

                let activities: any[] = [];
                for (let index = 0; index < active.length; index++) {
                    const element = active[index];
                    if (element.config && element.config != "") {
                        let rules = JSON.parse(element.config);
                        rules.forEach((rule: any) => {
                            let obj = {
                                id: element.id,
                                status: element.status,
                                amount: Number(rule.quota),
                                gradeId: Number(rule.gradeId),
                                gradeName: '',
                                activeType: element.activeType,
                                activeTypeName: element.activeTypeName,
                                name: element.name,

                            };

                            let thisGrade = gradeInfo.data.filter((p: any) => p.id == obj.gradeId)[0];
                            if (thisGrade)
                                obj.gradeName = thisGrade.name;

                            activities.push(obj);
                        });
                    }
                }
                console.log(activities)
                return activities;
            }
            return [];
        });
    }

    GetCouponPackage(): Promise<any> {
        let that = this;
        return this.GetActivityByType({ type: 32 }).then((res: any) => {
            if (res && res.length > 0) {
                let activities: any[] = [];
                let couponIds: any[] = [];
                for (let index = 0; index < res.length; index++) {
                    const element = res[index];
                    if (element.config && element.config != "") {
                        let rule = JSON.parse(element.config);
                        let coupons = JSON.parse(element.couponId);

                        let couponList = coupons.map((p: any) => p.couponId) as string[];
                        couponIds = couponIds.concat(couponList); //用来获取详情

                        let couponMap = Common.GroupBy(coupons, "couponId");

                        let obj = {
                            id: element.id,
                            status: element.status,
                            activeType: element.activeType,
                            activeTypeName: element.activeTypeName,
                            name: element.name,

                            startTime: element.startTime,
                            endTime: element.endTime,

                            price: rule.price,
                            vOrderId: rule.vorderId,
                            coupons: couponMap,
                        };
                        activities.push(obj);
                    }
                }
                return that._couponS.GetCouponInfoByIds(couponIds).then((couponRes: any) => {
                    activities.forEach((element: any) => {
                        for (const key in element.coupons) {
                            if (element.coupons.hasOwnProperty(key)) {
                                const couponInfo = element.coupons[key];
                                if (couponInfo) {
                                    element.coupons[key] = {
                                        couponId: key,
                                        info: couponRes.filter((p: any) => p.id == key)[0],
                                        count: couponInfo.length
                                    }
                                }
                            }
                        }
                    });
                    return activities;
                });
            }
            return [];
        });
    }

    GetIntegralRule(): Promise<IntegralRule | null> {
        let query = new EsQuery({
            Filter: { brandId: "#" }
        });
        return this._integralRuleR.GetAll(query).then((res: any) => {
            if (res.data.length < 1)
                return null;
            return res.data[0];
        });
    }

    /**
     * 注册送券活动
     */
    GetRegisterForCoupon(): Promise<any> {
        //没有缓存  
        let that = this;
        return this.GetActivityByType({ type: 8 }).then((res: any) => {
            if (res && res.length > 0) {
                let activities: any[] = [];
                let couponIds: any[] = [];
                for (let index = 0; index < res.length; index++) {
                    const element = res[index];
                    if (element.couponId && element.couponId != "") {
                        let coupons = JSON.parse(element.couponId);
                        let obj = {
                            id: element.id,
                            status: element.status,
                            coupons: coupons,
                            activeType: element.activeType,
                            activeTypeName: element.activeTypeName,
                            name: element.name
                        };
                        couponIds = couponIds.concat(coupons.map((p: any) => p.couponId));
                        activities.push(obj);
                    }
                }
                console.log(couponIds);
                return that._couponS.GetCouponInfoByIds(couponIds).then((couponRes: any) => {
                    for (let active of activities) {
                        console.log(active.coupons);
                        let couponGroups = Common.GroupBy(active.coupons, "couponId", 1);
                        let couponLists = [];
                        for (let couponList of couponGroups) {
                            couponLists.push({
                                count: couponList.length,
                                couponId: couponList[0].couponId,
                                info: couponRes.filter((p: any) => p.id == couponList[0].couponId)[0]
                            });
                        }
                        active.coupons = couponLists;
                    }
                    return activities;
                });
            }
            return [];
        });
    }

    GetOpenMemberData(): Promise<any> {
        let query = new EsQuery({
            Filter: {
                brandId: "#",
                "base.status": 1,
                "base.type": "openmember"
            },
            Size: 1
        });
        return this._rVirtualOrder.GetAll(query).then((res: any) => {
            if (res.data && res.data.length > 0) {
                let data = res.data[0];
                return data;
            }
            else
                return null;
        });
    }

    GetImplementsService(): string {
        return "IActivityService";
    }
}


