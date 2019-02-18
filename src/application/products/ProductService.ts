import { BaseApplicationService } from "../BaseApplicationService";
import { IProductService } from "./IProductService";
import { IRepository } from "../../core/repository/IRepository";
import { Product } from "../../core/entities/products/Product";
import { EsQuery, EsQueryDsl } from "../../core/repository/dtos/EsQuery";
import { RepositoryFactory } from "../../core/repository/RepositoryFactory";
import { GetCacheInput } from "../../core/cache/dtos/GetCacheInput";
import { AddCacheDto } from "../../core/cache/dtos/AddCacheDto";
import { LimitSaleProduct } from "../../core/entities/products/LimitSaleProduct";
import { CookbookCategory } from "../../core/entities/cookbooks/CookbookCategory";
import { IActivityService } from "../activities/IActivityService";
import { ApplicationServiceFactory } from "../ApplicationServiceFactory";
import { IBrandService } from "../brands/IBrandService";
import { TopProduct } from "../../core/entities/products/TopProduct";

export class ProductService extends BaseApplicationService implements IProductService {
    private readonly _rProduct: IRepository<Product, string>;
    private readonly _rLimitProduct: IRepository<LimitSaleProduct, string>;
    private readonly _rCookbookCategory: IRepository<CookbookCategory, string>;
    private readonly _activeService: IActivityService;
    private readonly _brandService: IBrandService;
    private readonly _topProduct: IRepository<TopProduct, string>;




    private readonly _allProductsCacheKey = "AllProducts";//品牌下所有商品
    private readonly _canSaleProductsCacheKey = "CanSaleProducts";//门店可销售所有商品
    private readonly _discountProductsCacheKey = "DiscountProducts"; //商品特价
    private readonly _extraProductsCacheKey = "ExtraProducts"; //按人数收费商品
    private readonly _rCookbookCategoryCacheKey = "CookbookCategory"; //后厨打印工位


    constructor() {
        super();
        this._rProduct = RepositoryFactory.GetRepositoryInstance<Product, string>(Product);
        this._rLimitProduct = RepositoryFactory.GetRepositoryInstance<LimitSaleProduct, string>(LimitSaleProduct);
        this._rCookbookCategory = RepositoryFactory.GetRepositoryInstance<CookbookCategory, string>(CookbookCategory);
        this._topProduct = RepositoryFactory.GetRepositoryInstance<TopProduct, string>(TopProduct);
        

        this._activeService = ApplicationServiceFactory.GetServiceInstance("IActivityService");
        this._brandService = ApplicationServiceFactory.GetServiceInstance("IBrandService");

        this.Cache.AddCache(new AddCacheDto(this._allProductsCacheKey, null, 0));//不做过期处理
        this.Cache.AddCache(new AddCacheDto(this._canSaleProductsCacheKey, null, 1000 * 60 * 120));//两小时过期时间
        this.Cache.AddCache(new AddCacheDto(this._extraProductsCacheKey, null, 1000 * 60 * 120));//两小时过期时间
        this.Cache.AddCache(new AddCacheDto(this._discountProductsCacheKey, null, 1000 * 60 * 30));//三十分钟刷新优惠
        this.Cache.AddCache(new AddCacheDto(this._rCookbookCategoryCacheKey, null, 0));//三十分钟刷新优惠
    }


    GetBrandAllProducts(data: { dataType?: number }): Promise<Product[] | { [key: string]: Product; }> {
        let query = new EsQuery({
            Filter: {
                storeId: "all",
                type: ["product", "zixuan", "taocan"],
                brandId: "#"
            },
            Size: 1000
        });
        let that = this;
        let getCacheInput = new GetCacheInput(this._allProductsCacheKey,
            function () {
                return that._rProduct.GetAll(query).then((res: any) => {
                    let data: { list: Product[], map: { [key: string]: Product } } = { list: [], map: {} };
                    for (let index = 0; index < res.data.length; index++) {
                        const element = res.data[index];
                        if (element.base && element.base.category) {
                            if (element.base && element.base.category) {
                                data.list.push(element);
                                data.map[element.id] = element;
                            }
                        }
                    }
                    return data;
                });
            });
        return this.Cache.GetCacheAsync(getCacheInput).then((res: any) => {
            if (!data.dataType || data.dataType == 0)
                return res.map;
            return res.list;
        });
    }

    GetHotSaleProducts():Promise<any> {
        let brandInfo = this.ConfigCenter.GetBrandInfo();
        let storeInfo = this.ConfigCenter.GetStoreInfo();
        let query = new EsQueryDsl({
            Query: {
                "bool": {
                    "must": [
                      {
                        "term": {
                          "_id": "B" + brandInfo.brandId,
                        }
                      },
                      {
                        "term": {
                          "enabled": true
                        }
                      }
                    ],
                    "should": [
                      {
                        "term": {
                          "stores": storeInfo.storeId
                        }
                      },
                      {
                        "term": {
                          "allStore": true
                        }
                      }
                    ]
                  }
            },
            Size: 1,
        })

        return this._topProduct.GetAllByDsl(query).then((res: any) => {
            return res.data;
        })
    }
    GetLimitSaleProducts(): Promise<any> {
        let brandInfo = this.ConfigCenter.GetBrandInfo();
        let storeInfo = this.ConfigCenter.GetStoreInfo();
        let query = new EsQueryDsl({
            Query: {
                "bool": {
                    "must": [
                      {
                        "term": {
                          "brandId": brandInfo.brandId,
                        }
                      },
                      {
                        "term": {
                          "storeId": storeInfo.storeId,
                        }
                      },
                      {
                        "term": {
                          "status": 1,
                        }
                      }
                    ],
                    
                  }
            }
        })

        return this._rLimitProduct.GetAllByDsl(query).then((res: any) => {
            return res.data;
        })
    }

    GetStoreProducts(data?: { dataType?: number, refresh?: boolean }): Promise<any[] | { [key: string]: any; }> {
        let that = this;
        let getCacheInput = new GetCacheInput(this._canSaleProductsCacheKey,
            function () {
                let storeInfo = that.GetStoreInfo();
                let storeKey = `storeIds.${storeInfo.storeId}`;
                let storFilterObj: { [key: string]: boolean } = {};
                storFilterObj[storeKey] = true;

                let date = new Date();
                let now = date.getTime();
                let todayWeek = date.getDay() === 0 ? 7 : date.getDay();

                //限购查询
                let limitQuery = new EsQuery({
                    Filter: {
                        brandId: "#",
                        storeId: "#"
                    },
                    Size: 1000
                });

                //商品查询
                let productDsl = new EsQueryDsl({
                    Query: {
                        "and": [
                            { "term": { "brandId": "#" } },
                            // {
                            //     or: [
                            //         {
                            //             "range": {
                            //                 "base.salesTime.startDate": {
                            //                     "lt": now
                            //                 }
                            //             }
                            //         },
                            //         {
                            //             "term": {
                            //                 "base.salesTime.startDate": ""
                            //             }
                            //         }
                            //     ]
                            // },
                            // {
                            //     or: [
                            //         {
                            //             "range": {
                            //                 "base.salesTime.endDate": {
                            //                     "gt": now
                            //                 }
                            //             }
                            //         },
                            //         {
                            //             "term": {
                            //                 "base.salesTime.endDate": ""
                            //             }
                            //         }
                            //     ]
                            // },
                            {
                                or: [
                                    { "term": storFilterObj },
                                    {
                                        "term": {
                                            allStore: true,
                                        }
                                    }
                                ]
                            }

                        ]
                    },
                    Size: 5000
                });

                return that.Request.All([
                    that._rProduct.GetAllByDsl(productDsl),
                    that._rLimitProduct.GetAll(limitQuery),
                    that.GetBrandExtraProducts(),
                    that.GetStoreCookbookCategory(),
                    that.GetProductDiscount(),
                    that._activeService.GetSpecialOffer(),
                    that._brandService.GetBrandGrades()
                ]).then((res: any) => {
                    let products = res[0].data, limitProduct = res[1].data, extraProducts = res[2];
                    let data: { list: any[], map: { [key: string]: any } } = { list: [], map: {} };
                    let kitchens = res[3];
                    let proDiscounts = res[4];
                    let specialOffers = res[5];
                    let brandGrades = res[6].data;
                    // console.log("商品优惠", proDiscounts);
                    // console.log('商品', products);
                    let nowTime = new Date().getTime();
                    //处理普通商品的售罄 和 其他相关数据
                    for (let index = 0; index < products.length; index++) {
                        const element = products[index];

                        if (element.base && element.base.category) {

                            if (element.base.salesTime.startDate != "" && element.base.salesTime.startDate > nowTime) {
                                continue;
                            }


                            if (element.base.salesTime.endDate != "" && element.base.salesTime.endDate < nowTime) {
                                continue;
                            }

                            let storeProductInfo = products.filter((p: any) => (!p.base || !p.base.category) && p.id == element.id)[0];
                            if (storeProductInfo) {
                                //门店数据 替换品牌数据
                                for (let index = 0; index < element.base.scales.length; index++) {
                                    let scale = element.base.scales[index];
                                    let storeScale = storeProductInfo.base.scales.filter((p: any) => p.id == scale.id)[0];
                                    if (storeScale) {
                                        // console.log(storeScale);
                                        scale.price = storeScale.price;
                                    }

                                    //有商品做活动 (商品活动)
                                    if (proDiscounts) {
                                        let key = `${element.id}_${scale.id}`;
                                        let proDiscount = proDiscounts[key];
                                        if (proDiscount && proDiscount.length > 0) {
                                            scale.discountPrice = [];
                                            proDiscount.forEach((dis: any) => {
                                                if (dis.rule) {
                                                    // console.log("找到了商品特价了", dis);
                                                    switch (dis.rule.type) {
                                                        case "discount":
                                                            scale.discountPrice.push(+(dis.rule.val * scale.price).toFixed(2));
                                                            break;
                                                        case "reduce":
                                                            scale.discountPrice.push(+(scale.price - dis.rule.val).toFixed(2));
                                                            break;
                                                        case "limit":
                                                            scale.discountPrice.push(Number(dis.rule.val));
                                                            break;
                                                        default:
                                                            break;
                                                    }
                                                }
                                            });
                                        }
                                    }

                                    //有商品做会员特价 (会员特价)
                                    if (specialOffers) {
                                        let key = `${element.id}_${scale.id}`;
                                        let proDiscount = specialOffers[key];
                                        if (proDiscount && proDiscount.price) {
                                            let memberPrice = [];
                                            // console.log("找到了会员特价", proDiscount);
                                            // console.log(proDiscount, brandGrades);
                                            for (const key in proDiscount.price) {
                                                if (proDiscount.price.hasOwnProperty(key)) {
                                                    const element = proDiscount.price[key];
                                                    const grade = brandGrades.find((p: any) => p.id == key);
                                                    if (grade) {
                                                        memberPrice.push({
                                                            price: element,
                                                            gradeId: key,
                                                            gradeName: grade.name
                                                        });
                                                    }
                                                }
                                            }
                                            scale.memberPrice = memberPrice;
                                            // console.log(scale);
                                        }

                                    }

                                }
                                // element.base.scales = storeProductInfo.base.scales;
                                element.base.salesTime = storeProductInfo.base.salesTime;
                            }

                            //-- 停售限售 status:->  0正常 1沽清 2限制售卖 3手动停售
                            element.onsale = { status: 0, limit: null };

                            //-- 停售
                            if (element.onsaleing) {
                                let sale = element.onsaleing.filter((p: any) => p.storeId == storeInfo.storeId)[0];
                                if (sale)
                                    element.onsale.status = (sale.status == 1 ? 0 : 3);
                            }
                            else element.onsale.status = 0;


                            if (element.base.status && element.base.status.value) {
                                element.onsale.status = element.base.status.value;
                            }

                            //套餐
                            if (element.type == "taocan" || element.type == "zixuan") {
                                element.base.category.id = element.type == "taocan" ? "-1" : "-2";
                                element.base.price = element.base.rule.val;

                                element.base.components = null;
                                element.onsale.status = element.onsale.status == 1 ? 0 : element.onsale.status; //这一句是干嘛的 忘记了

                                //套餐限购
                                if (element.base.limit) {
                                    element.onsale.limit = {
                                        sold: 0,
                                        limit: Number(element.base.limit),
                                        canSaleCount: Number(element.base.limit)
                                    }
                                }

                                //处理套餐商品的加料
                                if (element.type == "taocan" && element.base.productsList && element.base.productsList.length > 0) {
                                    element.base.productsList.forEach((taoCanPro: any) => {
                                        taoCanPro.components = that.CtorTaoCanProComps(taoCanPro);
                                    });
                                }

                                //处理自选套餐的加料
                                if (element.type == "zixuan" && element.base.zixuanProducts && element.base.zixuanProducts.length > 0) {
                                    // console.log("自选", element);
                                    element.base.zixuanProducts.forEach((zixuanPros: any) => {
                                        if (zixuanPros && zixuanPros.productsList && zixuanPros.productsList.length > 0) {
                                            zixuanPros.productsList.forEach((taoCanPro: any) => {
                                                taoCanPro.components = that.CtorTaoCanProComps(taoCanPro);
                                            });
                                        }
                                    });
                                }

                            }
                            else {
                                //普通商品限购
                                if (limitProduct && limitProduct.length > 0) {
                                    let thisLimit = limitProduct.filter((p: any) => p.productId == element.id)[0];
                                    if (thisLimit && thisLimit.limit > 0) {
                                        let canSaleCount = thisLimit.limit - thisLimit.sold;
                                        element.onsale.limit = {
                                            sold: thisLimit.sold,
                                            limit: thisLimit.limit,
                                            canSaleCount: canSaleCount
                                        };
                                        if (canSaleCount < 1)
                                            element.onsale.status = 1;//沽清
                                    }
                                }

                                //构建普通商品的价格
                                if (!element.base.price && element.base.scales && element.base.scales.length > 0) {
                                    element.base.price = element.base.scales[0].price;
                                }
                            }

                            //构建打印工位
                            for (let index = 0; index < kitchens.length; index++) {
                                const kitchen = kitchens[index];
                                if (kitchen.items && kitchen.items.length > 0) {
                                    let item = kitchen.items.find((p: string) => p === element.id);
                                    if (item) {
                                        let maxcount = 1;
                                        if (element.base && element.base.kitchen) {
                                            if (!element.base.kitchen.maxcount || element.base.kitchen.maxcount == "")
                                                maxcount = element.base.kitchen.maxcount;
                                            else
                                                maxcount = element.base.kitchen.maxcount;
                                        }
                                        let kitchenObj = {
                                            categories: [kitchen.id],
                                            maxcount: maxcount,
                                            station: { id: kitchen.id }
                                        };

                                        if (element.base) {
                                            element.base.kitchen = kitchenObj;
                                        }
                                        break;
                                    }
                                }
                            }

                            //有分类  可以单独售卖
                            if (element.base.category.id && element.base.category.id != "" && (element.base.options && element.base.options.individualSalable)) {
                                //今天是该商品的售卖日
                                if (element.base.salesTime.weekdays.indexOf(todayWeek + "") > -1 && element.base.category) {
                                    // console.log(element.base.name, element.onsale.status, element.id);

                                    data.list.push(element);
                                    data.map[element.id] = element;
                                }
                            }
                        }
                    }

                    //单独处理 套餐的售罄规则
                    for (let index = 0; index < data.list.length; index++) {
                        const element = data.list[index];
                        if (element.type == "taocan" || element.type == "zixuan") {
                            if (element.type == "zixuan") {
                                if (element.base.zixuanProducts.length > 0) {

                                    //自选的每一组商品
                                    for (let index = 0; index < element.base.zixuanProducts.length; index++) {
                                        const zixuanPro = element.base.zixuanProducts[index];
                                        let count = 0;
                                        if (zixuanPro) {
                                            //每一组下面的每一个商品
                                            for (let index = 0; index < zixuanPro.productsList.length; index++) {
                                                const pro = data.map[zixuanPro.productsList[index].id];
                                                if (!pro || pro.onsale.status != 0) {
                                                    if (!pro) {
                                                        zixuanPro.productsList[index].onsale = { status: 3, limit: null }; //直接手工停用
                                                    }
                                                    else {
                                                        zixuanPro.productsList[index].onsale = pro.onsale; //主商品的OnSale 替换掉子商品的OnSale
                                                    }
                                                    count++;
                                                }
                                                else {
                                                    zixuanPro.productsList[index].onsale = { status: 0, limit: null }; //直接设置不停用
                                                    let scale = pro.base.scales.filter((p: any) => p.id == zixuanPro.productsList[index].scaleId)[0];
                                                    if (scale) {
                                                        // console.log("scale", scale);
                                                        zixuanPro.productsList[index].scaleName = scale.name;
                                                    }

                                                }
                                            }
                                        }
                                        if (count >= zixuanPro.productsList.length) {
                                            element.onsale.status = 1; //一组全部下架后就不能售卖了
                                            data.map[element.id].onsale.status = 1;
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                if (element.base.productsList.length > 0) {
                                    for (let index = 0; index < element.base.productsList.length; index++) {
                                        const taocanPro = element.base.productsList[index];
                                        const pro = data.map[taocanPro.id];
                                        if (!pro || pro.onsale.status != 0) {
                                            element.onsale.status = 1; //只要有一个不能卖了，套餐就不能售卖了
                                            data.map[element.id].onsale.status = 1;
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                    }

                    //构建按人数收费餐品
                    if (extraProducts && extraProducts.length > 0) {
                        // console.log("extraProducts", extraProducts);
                        products = products.concat(extraProducts)

                        extraProducts.forEach((element: any) => {
                            if (element) {
                                element.base.category = { id: "-3" };
                                element.price = element.base.scales[0].price;
                                element.onsale = { status: 0, limit: null };

                                data.list.push(element);
                                data.map[element.id] = element;
                            }
                        });
                    }

                    return data;
                });
            });

        //是不是需要强制刷新
        if (data && data.refresh) {
            getCacheInput.forceRefresh = data.refresh;
        }

        return this.Cache.GetCacheAsync(getCacheInput).then((res: any) => {
            if (!data || !data.dataType || data.dataType == 0)
                return res.map;
            return res.list;
        });
    }

    private CtorTaoCanProComps(product: any): any[] {
        if (product && product.sComponents) {
            // console.log("taoCanPro", product.exinfo.name);
            let components: { [key: string]: any }[] = [];
            for (const key in product.sComponents) {
                if (product.sComponents.hasOwnProperty(key)) {
                    const sComponent = product.sComponents[key];

                    if (sComponent.sItems) {
                        let component: { id: string, items: any[] } = { id: key, items: [] }
                        for (const itemKey in sComponent.sItems) {
                            if (sComponent.sItems.hasOwnProperty(itemKey)) {
                                const item = sComponent.sItems[itemKey];
                                component.items.push({
                                    count: item.c,
                                    id: item.id,
                                    name: item.name
                                });
                            }
                        }
                        components.push(component);
                    }
                }
            }
            return components;
        }
        return [];
    }

    GetProductDiscount(): Promise<any> {
        let storeInfo = this.GetStoreInfo();
        let dslStoreQuery: any = {};
        let storeKey = "storeIds." + storeInfo.storeId; //#自动映射不上去的所以手写。
        dslStoreQuery[storeKey] = true;

        let date = new Date();
        //这里比较复杂的说,不支持自动映射。。
        let dsl = new EsQueryDsl({
            Query: {
                "and": [
                    { "term": { "brandId": "#" } },
                    { "term": { "storeId": "all" } },
                    { "term": { "base.status.value": 1 } },
                    {
                        "range": {
                            "base.salesTime.endDate": {
                                "gte": date.getTime()
                            }
                        }
                    },
                    {
                        "or": [
                            { "term": { "allStore": true } },
                            { "term": dslStoreQuery }
                        ]
                    },
                    { "term": { "type": "poffer" } }
                ]
            },
            // "sort": [{ "created": { "order": "desc" } }], //TODO:目前还不支持Sort排序 改天加上
            Size: 120
        });

        let that = this;
        let getCacheInput = new GetCacheInput(this._discountProductsCacheKey, function () {
            return that._rProduct.GetAllByDsl(dsl).then((res: any) => {
                // console.log("折扣数据", res);
                if (res && res.data.length > 0) {
                    let result: { [key: string]: any } = {};
                    res.data.forEach((element: any) => {
                        if (element.base.productsList && element.base.productsList.length > 0) {
                            element.base.productsList.forEach((pro: any) => {
                                let key = pro.id + "_" + pro.scaleId;
                                let obj = {
                                    key: key,
                                    productName: pro.exinfo.name,
                                    productId: pro.id,
                                    scaleId: pro.scaleId,
                                    discountId: element.id,
                                    discountName: element.base.name,
                                    rule: element.base.rule
                                }

                                if (result[key])
                                    result[key].push(obj);
                                else
                                    result[key] = [obj];
                            });
                        }
                    });
                    return result;
                }
                return null;
            });
        });
        return this.Cache.GetCacheAsync(getCacheInput);
    }

    GetBrandExtraProducts(): Promise<any> {
        let that = this;
        let getCacheInput = new GetCacheInput(this._extraProductsCacheKey, function () {
            let query = new EsQuery({
                Filter: {
                    brandId: "#",
                    isExtra: "true"
                }
            });
            return that._rProduct.GetAll(query).then((res: any) => {
                return res.data;
            });
        });
        return this.Cache.GetCacheAsync(getCacheInput);
    }

    GetStoreCookbookCategory(data?: { refresh?: boolean }): Promise<any> {
        let that = this;
        let getCacheInput = new GetCacheInput(that._rCookbookCategoryCacheKey, function () {
            let query = new EsQuery({
                Filter: {
                    brandId: "#",
                    storeId: "#"
                },
                Size: 100
            });
            return that._rCookbookCategory.GetAll(query).then((res: any) => {
                // console.log("工位", res);
                return res.data;
            });
        });
        if (data && data.refresh)
            getCacheInput.forceRefresh = data.refresh;

        return this.Cache.GetCacheAsync(getCacheInput);
    }

    //判断是不是Service
    GetImplementsService(): string {
        return "IProductService";
    }

}
