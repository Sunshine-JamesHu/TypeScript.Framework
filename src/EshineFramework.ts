import { ICache } from "./core/cache/ICache";
import { MemoryCache } from "./core/cache/Cache";
import { ConfigCenter, GlobalUrlInfo } from "./core/config/ConfigCenter";
import { BrandInfo } from "./core/entities/brands/BrandInfo";
import { IRequest } from "./core/request/IRequest";
import { RepositoryFactory } from "./core/repository/RepositoryFactory";
import { MemberService } from "./application/members/MemberService";
import { ApplicationServiceFactory } from "./application/ApplicationServiceFactory";
import { IMemberService } from "./application/members/IMemberService";
import { ProductService } from "./application/products/ProductService";
import { IProductService } from "./application/products/IProductService";
import { Product } from "./core/entities/products/Product";
import { SysInfo } from "./core/entities/systems/SysInfo";
import { BrandService } from "./application/brands/BrandService";
import { IBrandService } from "./application/brands/IBrandService";
import { ProductType } from "./core/entities/productTypes/ProductType";
import { IProductTypeService } from "./application/productTypes/IProductTypeService";
import { ProductTypeService } from "./application/productTypes/ProductTypeService";
import { ActivityService } from "./application/activities/ActivityService";
import { IActivityService } from "./application/activities/IActivityService";
import { ShoppingCartService } from "./application/shoppingCarts/ShoppingCartService";
import { IShoppingCartService } from "./application/shoppingCarts/IShoppingCartService";
import { ProductDto } from "./application/shoppingCarts/dtos/ProductDto";
import { OrderService } from "./application/orders/OrderService";
import { IOrderService } from "./application/orders/IOrderService";
import { RefundProduct } from "./core/entities/products/RefundProduct";
import { FreeProduct } from "./core/entities/products/FreeProduct";
import { IntegralRule } from "./core/entities/activities/IntegralRule";
import { LimitSaleProduct } from "./core/entities/products/LimitSaleProduct";
import { Order } from "./core/entities/orders/Order";
import { DiscountService } from "./application/discounts/DiscountService";
import { IDiscountService } from "./application/discounts/IDiscountService";
import { CouponRule } from "./core/entities/coupons/CouponRule";
import { CouponService } from "./application/coupons/CouponService";
import { ICouponService } from "./application/coupons/ICouponService";
import { StoreInfo } from "./core/entities/stores/StoreInfo";
import { IStoreService } from "./application/stores/IStoreService";
import { StoreService } from "./application/stores/StoreService";
import { BehaviorLog } from "./core/entities/behaviorLogs/BehaviorLog";
import { OrderLog } from "./core/entities/behaviorLogs/OrderLog";
import { VirtualOrder } from "./core/entities/orders/VirtualOrder";
import { OrderBillStatus } from "./core/entities/orders/OrderBillStatus";
import { TemporaryOrder } from "./core/entities/orders/TemporaryOrder";
import { TableAreas } from "./core/entities/stores/TableAreas";
import { VoucherPayment } from "./core/entities/payments/VoucherPayment";
import { PaymentService } from "./application/payments/PaymentService";
import { IPaymentService } from "./application/payments/IPaymentService";
import { Subscriber } from "./core/subscriber/Subscriber";
import { CookbookCategory } from "./core/entities/cookbooks/CookbookCategory";
import { OrderVoucher } from "./core/entities/orders/OrderVoucher";
import { TopProduct } from "./core/entities/products/TopProduct";
import { KitchenPrintTask } from "./core/entities/kitchenPrintTask/KitchenPrintTask";




export class EshineFramework {
    private _HttpRequest: IRequest;
    public get HttpRequest(): IRequest {
        return this._HttpRequest;
    }


    private _Cache: ICache;
    public get Cache(): ICache {
        return this._Cache;
    }

    private _ConfigCenter: ConfigCenter;
    public get ConfigCenter(): ConfigCenter {
        return this._ConfigCenter;
    }

    public readonly Service: { [key: string]: any };


    private _NchanSubscriberEnable: boolean = false;
    public get NchanSubscriberEnable(): boolean {
        return this._NchanSubscriberEnable;
    }


    constructor(config?: { GlobalUrlInfo?: GlobalUrlInfo, Request?: IRequest, EsClient?: any, Cache?: ICache }) {
        console.log("=== 框架初始化开始 ===");
        let now = new Date().getTime();
        this.Service = {};
        this._Cache = {} as ICache;
        this._HttpRequest = {} as IRequest;


        // 配置中心
        this._ConfigCenter = ConfigCenter.GetInstance();

        // 请求源
        if (config && config.Request)
            this.SetRequest(config.Request);

        // 业务级缓存
        if (config && config.Cache)
            this.SetCache(config.Cache);
        else
            this.SetCache();

        // 全局请求BaseUrl
        if (config && config.GlobalUrlInfo)
            this.SetGlobalUrl(config.GlobalUrlInfo);

        // 设置EsClient
        if (config && config.EsClient)
            this.SetEsClient(config.EsClient);

        console.log("=== 框架初始化结束 ===");
        console.log(`=== 框架初始化耗时【${new Date().getTime() - now}ms】 ===`);
    }

    //初始化订阅发布
    public InitializationNchanSubscriber() {
        let subIns = Subscriber.GetInstance();
        subIns.SubProductStatusChange(); //开启商品变化监听

        this._NchanSubscriberEnable = true;
    }



    //初始化仓储
    private InitializationRepository() {

        RepositoryFactory.CreateRepositoryInstance<StoreInfo, string>(StoreInfo); //门店

        RepositoryFactory.CreateRepositoryInstance<ProductType, string>(ProductType); //商品类型

        RepositoryFactory.CreateRepositoryInstance<Product, string>(Product); //商品 

        RepositoryFactory.CreateRepositoryInstance<LimitSaleProduct, string>(LimitSaleProduct); //限售商品

        RepositoryFactory.CreateRepositoryInstance<RefundProduct, string>(RefundProduct); //退款

        RepositoryFactory.CreateRepositoryInstance<FreeProduct, string>(FreeProduct); //赠菜

        RepositoryFactory.CreateRepositoryInstance<IntegralRule, string>(IntegralRule); //积分规则

        RepositoryFactory.CreateRepositoryInstance<CouponRule, string>(CouponRule); //优惠券使用规则

        RepositoryFactory.CreateRepositoryInstance<Order, string>(Order); //订单

        RepositoryFactory.CreateRepositoryInstance<OrderLog, string>(OrderLog); //订单日志

        RepositoryFactory.CreateRepositoryInstance<VirtualOrder, string>(VirtualOrder); //虚拟订单

        RepositoryFactory.CreateRepositoryInstance<OrderBillStatus, string>(OrderBillStatus); //订单待结账状态

        RepositoryFactory.CreateRepositoryInstance<TemporaryOrder, string>(TemporaryOrder); // 多人点餐

        RepositoryFactory.CreateRepositoryInstance<TableAreas, string>(TableAreas); // 多人点餐

        RepositoryFactory.CreateRepositoryInstance<VoucherPayment, string>(VoucherPayment); // 多人点餐

        RepositoryFactory.CreateRepositoryInstance<CookbookCategory, string>(CookbookCategory); // 后厨打印端口

        RepositoryFactory.CreateRepositoryInstance<OrderVoucher, string>(OrderVoucher); // 后厨打印端口

        RepositoryFactory.CreateRepositoryInstance<TopProduct, string>(TopProduct); // 热销榜

        RepositoryFactory.CreateRepositoryInstance<KitchenPrintTask, string>(KitchenPrintTask); // 打印任务池

    }

    //初始化服务Service
    private InitializationServices() {

        //PS:重要 重要 重要
        //下面的服务挂在请注意顺序,如果有依赖某一个服务的话，先挂载依赖的服务;

        //门店服务
        let storeService = ApplicationServiceFactory.RegisterServiceInstance<StoreService, IStoreService>(StoreService);
        this.Service["IStoreService"] = storeService;

        //商品类型服务
        let productTypeService = ApplicationServiceFactory.RegisterServiceInstance<ProductTypeService, IProductTypeService>(ProductTypeService);
        this.Service["IProductTypeService"] = productTypeService;

        //优惠券服务
        let couponService = ApplicationServiceFactory.RegisterServiceInstance<CouponService, ICouponService>(CouponService);
        this.Service["ICouponService"] = couponService;

        //用户服务
        let memberService = ApplicationServiceFactory.RegisterServiceInstance<MemberService, IMemberService>(MemberService);
        this.Service["IMemberService"] = memberService;

        // 商家服务
        let brandService = ApplicationServiceFactory.RegisterServiceInstance<BrandService, IBrandService>(BrandService);
        this.Service["IBrandService"] = brandService;

        //活动服务
        let activityService = ApplicationServiceFactory.RegisterServiceInstance<ActivityService, IActivityService>(ActivityService);
        this.Service["IActivityService"] = activityService;

        //商品服务
        let productService = ApplicationServiceFactory.RegisterServiceInstance<ProductService, IProductService>(ProductService);
        this.Service["IProductService"] = productService;

        //购物车服务
        let shoppingCartService = ApplicationServiceFactory.RegisterServiceInstance<ShoppingCartService, IShoppingCartService>(ShoppingCartService);
        this.Service["IShoppingCartService"] = shoppingCartService;

        //订单服务
        let orderService = ApplicationServiceFactory.RegisterServiceInstance<OrderService, IOrderService>(OrderService);
        this.Service["IOrderService"] = orderService;

        //订单优惠服务
        let discountService = ApplicationServiceFactory.RegisterServiceInstance<DiscountService, IDiscountService>(DiscountService);
        this.Service["IDiscountService"] = discountService;

        //订单优惠服务
        let paymentService = ApplicationServiceFactory.RegisterServiceInstance<PaymentService, IPaymentService>(PaymentService);
        this.Service["IPaymentService"] = paymentService;
    }

    //初始化框架
    public InitializationFramework(data: { channle: { name: string, type: string }, brandInfo?: BrandInfo, storeInfo?: StoreInfo, sysInfo?: SysInfo }) {

        if (data.brandInfo)
            this.SetBrandInfo(data.brandInfo);

        if (data.storeInfo)
            this.SetStoreInfo(data.storeInfo);

        if (data.sysInfo)
            this.SetSysInfo(data.sysInfo);

        //设置框架使用者
        this.ConfigCenter.SetChannleInfo(data.channle);
    }

    //设置登录人信息
    public SetSysInfo(sysInfo: SysInfo) {
        this.ConfigCenter.SetSysInfo(sysInfo);
    }

    //设置门店信息
    public SetStoreInfo(storeInfo: StoreInfo) {
        this.ConfigCenter.SetStoreInfo(storeInfo);
        let sysInfo = this.ConfigCenter.GetSysInfo();
        if (sysInfo && sysInfo.token && sysInfo.token.token) {
            let storeService = <IStoreService>this.Service.IStoreService;
            storeService.GetBrandStoreinfoByApi(); //去服务器拿取完整的门店数据
        }
    }

    //设置品牌信息
    public SetBrandInfo(brandInfo: BrandInfo) {
        this.ConfigCenter.SetBrandInfo(brandInfo);
    }

    //设置请求方式
    public SetRequest(request: IRequest) {
        this._HttpRequest = request;
        this.ConfigCenter.SetRequestInstance(request);
    }

    //设置全局Url
    public SetGlobalUrl(urlInfo: GlobalUrlInfo) {
        this.ConfigCenter.SetGlobalUrl(urlInfo);
        this.InitializationRepository(); //初始化仓储实例
        this.InitializationServices(); //初始化所有服务
    }

    //设置业务缓存
    public SetCache(cache?: ICache) {
        let busCache = cache;
        if (!cache) {
            busCache = MemoryCache.GetCacheInstance();
        }
        this.ConfigCenter.SetCacheInstance(<ICache>busCache);
        this._Cache = <ICache>busCache;
    }

    //设置EsClient
    public SetEsClient(esClient: any) {
        this.ConfigCenter.SetEsClientInstance(esClient);
    }

    TestStore() {
        let storeService = (<IStoreService>this.Service.IStoreService);
        // storeService.GetBrandStoreInfo().then((res: any) => {
        //     console.log("门店信息", res);
        // });
        storeService.GetStoreTables().then((res: any) => {
            console.log("tablex信息", res);
        });
    }


    TestOrder() {
        let orderId = "4b4d832743c14e78ae7f00d0f414286d";
        // let orderId = "f82c1d99fb9e4062a6f4c8247f06f0c6";

        let orderService = (<IOrderService>this.Service.IOrderService);

        // orderService.UpdateOrderMember({ orderId: orderId, memberId: 0 }).then((res: any) => {
        //     console.log("修改用户", res);
        // });
        // orderService.UpdateWeight({ orderId: orderId, detailId: "53f6d9af5e924a97816afa082fb830f2", weight: 10 }).then((res: any) => {
        //     console.log("修改经书", res);
        // });

        // orderService.CheckPayOrign(orderId).then((res: any) => {
        //     console.log("检查支付", res);
        // });
        // orderService.CheckPay(orderId).then((res: any) => {
        //     console.log("检查支付", res);
        // });

        // orderService.PaySuccessCallBack({
        //     orderId: "db831680df8042de9eb648e152433bff",
        //     vouchers: [{
        //         "id": "eaaf5ebdcb5b48e095cd1aff1c8eaca5",
        //         "name": "面值有小数点，售价有小数点",
        //         "cut": 10
        //     }, {
        //         "id": "eaaf5ebdcb5b48e095cd1aff1c8eaca5",
        //         "name": "面值有小数点，售价有小数点",
        //         "cut": 10
        //     },
        //     //, {
        //     //     "id": "eaaf5ebdcb5b48e095cd1aff1c8eaca5",
        //     //     "name": "面值有小数点，售价有小数点",
        //     //     "cut": 10
        //     // }, {
        //     //     "id": "eaaf5ebdcb5b48e095cd1aff1c8eaca5",
        //     //     "name": "面值有小数点，售价有小数点",
        //     //     "cut": 10
        //     // }, {
        //     //     "id": "ea387a7050c94aa2a7ecd7642dfa0cd7",
        //     //     "name": "面值100，售价90，不可叠加",
        //     //     "cut": 10
        //     // }, {
        //     //     "id": "295646e996304db784bcedf208392cca",
        //     //     "name": "面值为100，售价为89.99",
        //     //     "cut": 10.01
        //     // }, {
        //     //     "id": "295646e996304db784bcedf208392cca",
        //     //     "name": "面值为100，售价为89.99",
        //     //     "cut": 10.01
        //     // }, {
        //     //     "id": "295646e996304db784bcedf208392cca",
        //     //     "name": "面值为100，售价为89.99",
        //     //     "cut": 10.01
        //     // }, {
        //     //     "id": "295646e996304db784bcedf208392cca",
        //     //     "name": "面值为100，售价为89.99",
        //     //     "cut": 10.01
        //     // }, {
        //     //     "id": "295646e996304db784bcedf208392cca",
        //     //     "name": "面值为100，售价为89.99",
        //     //     "cut": 10.01
        //     // }, {
        //     //     "id": "04fa6f309d7c4ae38d0427c1ad201b84",
        //     //     "name": "面值100代金券",
        //     //     "cut": 0
        //     // }, {
        //     //     "id": "b9c36ee90ab04c3b8c7c91b8c716b0b4",
        //     //     "name": "不可,售价0,9.99",
        //     //     "cut": 9.99
        //     // }, {
        //     //     "id": "619586e7ef624de09dfb58efc1fa862b",
        //     //     "name": "售价为0的代金券，售价20",
        //     //     "cut": 20
        //     // }, {
        //     //     "id": "436c1116ccc5441c8d008bbc5c53327d",
        //     //     "name": "面值为9.99，售价0",
        //     //     "cut": 9.99
        //     // }, {
        //     //     "id": "436c1116ccc5441c8d008bbc5c53327d",
        //     //     "name": "面值为9.99，售价0",
        //     //     "cut": 9.99
        //     // }, {
        //     //     "id": "436c1116ccc5441c8d008bbc5c53327d",
        //     //     "name": "面值为9.99，售价0",
        //     //     "cut": 9.99
        //     // }, {
        //     //     "id": "436c1116ccc5441c8d008bbc5c53327d",
        //     //     "name": "面值为9.99，售价0",
        //     //     "cut": 9.99
        //     // }, {
        //     //     "id": "436c1116ccc5441c8d008bbc5c53327d",
        //     //     "name": "面值为9.99，售价0",
        //     //     "cut": 9.99
        //     // }, {
        //     //     "id": "55f20beaa7c04a6680943091f4f96cac",
        //     //     "name": "售价与原价相等的代金券",
        //     //     "cut": 0
        //     // }, {
        //     //     "id": "55f20beaa7c04a6680943091f4f96cac",
        //     //     "name": "售价与原价相等的代金券",
        //     //     "cut": 0
        //     // }, {
        //     //     "id": "55f20beaa7c04a6680943091f4f96cac",
        //     //     "name": "售价与原价相等的代金券",
        //     //     "cut": 0
        //     // }, 
        //     {
        //         "id": "55f20beaa7c04a6680943091f4f96cac",
        //         "name": "售价与原价相等的代金券",
        //         "cut": 0
        //     }]
        // }).then((res: any) => {
        //     console.log(res);
        // });


        // 2068364

        // orderService.GetOrderDetail(orderId).then((res: any) => {
        //     console.log("订单数据", res);
        // });

        // orderService.GetStoreIngOrder().then((res: any) => {
        //     console.log("进行中的订单", res);
        //     let ids = res.data.map((res: any) => res.ordersId);
        //     orderService.GetOrderBillStatus({ orderIds: ids }).then((res: any) => {
        //         console.log("订单状态", res);
        //     });
        // });

        // orderService.GetTemporaryOrders(true).then((res: any) => {
        //     console.log("多人点餐", res);
        // });




        // orderService.GetMemberOrders({ pageIndex: 0, pageSize: 200 }).then((res: any) => {
        //     console.log("用户订单数据", res);
        // });
        // orderService.GetMemberOrdersCount({}).then((res: any) => {
        //     console.log("订单数", res);
        // });



        // let orderR = RepositoryFactory.GetRepositoryInstance<Order, string>(Order);
        // let dsl = new EsQuery({
        //     Filter: {
        //         type: "order",
        //         member_id: "2068356",
        //         brand_id: "#",
        //         store_id: "#",
        //         data_valid: "1",
        //     },
        //     Size: 0
        // });
        // orderR.GetAll(dsl).then((res: any) => {
        //     console.log("订单数", res);
        // });

        // orderService.SaveOrder({
        //     info: {
        //         deskId: "v6",
        //         person: 1
        //     },
        //     products: [
        //         {
        //             "id": "afb78ee2edd94808a1f3a953fe34a2a2",
        //             "scaleId": 0,
        //             "cnt": 1
        //         }
        //     ]
        // }).then((res: any) => {
        //     console.log("保存订单返回", res);
        // });


        // let refundProductR = RepositoryFactory.GetRepositoryInstance<RefundProduct, string>(RefundProduct);
        // let query = new EsQuery({
        //     Filter: {
        //         brandId: "#",
        //         storeId: "#",
        //         ordersId: orderId
        //     }
        // });
        // refundProductR.GetAll(query).then((res: any) => {
        //     console.log("退款数据", res);
        // });

        // let freeProductR = RepositoryFactory.GetRepositoryInstance<FreeProduct, string>(FreeProduct);
        // let query2 = new EsQuery({
        //     Filter: {
        //         brandId: "#",
        //         storeId: "#",
        //         ordersId: orderId
        //     }
        // });
        // freeProductR.GetAll(query2).then((res: any) => {
        //     console.log("赠菜数据", res);
        // });

    }

    Test() {
        // console.log("开始测试....");

        // let sysInfo = new SysInfo(243628, "胡莱莱", "18390928006");
        // this.ConfigCenter.SetSysInfo(sysInfo);

        //测试缓存
        let brandInfo = new BrandInfo(100224, "上海壹向测试");
        this.ConfigCenter.SetBrandInfo(brandInfo);
        let storeInfo = new StoreInfo(300881, "测试数据门店");
        this.ConfigCenter.SetStoreInfo(storeInfo);

        this.ConfigCenter.UpdateBrandInfo(new BrandInfo(100224, "胡莱莱"));

        //测试接口
        let globalUrlInfo = this.ConfigCenter.GetGlobalUrl();
        let url = globalUrlInfo.CloudStoreApi + "IStores";
        let reqData = { filter: { "where": { "brandId": 100224 } } };

        this.HttpRequest.Request("GET", url, reqData).then(res => {
            console.log("单个请求", res);
        });

        let that = this;
        let req = function () {
            return that.HttpRequest.Request("GET", url, reqData).then(res => {
                return res;
            });
        }
        let req2 = req;
        this.HttpRequest.All([req(), req2()]).then(res => {
            console.log("多次请求", res);
        })
    }

    TestMembers() {
        let memberService = (<IMemberService>this.Service.IMemberService);

        // memberService.GetMemberInfo().then((res: any) => {
        //     console.log("会员信息", res);
        // });

        // memberService.GetMemberCoupons().then((res: any) => {
        //     console.log("优惠券", res);
        // });

        // memberService.GetMemberSSoToken().then((res: any) => {
        //     console.log("会员Token", res);
        // });

        // this.Service.IActivityService.GetCouponPackage().then((res: any) => {
        //     console.log("优惠券礼包", res);
        // });

        memberService.CheckMemberPhone("13033182279").then((res: any) => {
            console.log("13033182279", res);
        });
        memberService.CheckMemberPhone("13033182267").then((res: any) => {
            console.log("13033182267", res);
        });
        memberService.GetMemberSSoToken();


        // this.Service.IBrandService.SendMessage("13033182267").then(res => {
        //     console.log("验证吗1", res);
        //  });

        // memberService.MemberLoginByCode("13033182267", "2485").then((res: any) => {
        //     console.log("验证吗2", res);
        // });

        // memberService.BindPhoneForMember("13033182267", "2485").then((res: any) => {
        //     console.log("验证吗2", res);
        // });






        // this.Service.ICouponService.GetCouponInfoByIds(["538", "619", "619", "711", "724", "805"]).then((res: any) => {
        //     console.log(res);
        // });

    }

    TestProduct() {
        // this.Service.IProductService.GetBrandAllProducts({ dataType: 0 }).then((res: any) => {
        //     console.log("商品返回数据", res);
        // });

        // this.Service.IBrandService.GetBrandStores().then((res: any) => {
        //     console.log("品牌返回数据", res);
        // });
        // this.Service.IProductService.GetStoreProducts({ dataType: 0 }).then((res: any) => {
        //     console.log("商品返回数据", res);
        // });
        // this.Service.IProductService.GetStoreProducts({ dataType: 1 }).then((res: any) => {
        //     console.log("商品返回数据", res, res.filter((p: any) => p.type == "zixuan"));
        // });
        // let getCacheDto = new GetCacheInput("AllProducts", function () {
        //     let productR = RepositoryFactory.GetRepositoryInstance<Product, string>(Product);
        //     let query = new EsQuery({
        //         Filter: {
        //             storeId: "all",
        //             type: ["product", "zixuan", "taocan"],
        //             brandId: "#"
        //         },
        //         Size: 1000
        //     });
        //     return productR.GetAll(query).then((res: any) => {
        //         console.log("商品返回数据", res);
        //     });
        // });
        // return this.Cache.GetCacheAsync(getCacheDto);

        // 获取积分list
        // this.Service.IMemberService.GetIntegralList({
        //     page: 1
        // })
        // .then((res: any) => {
        //     console.log(res);
        // })

        // 获取充值明细
        // this.Service.IMemberService.GetAccountLogList({
        //     page: 1
        // })
        // .then( (res: any) => {
        //     console.log(res);
        // })

        // 充值面膜
        // this.Service.IMemberService.ResetPassword({
        //     pwd: '123456'
        // })
        // .then((res: any) => {
        //     console.log(res);
        // })

        // 更新个人资料
        // this.Service.IMemberService.UpdateSex({
        //     sex: '女'
        // })
        //     .then((res: any) => {
        //         console.log(res)
        //     })
        // this.Service.IMemberService.UpDateBirthday({
        //     birthday: '2018-01-01'
        // })
        //     .then((res: any) => {
        //         console.log(res)
        //     })

        // this.Service.IActivityService.GetRechargeForCoupon().then((res: any) => {
        //     console.log('充值升级', res);
        // })

        // this.Service.IProductService.GetStoreCookbookCategory().then((res: any) => {
        //     console.log("打印工位", res);
        // });
        this.Service.IProductService.GetHotSaleProducts().then((res: any) => {
            console.log('热销榜', res);
            console.log(JSON.stringify(res));
        })
    }

    TestProductType() {
        this.Service.IProductTypeService.GetBrandProductTypes().then((res: any) => {
            console.log("商品类型", res);
        });
    }

    TestActivity() {
        this.Service.IActivityService.GetSpecialOffer().then((res: any) => {
            console.log("会员特价", res);
        });

        this.Service.IActivityService.GetRechargeForCoupon().then((res: any) => {
            console.log("充值送券", res);
        });

        this.Service.IActivityService.GetRechargeForCash().then((res: any) => {
            console.log("充值返现", res);
        });

        this.Service.IActivityService.GetCouponPackage().then((res: any) => {
            console.log("优惠券礼包", res);
        });

        this.Service.IActivityService.GetIntegralRule().then((res: any) => {
            console.log("积分规则", res);
        });

        this.Service.IActivityService.GetRegisterForCoupon().then((res: any) => {
            console.log("注册送券", res);
        });

        this.Service.IActivityService.GetOpenMemberData().then((res: any) => {
            console.log("成为会员", res);
        });




    }

    TestShoppingCart() {
        let shoppingCartService = (<IShoppingCartService>this.Service.IShoppingCartService);
        shoppingCartService.InitShoppingCart({ deskId: "A2", deskName: "存在2", memberId: 2068422, person: 5 });
        let product = new ProductDto({
            id: "069878695771477f8b05ac591baeba88",
            type: "zixuan",
            count: 5,
            scaleId: "0",
            kitchen: {},
            subProducts: [
                new ProductDto({
                    id: "166f3cde71f147189d5f6376a613290e",
                    scaleId: "0",
                    count: 1,
                    kitchen: {},
                    groupId: 0,
                    groupName: "哈哈哈",
                }),
                new ProductDto({
                    id: "c3b637a988834d8d828265b0fb4bc137",
                    scaleId: "0",
                    count: 1,
                    groupId: 1,
                    groupName: "哈哈哈1",
                    kitchen: {},
                    components: [{
                        "id": "1be1814598af458d990d1f558b2d490b",
                        "items": [{
                            "id": "fe04f9602a2a4eb5811cd2143712c818",
                            count: 1
                        }]
                    }]
                }),
                new ProductDto({
                    id: "a62c7f636e19408e8e43eb4d5a5afb0b",
                    scaleId: "0",
                    count: 1,
                    kitchen: {},
                    type: "product",
                    name: "吊龙",
                    scaleName: "中份",
                    groupId: 2,
                    groupName: "哈哈哈2",
                }),
                new ProductDto({
                    id: "aced302492b54f808e1449863f15a82a",
                    scaleId: "0",
                    count: 1,
                    kitchen: {},
                    groupId: 2,
                    groupName: "哈哈哈2",
                }),
            ]
        });

        // shoppingCartService.AddProduct(product);

        let product2 = new ProductDto({
            id: "12ffe0827df64dd18806fb905fa3298c",
            scaleId: "0",
            kitchen: {},
            count: 5
        });
        shoppingCartService.AddProduct(product2);

        // let product3 = new ProductDto({
        //     id: "4564783sdse",
        //     name: "胡莱莱",
        //     scaleId: "2",
        //     count: 2,
        //     subProducts: [product, product2]
        // });
        // shoppingCartService.AddProduct(product3);
        // shoppingCartService.DelProduct(product3);
        // shoppingCartService.DelProduct(product3);

        // let saveData = shoppingCartService.GetSaveOrderData();
        // console.log(saveData);
        // let orderService = (<IOrderService>this.Service.IOrderService);
        // // orderService.SaveOrder2(saveData);

        // this.Service.IPaymentService.GetStorePaytypeList().then((res: any) => {
        //     console.log(res);
        // })
        // this.Service.IPaymentService.GetVouchers().then((res: any) => {
        //     console.log(res);
        // })
        this.Service.IOrderService.SwitchPersonDesk("c576ed6ca62142ddba7668e5ad39b3ff", 10).then((res: any) => {
            console.log(res)
        })


    }

    TestDiscount() {
        let orderId = "37438651cb1d4f29960036001342e30d";
        let orderService = (<IOrderService>this.Service.IOrderService);
        let discountService = (<IDiscountService>this.Service.IDiscountService);

        orderService.GetOrderDetail(orderId).then((res: any) => {
            console.log("订单数据", res);
            discountService.GetDiscountInstance(res).then((ss: any) => {
                console.log("优惠数据", ss);
                // ss.UseOrUnUseIntegral();
                // ss.UseOrUnUseIntegral();
                // ss.UseOrUnUseIntegral();
                ss.UseOrUnUseCoupon(ss.memberCoupons[0]);
                let data = ss.GetPayData();

                data.payType = {
                    cash: res.paidFee
                }
                // orderService.PayForOrder(data).then((tt: any) => {
                //     console.log("ttt", tt)
                // });
            });
        });


    }

}
