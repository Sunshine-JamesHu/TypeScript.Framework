import { BaseApplicationService } from "../BaseApplicationService";
import { IOrderService } from "./IOrderService";
import { IRepository } from '../../core/repository/IRepository';
import { RefundProduct } from '../../core/entities/products/RefundProduct';
import { RepositoryFactory } from '../../core/repository/RepositoryFactory';
import { EsQuery } from '../../core/repository/dtos/EsQuery';
import { FreeProduct } from "../../core/entities/products/FreeProduct";
import { SaveOrderDto } from "./dtos/SaveOrderDto";
import { Order } from "../../core/entities/orders/Order";
import { IProductService } from "../products/IProductService";
import { ApplicationServiceFactory } from "../ApplicationServiceFactory";
import { Common } from "../../core/common/Common";
import { OrderBillStatus } from "../../core/entities/orders/OrderBillStatus";
import { TemporaryOrder } from "../../core/entities/orders/TemporaryOrder";
import { OrderVoucher } from "../../core/entities/orders/OrderVoucher";
import { VoucherPayment } from "../../core/entities/payments/VoucherPayment";
import { KitchenPrintTask } from "../../core/entities/kitchenPrintTask/KitchenPrintTask";

export class OrderService extends BaseApplicationService implements IOrderService {
    private readonly _refundProductR: IRepository<RefundProduct, string>;
    private readonly _freeProductR: IRepository<FreeProduct, string>;
    private readonly _orderR: IRepository<Order, string>;
    private readonly _orderBillStatuR: IRepository<OrderBillStatus, string>;
    private readonly _temporaryOrderR: IRepository<TemporaryOrder, string>;
    private readonly _orderVoucherR: IRepository<OrderVoucher, string>;
    private readonly _voucherPaymentR: IRepository<VoucherPayment, string>;
    private readonly _kitchenPrintTaskR: IRepository<KitchenPrintTask, string>;



    private readonly _productS: IProductService;

    private readonly _urls = {
        OrderDetail: 'Orders/getOrdersDetailByStore',
        SaveOrder2: "Orders/save2",
        SaveOrder: "Orders/save",
        MemberOrders: "Orders/getOrdersListByMember",
        PayForOrder: "Payments/payforOrders",
        IngOrders: "Orders/getIngOrders",
        UpdateWeight: "Orders/updateWeight",
        UpdateMemberId: "IOrders/updateOrdersMemberId",
        CheckPay: "PaymentTypes/checkPay",
        CheckPayOrign: "PaymentTypes/checkPayOrign",
        SwitchOrderDesk: 'Orders/updateOrders'
    };

    constructor() {
        super();
        this._refundProductR = RepositoryFactory.GetRepositoryInstance<RefundProduct, string>(RefundProduct);
        this._freeProductR = RepositoryFactory.GetRepositoryInstance<FreeProduct, string>(FreeProduct);
        this._orderR = RepositoryFactory.GetRepositoryInstance<Order, string>(Order);
        this._orderBillStatuR = RepositoryFactory.GetRepositoryInstance<OrderBillStatus, string>(OrderBillStatus);
        this._temporaryOrderR = RepositoryFactory.GetRepositoryInstance<TemporaryOrder, string>(TemporaryOrder);

        this._orderVoucherR = RepositoryFactory.GetRepositoryInstance<OrderVoucher, string>(OrderVoucher);
        this._voucherPaymentR = RepositoryFactory.GetRepositoryInstance<VoucherPayment, string>(VoucherPayment);

        this._kitchenPrintTaskR = RepositoryFactory.GetRepositoryInstance<KitchenPrintTask, string>(KitchenPrintTask);

        this._productS = ApplicationServiceFactory.GetServiceInstance("IProductService");
    }

    private GetFullUrl(url: string) {
        return this.GlobalUrl.CloudOrderApi + url;
    }

    GetStoreIngOrder(): Promise<any> {
        const url = this.GetFullUrl(this._urls.IngOrders);
        let result = this.GetResult();
        return this.Request.Request("POST", url, { storeId: "#" }).then((res: any) => {
            if (res && res.result && res.result.message == "") {
                result.success = true;
                const data = JSON.parse(res.result.data);
                result.data = data.filter((p: any) => p.status === 'Pending');
            }
            else {
                result.message = res.result.message;
            }
            return result;
        });
    }

    GetOrderDetail(orderId: string): Promise<any> {
        let reqData = { brandId: "#", ordersId: orderId };
        let url = this.GetFullUrl(this._urls.OrderDetail);

        return this.Request.All([
            this.Request.Request("POST", url, reqData),
            this.GetOrderRefundPro(orderId),
            this.GerOrderFreePro(orderId),
            this._productS.GetStoreProducts({ dataType: 0 })
        ]).then((res: any) => {
            let orderInfoRes = JSON.parse(res[0].result.data);

            console.log("orderInfoRes", orderInfoRes);
            let orderRefundPros = res[1];
            let orderFreePros = res[2];

            let storePro = res[3];

            //开始构建订单
            //PS:这个对象有很多不需要的字段,以后处理下
            let orderInfo = orderInfoRes.orders;
            orderInfo.originalPrice = Number(orderInfo.originalPrice);
            orderInfo.paidFee = Number(orderInfo.paidFee);
            orderInfo.products = [];

            orderInfo.freePros = orderFreePros; //退菜
            orderInfo.refundPros = orderRefundPros; //赠菜

            //构建子商品
            orderInfoRes.detail.forEach((element: any) => {
                //只构建主商品
                if (element.parentId == "0") {
                    //如果是套餐  应收要等于实收
                    if (element.itemType == 'taocan' || element.itemType == 'zixuan') {
                        element.originalPrice = element.paidFee;
                    }

                    //计算单价
                    let originalPrice = Number(element.originalPrice);
                    if (originalPrice > 0 && element.cnt > 0)
                        element.unitPrice = +(originalPrice / element.cnt).toFixed(2);


                    //计算默认重量
                    if (element.weight && element.weight == '0.100') {
                        if (element.weight == '0.100') {
                            let tempWeight = Number(element.weight);

                            element.originalPrice = ((Number(element.originalPrice) / tempWeight)).toFixed(2);
                            element.paidFee = ((Number(element.paidFee) / tempWeight)).toFixed(2);
                            element.unitPrice = Number(element.originalPrice);

                            element.weight = '0';
                        } else {
                            element.weight = element.weight.toFixed(2);
                        }
                    }

                    this.CtorDetailFreePro(orderFreePros, element, orderInfo.status);
                    this.CtorDetailComponents(orderInfoRes.component, element);

                    //构建子商品
                    let subPros = orderInfoRes.detail.filter((p: any) => p.parentId == element.detailId);
                    if (subPros && subPros.length > 0) {
                        subPros.forEach((subPro: any) => {
                            //子商品的单价
                            let subOriginalPrice = Number(subPro.originalPrice);
                            if (subOriginalPrice > 0 && subPro.cnt > 0)
                                subPro.unitPrice = +(subOriginalPrice / subPro.cnt).toFixed(2);

                            this.CtorDetailFreePro(orderFreePros, subPro, orderInfo.status);
                            this.CtorDetailComponents(orderInfoRes.component, subPro);

                            if (subPro.tips == "换购品") {
                                subPro.subType = "huangou";
                            }
                            else if (element.itemType == "zixuan" || element.itemType == "taocan") {
                                subPro.subType = element.itemType;
                            }
                            else if (subPro.tips == "加料") {
                                subPro.subType = "addon";
                            }
                        });
                        element.products = subPros; //子商品加入主商品中
                    }

                    //构建一些需要计算用到的属性
                    if (element.type != "taocan" && element.type != "zixuan") {
                        let pro = storePro[element.productId];
                        if (pro) {
                            if (pro.isExtra)
                                element.isExtra = true;
                            else if (pro.base.options) {
                                element.options = pro.base.options;
                                element.categoryId = pro.base.category.id;
                            }
                        }
                    }

                    orderInfo.products.push(element);
                }
            });

            //构建成功的订单其他参数
            if (orderInfo.status == "Success") {

                //优惠
                let totalAmount = Common.Sum(orderInfoRes.discount, "discountFee");
                orderInfo.discount = {
                    amount: totalAmount,
                    items: orderInfoRes.tempDiscount,//不分摊的
                    items2: orderInfoRes.discount, //分摊的
                }

                //支付方式
                //TODO:OH Shit 真的垃圾,支付方式的中文名称必须要重新构建
                let payments = orderInfoRes.payment.map((p: any) => {
                    return {
                        status: p.status,
                        payType: p.payType,
                        payTypeName: "现金", //这里以后要构建的
                        totalFee: p.totalFee,
                        ordersId: p.ordersId,
                        memberId: p.memberId,
                        id: p.id,
                        addTime: p.addTime,
                        payTime: p.payTime
                    };
                })
                orderInfo.payments = payments;
            }

            return orderInfo;
        });
    }

    //#############      构建订单详情     ####################
    //构建赠菜数据
    private CtorDetailFreePro(arr: [], element: any, status: string) {
        //如果有赠菜
        if (arr && arr.length > 0) {
            let freePros = arr.filter((p: any) => p.detailId == element.detailId);
            if (freePros && freePros.length > 0 && status !== "Success") {
                let paidFee = Number(element.paidFee);
                let count = element.cnt;

                for (let index = 0; index < freePros.length; index++) {
                    const freePro: any = freePros[index];
                    count -= freePro.cnt;
                    paidFee -= freePro.amount;
                }

                element.paidFee = paidFee + ""; //原始数据是String类型的
                element.cnt = count;
            }
        }
    }
    //构建规格数据(加料等)
    private CtorDetailComponents(arr: [], element: any) {
        if (arr && arr.length > 0)
            element.components = arr.filter((p: any) => p.ordersDetailId == element.detailId);
    }

    //获取订单退款数据
    private GetOrderRefundPro(orderId: string): Promise<any> {
        let query = new EsQuery({
            Filter: {
                brandId: "#",
                storeId: "#",
                ordersId: orderId
            }
        });
        return this._refundProductR.GetAll(query).then(res => { return res.data });
    }
    //获取订单赠菜数据
    private GerOrderFreePro(orderId: string): Promise<any> {
        let query = new EsQuery({
            Filter: {
                brandId: "#",
                storeId: "#",
                ordersId: orderId
            }
        });
        return this._freeProductR.GetAll(query).then(res => { return res.data });
    }
    //#############    End-构建订单详情   ######################


    GetMemberOrders(input: { memberId?: number, status?: string, pageSize: number, pageIndex: number }): Promise<any> {
        if (!input.memberId)
            input.memberId = this.ConfigCenter.GetSysInfo().memberId;
        if (!input.memberId)
            throw new Error("没有MemberId,我很难满足你啊，小伙;");

        if (!input.status)
            input.status = "All";

        if (!input.pageSize)
            input.pageSize = 10;

        let reqData = {
            memberId: input.memberId,
            page: input.pageIndex,
            rp: input.pageSize,
            status: input.status
        };

        let url = this.GetFullUrl(this._urls.MemberOrders);
        return this.Request.Request("POST", url, reqData).then((res: any) => {
            if (res && res.result && res.result.message == "") {
                let data = JSON.parse(res.result.data);
                return data;
            }
            console.error(res.result.message);
            return null;
        });
    }

    GetMemberOrdersCount(input: { memberId?: number }): Promise<number> {
        if (!input.memberId)
            input.memberId = this.ConfigCenter.GetSysInfo().memberId;
        if (!input.memberId)
            throw new Error("没有MemberId,我很难满足你啊，小伙;");

        let dsl = new EsQuery({
            Filter: {
                type: "order",
                member_id: input.memberId,
                brand_id: "#",
                // store_id: "#",
                data_valid: "1"
            },
            Size: 0
        });

        return this._orderR.GetAll(dsl).then((res: any) => {
            return res.total;
        });
    }


    SaveOrder2(orderInfo: any): Promise<any> {
        let sysInfo = this.ConfigCenter.GetSysInfo();
        let storeInfo = this.GetStoreInfo();
        let saveInfo = new SaveOrderDto();
        let channleInfo = this.ConfigCenter.GetChannleInfo();


        //构建品牌
        saveInfo.infos.brandId = "#";
        saveInfo.infos.storeId = "#";

        // 先付费 后付费
        if (storeInfo.payMode && storeInfo.payMode == 0)
            saveInfo.payMode = "pay-first";

        saveInfo.deskType = orderInfo.deskType; //这一句其实没啥卵用
        saveInfo.infos.channleType = channleInfo.name;


        //如果不标识其他的，默认为点餐
        if (!orderInfo.info.ordersType)
            saveInfo.infos.ordersType = "点餐";
        else
            saveInfo.infos.ordersType = orderInfo.info.ordersType;


        //如果有订单，定性为加菜
        if (orderInfo.info.ordersId) {
            saveInfo.infos.ordersId = orderInfo.info.ordersId;
            saveInfo.optype = "update";
            if (orderInfo && orderInfo.info && orderInfo.info.remark)
                saveInfo.infos.memberRemark = orderInfo.info.remark;
        }
        else {
            //是不是用户
            if (sysInfo && sysInfo.isUser) {
                saveInfo.infos.syId = sysInfo.sysId;
                saveInfo.infos.syName = sysInfo.sysName;
            }
            else {
                saveInfo.infos.memberId = sysInfo.memberId;
            }

            if (!orderInfo.info.eatType)
                saveInfo.infos.eatType = "堂食";
            else
                saveInfo.infos.eatType = orderInfo.info.eatType;

            //只有堂食才有桌号
            if (saveInfo.infos.eatType === "堂食") {
                saveInfo.infos.deskId = orderInfo.info.deskId;
                saveInfo.infos.deskAlias = orderInfo.info.deskName;
            }
            else {
                saveInfo.deskType = "牌号";
            }

            if (orderInfo && orderInfo.info && orderInfo.info.remark)
                saveInfo.infos.memberRemark = orderInfo.info.remark;


            saveInfo.infos.subject = `${saveInfo.infos.ordersType}-${storeInfo.storeName}`;
            saveInfo.infos.person = orderInfo.info.person;
        }

        //订单商品
        saveInfo.ordersArray = orderInfo.products;
        let url = this.GetFullUrl(this._urls.SaveOrder2);
        return this.Request.Request("POST", url, saveInfo).then((res: any) => {
            //加入打印池

            if (res && res.result && res.result.message === "" && saveInfo.infos.ordersType === "点餐") {
                //发布打印任务
                this.PubPrintTask({
                    orderId: res.result.data.ordersId,
                    nono: res.result.data.no,
                    deskId: orderInfo.info.deskId,
                    deskAlias: orderInfo.info.deskName,
                    eatType: saveInfo.infos.eatType,
                    ordersArray: saveInfo.ordersArray,
                    channleType: saveInfo.infos.channleType,
                    remark: saveInfo.infos.memberRemark,
                });
            }

            return res.result;
        });
    }

    private PubPrintTask(data: any) {
        if (!data.orderId || !data.nono) {
            console.warn("没有订单orderId或者没有nono");
        }

        let printData = new KitchenPrintTask();
        printData.status = 0;
        printData.startTime = new Date().getTime();
        printData.eatType = data.eatType;
        printData.nono = data.nono;
        printData.deskName = data.deskAlias ? data.deskAlias : data.deskId;
        printData.orderId = data.orderId;
        printData.channleType = data.channleType;
        printData.remark = data.remark;
        printData.products = [];



        data.ordersArray.forEach((element: any) => {
            if (element.type === "taocan") {
                let taocan: any = this.CtorPubPro(element);
                taocan.products = [];

                element.products.forEach((taocanPro: any) => {
                    let pro = this.CtorPubPro(taocanPro);
                    taocan.products.push(pro);
                });

                // @ts-ignore
                printData.products.push(taocan);
            }
            else if (element.type === "zixuan") {
                let zixuan: any = this.CtorPubPro(element);
                zixuan.products = [];

                element.products.forEach((zixuanType: any) => {
                    zixuanType.products.forEach((zixuanPro: any) => {
                        zixuanPro.cnt = zixuanPro.c;//这个地方有猫腻 要这样写
                        let pro = this.CtorPubPro(zixuanPro);
                        zixuan.products.push(pro);
                    });
                });
                // @ts-ignore
                printData.products.push(zixuan);
            }
            else {
                //蘸酱费直接不加入打印任务
                if (!element.isExtra) {
                    let pro: any = this.CtorPubPro(element);
                    if (!pro.isExtra) {
                        // @ts-ignore
                        printData.products.push(pro);
                    }

                    //构建换购
                    if (element.huangou && element.huangou.length > 0) {
                        // @ts-ignore
                        element.huangou.forEach((huangou: any) => {
                            let pro = this.CtorPubPro(huangou);
                            // @ts-ignore
                            printData.products.push(pro);
                        });
                    }
                }
            }

        });
        console.log("打印数据", printData);
        //上传Es服务器
        this._kitchenPrintTaskR.Create(printData).then((res: any) => {
            this.PubPrintTaskForService(data);
        });
    }

    private CtorPubPro(element: any) {
        let pro: any = {
            name: element.name,
            scaleId: element.scaleId,
            scaleName: element.scaleName,
            count: element.cnt,
            id: element.id,
            type: element.type,
            stationId: null,
            components: null
        }

        if (element.kitchen && element.kitchen.station && element.kitchen.station.id) {
            pro.stationId = element.kitchen.station.id; //是不是有档口
        }

        //构建 口味
        if (element.components && element.components.length > 0) {
            pro.components = [];
            element.components.forEach((comp: any) => {
                comp.items.forEach((item: any) => {

                    //判断个数
                    let count = 0;
                    if (item.c && item.c > 0) {
                        count = item.c;
                    }
                    else if (item.cnt && item.cnt > 0) {
                        count = item.cnt;
                    }

                    if (count) {
                        pro.components.push({
                            count: item.c,
                            id: item.id,
                            name: item.name,
                            typeId: comp.id,
                            typeName: comp.name
                        });
                    }
                });
            });
        }

        return pro;
    }

    private PubPrintTaskForService(data: any) {
        let storeInfo = this.GetStoreInfo();
        let brandInfo = this.GetBrandInfo();
        let subKey = "PrintTask_" + brandInfo.brandId + "_" + storeInfo.storeId;
        let subUrl = this.GlobalUrl.PshubApi + '/exchange?key=' + subKey;
        this.Request.Request("POST", subUrl, data);
    }

    SaveOrder(orderInfo: any): Promise<any> {
        let sysInfo = this.ConfigCenter.GetSysInfo();
        let storeInfo = this.GetStoreInfo();
        let channleInfo = this.ConfigCenter.GetChannleInfo();

        let reqInfo = {
            infos: {
                brandId: "#",
                storeId: "#",
                price: orderInfo.price,
                ordersType: orderInfo.ordersType,
                subject: `${orderInfo.ordersType}-${storeInfo.storeName}`,
                channleType: channleInfo.name,
                memberId: orderInfo.memberId,
            }
        }

        //如果有订单，定性为加菜
        if (!reqInfo.infos.ordersType) {
            reqInfo.infos.ordersType = "充值";
            reqInfo.infos.subject = `${orderInfo.ordersType}-${storeInfo.storeName}`;
        }

        if (!reqInfo.infos.memberId && sysInfo && !sysInfo.isUser) {
            reqInfo.infos.memberId = sysInfo.memberId;
        }

        let url = this.GetFullUrl(this._urls.SaveOrder);
        return this.Request.Request("POST", url, reqInfo).then((res: any) => {
            return res.result;
        });
    }

    UpdateOrder(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    UpdateOrderMember(info: { orderId: string, memberId: number }): Promise<any> {
        let url = this.GlobalUrl.CloudStoreApi + this._urls.UpdateMemberId;
        let reqData = {
            ordersId: info.orderId,
            memberId: info.memberId,
            brandId: "#"
        };
        return this.Request.Request("POST", url, { p: reqData }).then(res => {
            console.log("xxxxx", res);
            let result = this.GetResult();
            if (res.result && res.result.count > 0) {
                result.success = true;
            }
            return result;
        });
    }

    DeleteOrder(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    CancelOrder(): Promise<any> {
        throw new Error("Method not implemented.");
    }

    UpdateWeight(info: { orderId: string, detailId: string, weight: number }): Promise<any> {
        let reqData = {
            brandId: "#",
            weight: info.weight,
            ordersId: info.orderId,
            detailId: info.detailId
        }
        let url = this.GetFullUrl(this._urls.UpdateWeight);
        return this.Request.Request("POST", url, reqData).then(res => {
            let result = this.GetResult();
            if (res.result && res.result.message == "") {
                result.success = true;
            } else {
                result.message = res.result.message;
            }
            return result;
        });
    }

    PayForOrder(data: any): Promise<any> {
        let result = { success: false, message: "", data: null };

        if (!data.payType) {
            result.message = "请选择支付方式";
            return Promise.resolve(result);
        }
        else if (data.payType.wxWeb && !data.openId) {
            result.message = "微信支付需要OpenId";
            return Promise.resolve(result);
        }

        if (!data.brandId)
            data.brandId = "#";

        let url = this.GetFullUrl(this._urls.PayForOrder);
        return this.Request.Request("POST", url, data).then((res: any) => {
            if (res.result) {
                if (res.result.message != "") {
                    result.message = res.result.message;
                    return result;
                }
                else {
                    result.success = true;
                    result.message = "";
                    result.data = res.result.data; //暂时不知道这里面是啥

                    //TODO:更新OrderLog的数据.
                    return result;
                }
            }
            result.message = "支付失败";
            return result;
        });
    }

    /**
     * 成功后的回调
     * @param data  { orderId:string, vouchers:[] } 
     *  vouchers 直接甩ziDai就OK
     *  orderId  能看懂
     */
    async  PaySuccessCallBack(data: any): Promise<any> {

        //构建第三方代金券
        if (data.vouchers && data.vouchers.length > 0) {
            let voucherGroup = Common.GroupBy(data.vouchers, "id", 0);
            let voucherInfos: OrderVoucher[] = [];
            let voucherIds = [];

            let now = new Date().getTime();
            for (const key in voucherGroup) {
                if (voucherGroup.hasOwnProperty(key)) {
                    const element = voucherGroup[key];
                    let firstEle = element[0];

                    let orderVoucher = new OrderVoucher();
                    orderVoucher.orderId = data.orderId;
                    orderVoucher.voucherId = key;
                    orderVoucher.voucherName = firstEle.name;
                    orderVoucher.count = element.length;
                    orderVoucher.discountFee = Common.Sum(element, "cut");

                    orderVoucher.creationTime = now;
                    orderVoucher.created = now;

                    voucherIds.push(key);
                    voucherInfos.push(orderVoucher);
                }
            }

            let query = new EsQuery({
                Filter: {
                    brandId: "#",
                    storeId: "#",
                    id: voucherIds
                },
                Size: voucherIds.length
            });
            let voucherPaymentRes = await this._voucherPaymentR.GetAll(query);
            if (voucherPaymentRes.data && voucherPaymentRes.data.length > 0) { //肯定是有的  特殊情况才没有
                console.log(voucherPaymentRes.data);
                voucherInfos.forEach(element => {
                    let info = voucherPaymentRes.data.find((p: any) => p.id === element.voucherId);
                    if (info) {
                        element.price = info.price;
                        element.faceVal = info.faceValue;

                        //Key 是Md5加密的结果
                        let key = element.voucherId + '_' + element.faceVal + '_' + element.price;
                        element.key = Common.Md5Encrypt(key);

                        console.log(element);

                        //这里可以用bluk优化
                        // this._orderVoucherR.Create(element); //直接创建 不等待了。
                    }
                });
                this._orderVoucherR.Bulk(voucherInfos, "Create");
            }
        }

        //更新退菜数据
        this._refundProductR.GetAll(new EsQuery({
            Filter: {
                ordersId: data.orderId
            },
            Size: 1000
        })).then((res) => {
            let updateData: any[] = [];
            res.data.forEach((element: any) => {
                updateData.push({ update: { _id: element._id } });
                updateData.push({ doc: { status: 'pendingToSuccess' }, doc_as_upsert: true });
            });
            if (updateData.length > 0) {
                return this._refundProductR.Bulk(updateData);
            }
            return true;
        });

        //更新赠菜数据
        this._freeProductR.GetAll(new EsQuery({
            Filter: {
                ordersId: data.orderId
            },
            Size: 1000
        })).then((res) => {
            let updateData: any[] = [];
            res.data.forEach((element: any) => {
                updateData.push({ update: { _id: element._id } });
                updateData.push({ doc: { status: 1 } });
            });
            if (updateData.length > 0) {
                return this._freeProductR.Bulk(updateData);
            }
            return true;
        });

        let result = this.GetResult();
        result.success = true;
        return Promise.resolve(result);
    }

    GetImplementsService(): string {
        return "IOrderService";
    }

    GetOrderBillStatus(data: { orderIds: string[]; }): Promise<any> {
        let result = this.GetResult();
        let query = new EsQuery({
            Filter: {
                ordersId: data.orderIds,
                storeId: "#",
                brandId: "#"
            },
            Size: data.orderIds.length
        });
        return this._orderBillStatuR.GetAll(query).then((res: any) => {
            result.success = true;
            result.data = {
                data: res.data,
                total: res.total
            };
            return result;
        });
    }

    CreateOrderBillStatus(data: { orderId: string, payPrice: string }): Promise<any> {
        let entity = new OrderBillStatus();
        entity.ordersId = data.orderId;
        entity.payPrice = data.payPrice;
        entity.status = 1;

        return this._orderBillStatuR.Create(entity);
    }

    GetTemporaryOrders(needOrderId?: boolean): Promise<any> {
        let result = this.GetResult();
        let query = new EsQuery({
            Filter: {
                brandId: "#",
                storeId: "#"
            }
        });

        if (!needOrderId) {
            query.filter.orderId = "_missing";
        }

        return this._temporaryOrderR.GetAll(query).then((res: any) => {
            result.success = true;
            result.data = res.data;
            return result;
        }, this.RequestError);
    }

    CheckPay(orderId: string): Promise<any> {
        let url = this.GetFullUrl(this._urls.CheckPay);
        let reqData = {
            ordersId: orderId,
            brandId: "#"
        };
        return this.Request.Request("POST", url, reqData).then(res => {
            let result = this.GetResult();
            if (res.result) {
                result.success = res.result.data.status === "Success";
                if (!result.success) {
                    result.message = "订单还未支付...";
                }
            }
            return result;
        });
    }

    CheckPayOrign(orderId: string): Promise<any> {
        let url = this.GetFullUrl(this._urls.CheckPayOrign);
        let reqData = {
            ordersId: orderId,
            brandId: "#"
        };
        return this.Request.Request("POST", url, reqData).then(res => {
            let result = this.GetResult();
            if (res.result) {
                result.success = res.result.data.status === "Success";
                if (!result.success) {
                    result.message = "订单还未支付...";
                }
            }
            return result;
        });
    }

    SwitchOrderDesk(ordersId: string, deskId: string, deskAlias?: string): any {
        let url = this.GetFullUrl(this._urls.SwitchOrderDesk);
        let reqData = {
            ordersId: ordersId,
            brandId: "#",
            deskId: deskId,
            deskAlias: deskAlias ? deskAlias : ""
        };
        return this.Request.Request("POST", url, reqData).then(res => {

            if (res.result && res.result.message.length) {
                return false;
            }
            else {
                return true;
            }
        })
    }

    SwitchPersonDesk(ordersId: string, person: number): any {
        let url = this.GetFullUrl(this._urls.SwitchOrderDesk);
        let reqData = {
            ordersId: ordersId,
            brandId: "#",
            person: person
        };
        return this.Request.Request("POST", url, reqData).then(res => {

            if (res.result && res.result.message.length) {
                return false;
            }
            else {
                return true;
            }
        })
    }

    GetOrderUsedVoucher(orderId: string): Promise<any> {
        let query = new EsQuery({
            Filter: {
                brandId: "#",
                storeId: "#",
                orderId: orderId
            }
        })
        return this._orderVoucherR.GetAll(query).then(res => {
            return res.data;
        });
    }

}