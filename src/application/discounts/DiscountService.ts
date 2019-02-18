import { BaseApplicationService } from "../BaseApplicationService";
import { IDiscountService } from "./IDiscountService";
import { IActivityService } from "../activities/IActivityService";
import { ApplicationServiceFactory } from "../ApplicationServiceFactory";
import { IProductService } from "../products/IProductService";
import { ICouponService } from "../coupons/ICouponService";
import { IMemberService } from "../members/IMemberService";

//优惠对象
class DiscountInfo {
    public discount: { item: { [key: string]: any }, totalDiscount: number }
    public memberCoupons: any[];
    public integralRule: any;
    constructor(
        private storeInfo: any,
        public orderInfo?: any,
        private specialOfferData?: any,
        private discountPros?: any,
        private couponRule?: any,
        private memberInfo?: any,
        private integralRuleBak?: any
    ) {

        this.discount = {
            item: {
                freePro: {
                    totalAmount: 0,
                    key: "freePro",
                    name: "赠菜",
                    data: [],
                },
                fullOrder: {
                    totalAmount: 0,
                    key: "fullOrder",
                    name: "手工折扣",
                    type: 0,
                },
                specialPro: {
                    totalAmount: 0,
                    key: "specialPro",
                    name: "会员特价"
                },
                member: {
                    totalAmount: 0,
                    key: "member",
                    name: "会员折扣",
                },
                reducePro: {
                    totalAmount: 0,
                    key: "reducePro",
                    name: "减价商品"
                },
                limitPro: {
                    totalAmount: 0,
                    key: "limitPro",
                    name: "减价商品"
                },
                discountPro: {
                    totalAmount: 0,
                    key: "discountPro",
                    name: "减价商品"
                },
                moling: {
                    totalAmount: 0,
                    key: "moling",
                    name: "全局抹零"
                },
                orderCoupon: {
                    totalAmount: 0,
                    key: "orderCoupon",
                    name: "订单券",
                    data: []
                },
                proCoupon: {
                    totalAmount: 0,
                    key: "proCoupon",
                    name: "商品券",
                    data: []
                },
                integral: {
                    name: "积分优惠",
                    key: "integral",
                    isUsed: false,
                    totalAmount: 0,
                    integralCount: 0
                }
            },
            totalDiscount: 0
        };

        this.memberCoupons = [];

        this.integralRule = {
            enable: false,
            maxUseIntegral: 0,
            limitPrice: '', //这玩意是用来展示用的
            maxExChangeMoney: 0,
            oneIntegralForMoney: 0 //多少积分抵一块钱
        };

        this.Init();
    }

    private Init() {
        this.Reset();
        this.InitFreeProDiscount();

        //有全单折扣了  就不计算其他优惠
        if (this.discount.item.fullOrder.totalAmount <= 0 || (this.discount.item.fullOrder.totalAmount > 0 && this.discount.item.fullOrder.type == 2)) {
            this.InitProDiscount();
        }
        this.CalculationTotalDiscount();
        if (this.orderInfo.memberId != "0" && this.memberInfo) {
            this.InitIntegralRule(); //初始化积分规则
        }
        this.InitCanUseCoupon();
    }

    //重置
    private Reset() {
        this.discount.totalDiscount = 0;

        for (const key in this.discount.item) {
            if (this.discount.item.hasOwnProperty(key)) {
                //无需重置赠菜
                if (key != "freePro") {
                    const element = this.discount.item[key];
                    if (element.totalAmount) {
                        element.totalAmount = 0;
                    }
                    if (element.data) {
                        if (Object.prototype.toString.call(element.data) === '[object Array]') {
                            element.data = [];
                        }
                        else {
                            element.data = {};
                        }
                    }
                }
            }
        }
    }

    //初始化赠菜优惠
    private InitFreeProDiscount() {
        console.log("----- 初始化赠菜信息 -----");

        //制空 赠菜优惠
        this.discount.item.freePro.totalAmount = 0;
        this.discount.item.freePro.data = [];

        if (this.orderInfo.freePros && this.orderInfo.freePros.length > 0) {
            let totalFreeProAmount = 0;
            this.orderInfo.freePros.forEach((element: any) => {
                totalFreeProAmount += element.amount;
                this.discount.item.freePro.data.push(element);
            });
            this.discount.totalDiscount += totalFreeProAmount;
            this.discount.item.freePro.totalAmount = totalFreeProAmount;
        }
    }

    //初始化商品优惠
    private InitProDiscount() {
        console.log("----- 初始化商品级优惠 -----");
        console.log(this.orderInfo);

        for (let index = 0; index < this.orderInfo.products.length; index++) {
            const element = this.orderInfo.products[index];
            if (element) {

                // 自选套餐不计算会员折扣
                if (element.itemType !== 'taocan' && element.itemType !== 'zixuan' && element.parentId == '0') {

                    //换购品主商品和换购品本身不参与其他商品级别的折扣 
                    let canDis_count = element.cnt; //能够折扣的商品

                    //如果有赠菜就不计算其他折扣
                    if (this.orderInfo.freePros && this.orderInfo.freePros.length > 0) {
                        let freePros = this.orderInfo.freePros.filter((p: any) => p.detailId == element.detailId);
                        if (freePros.length > 0) {
                            freePros.forEach((freePro: any) => {
                                canDis_count -= freePro.cnt;
                            });
                        }
                    }

                    if (canDis_count > 0 && Number(element.paidFee > 0) && element.cnt > 0) {

                        if (this.orderInfo.memberId != "0" && this.memberInfo) {
                            this.InitMemberDiscount(element, canDis_count); //会员折扣
                            this.InitMemberSpecialPrice(element, canDis_count); //会员特价
                        }

                        this.InitProReduceDiscount(element, canDis_count);
                    }
                }
            }
        }
    }

    //初始化会员折扣
    private InitMemberDiscount(element: any, canDis_count: number) {
        console.log("----- 初始化会员折扣 -----");
        if (element) {
            //如果本商品参与会员折扣 (按照人数收费商品默认不参与会员折扣)
            if (!element.isExtra && element.options && !element.options.memberdiscountunable) {
                let memberDiscount = (this.memberInfo.disCount * 10) / 100;
                let discountAmount = (Number(element.paidFee) / element.cnt) * (1 - memberDiscount);
                for (let index = 0; index < canDis_count; index++) {
                    this.AddProDiscount(element, index, discountAmount, "member");
                }
            }
        }
    }

    //添加商品级优惠
    private AddProDiscount(element: any, index: number, amount: number, type: string, extend?: any) {
        if (!element.discount) element.discount = {}; //没有优惠的话加上空对象

        //溢出价格 那啥。。。
        let unitPrice = Number(element.paidFee) / element.cnt;
        if (unitPrice < amount) {
            amount = unitPrice;
        }

        let primaryKey = element.productId + "_" + element.scaleId + "_" + index;
        let discountType = this.discount.item[type];
        //优惠对象
        let discountObj: { [key: string]: any } = {
            name: discountType.name,
            type: type,
            amount: +amount.toFixed(2),
            key: primaryKey
        };


        if (extend) {
            if (extend.name)
                discountObj.name += "_" + extend.name;

            if (extend.id)
                discountObj.id = extend.id;

            if (extend.type)
                discountObj.aviType = extend.type;

            if (extend.serialNumber)
                discountObj.serialNumber = extend.serialNumber;

        }

        let oldDiscount = element.discount[primaryKey];
        if (!oldDiscount) {
            element.discount[primaryKey] = discountObj;
            this.discount.item[discountType.key].totalAmount = +(this.discount.item[discountType.key].totalAmount + discountObj.amount).toFixed(2);
            return true;
        }
        else if (oldDiscount && oldDiscount.amount < amount) {
            element.discount[primaryKey] = discountObj;
            this.discount.item[discountType.key].totalAmount = +(this.discount.item[discountType.key].totalAmount + discountObj.amount).toFixed(2);

            //覆盖掉后要把原有的优惠数据减去
            this.discount.item[oldDiscount.type].totalAmount = +(this.discount.item[oldDiscount.type].totalAmount - oldDiscount.amount).toFixed(2);
            return true;
        }
        else {
            return false; //可能优惠达不到所以 添加失败了
        }
    }

    //初始化会员特价
    private InitMemberSpecialPrice(element: any, canDis_count: number) {
        if (element) {
            let pk = element.productId + "_" + element.scaleId;
            let specialPro = null;

            if (this.specialOfferData)
                specialPro = this.specialOfferData[pk];

            //如果有本会员等级 的特价优惠
            if (specialPro) {
                let gradeId = Number(this.memberInfo.gradeId);
                let discountedPrice = specialPro.price[gradeId]; //优惠后的价格

                if (discountedPrice) { //如果这个等级有会员特价的话 就更新特价
                    let discountAmount = (Number(element.paidFee) / element.cnt) - discountedPrice; //原价减去优惠后的价格就是 优惠金额
                    for (let index = 0; index < canDis_count; index++) {
                        this.AddProDiscount(element, index, discountAmount, "specialPro", {
                            id: specialPro.id,
                            typeName: specialPro.typeName,
                            type: specialPro.type,
                            name: specialPro.name
                        });
                    }
                }
            }
        }
    }

    //初始化特价商品
    private InitProReduceDiscount(element: any, canDis_count: number) {
        if (element && this.discountPros) {
            if (element.parentId != "0") {
                let parentPro = this.orderInfo.products.filter((p: any) => p.detailId == element.parentId)[0];
                if (parentPro.itemType === 'taocan' || parentPro.itemType === 'zixuan')
                    return;
            }

            let key = element.productId + "_" + element.scaleId;
            let discounts = this.discountPros[key]; //可能会找到多个。。
            if (discounts && discounts.length > 0) {

                let discount = discounts[0]; //目前只取第一个 有必要可以择优

                let discountAmount = 0;
                let discountType = "reducePro";
                let unitPrice = Number(element.paidFee) / element.cnt;

                if (discount.rule.type == 'reduce') {//减价
                    discountAmount = Number(discount.rule.val);
                    discountType = "reducePro";
                }
                else if (discount.rule.type == 'limit') { //限制价格
                    discountAmount = unitPrice - Number(discount.rule.val);
                    discountType = "limitPro";
                }
                else if (discount.rule.type == 'discount') { //打折
                    discountAmount = (unitPrice * (1 - Number(discount.rule.val)));
                    discountType = "discountPro";
                }

                for (let index = 0; index < canDis_count; index++) {
                    this.AddProDiscount(element, index, discountAmount, discountType, {
                        id: discount.discountId,
                        typeName: "优惠活动",
                        name: discount.discountName
                    });
                }
            }
        }
    }

    //计算总优惠
    private CalculationTotalDiscount() {
        this.discount.item.moling.totalAmount = 0;
        let totalDiscount = 0;
        if (this.discount.item.fullOrder.totalAmount <= 0 || (this.discount.item.fullOrder.totalAmount > 0 && this.discount.item.fullOrder.type == 2)) {
            for (const key in this.discount.item) {
                if (this.discount.item.hasOwnProperty(key)) {
                    const element = this.discount.item[key];
                    totalDiscount += element.totalAmount;
                }
            }
        }
        else {
            totalDiscount = (this.discount.item.fullOrder.totalAmount + this.discount.item.freePro.totalAmount); //赠菜后还能全单折扣
        }

        let moling = this.CalculationMoling(totalDiscount);

        if (moling > 0) {
            this.discount.item.moling.totalAmount = moling;
            totalDiscount += moling;
        }

        this.discount.totalDiscount = +totalDiscount.toFixed(2);
    }

    //计算全局抹零
    private CalculationMoling(totalDiscount: number) {
        console.log("------ 计算全局抹零 -------");
        if (this.storeInfo.molingGlobal == 1 && this.storeInfo.molingRules > 0) {
            var needPay = +(this.orderInfo.paidFee - totalDiscount).toFixed(2);
            var decimal = +(needPay - (~~needPay)).toFixed(2);

            let afterDecimal = 0;
            // console.log(needPay, decimal);
            if (this.storeInfo.molingRules === 3) {
                afterDecimal = 0;
            } else if (this.storeInfo.molingRules === 2) {
                afterDecimal = decimal >= 0.5 ? 0.5 : 0;
            } else if (this.storeInfo.molingRules === 1) {
                afterDecimal = +(~~(decimal * 10) / 10).toFixed(2);
            }
            else {
                return 0;
            }
            return +(decimal - afterDecimal).toFixed(2);
        }
        return 0;
    }
    //初始化能用的优惠券
    private InitCanUseCoupon() {
        let memberCoupons = [];
        // this.memberCoupons = [];
        if (this.memberInfo && this.orderInfo.memberId != '0') {
            let now = (new Date()).getTime();
            //全部优惠券
            let coupons = this.memberInfo.coupons || [];
            //深拷贝
            coupons = JSON.parse(JSON.stringify(coupons));
            //过滤掉份数为0的商品
            let products = (this.orderInfo.products || []).filter((d: any) => d.cnt > 0);
            //对比菜品是否有单价超出
            let contrastProAmount = (arr: any, price: any) => {
                //任意一款大于实际付款价菜品大于优惠券金额即可用
                let isProActualPrice = false;
                for (let item of arr) {
                    let totalDiscount = 0;
                    let paidFee = Number(item.paidFee) || 0;
                    //判断商品是否有优惠
                    if (item.discount) {
                        for (const key in item.discount) {
                            const discount = item.discount[key];
                            totalDiscount += (Number(discount.amount) || 0);
                        }
                    }
                    paidFee = paidFee - totalDiscount;
                    if (!isProActualPrice) {
                        isProActualPrice = paidFee > price;
                        break;
                    }
                }
                return isProActualPrice;
            };
            //过滤产品
            let filterList = (list: any) => {
                let couponPros = list;
                let arr: any[] = [];
                if (products.length > 0) {
                    for (let item of couponPros) {
                        arr = arr.concat(products.filter((p: any) => p.productId == item.productId && (!item.scaleId || p.scaleId == item.scaleId)));
                    }
                }
                return arr;
            };
            //获取订单实际付款金额
            let GetOrderActualAmount = () => {
                return (Number(this.orderInfo.paidFee) || 0) - (Number(this.discount.totalDiscount) || 0);
            };
            //实际付款金额要大于优惠券金额
            let ContrastAmount = (el: any) => {
                let paidFee = GetOrderActualAmount();
                return el.price <= paidFee
            };
            //对比菜品金额
            let ContrastProPrice = (data: any, el: any) => {
                let isHasPro = data.isHasPro;
                let list = data.list;
                let couponPrice = Number(el.price) || 0;
                if (!isHasPro) {
                    //该券不限定商品为真
                    return true
                } else if (list.length < 0) {
                    //该订单无优惠券限定商品
                    return true
                } else {
                    return contrastProAmount(list, couponPrice);
                }
            };
            //判断是否该券限定产品使用
            let IsProList = (el: any) => {
                let list = [];
                let isHasPro = false;
                //商品券
                if (el.voucherType == 2) {
                    if (el.products && el.products.length > 0) {
                        isHasPro = true;
                        list = filterList(el.products);
                    }
                } else if (el.voucherType == 1) {
                    //现金券
                    let pro = el.productIds || [];
                    if (typeof pro == 'string') {
                        try { pro = JSON.parse(el.productIds); } catch (e) { console.error(e) }
                    }
                    if (Array.isArray(pro) && pro.length > 0) {
                        list = filterList(pro);
                        isHasPro = true;
                    }
                }
                return { isHasPro, list }
            };
            //满减券验证
            let IsCondition = (data: any, el: any) => {
                let isUsed = true;
                let condition = el.condition || { totalAmount: 0 };
                if (el.voucherType == 1) {
                    //获取满减
                    if (condition) {
                        if (typeof condition == 'string') {
                            condition = JSON.parse(condition);
                        }
                    }
                    condition.totalAmount = Number(condition.totalAmount);
                    //判断是否有满减
                    if (condition.totalAmount && condition.totalAmount > 0) {
                        //判断该券是否限定菜品
                        if (data.isHasPro && data.list > 0) {
                            //判断是否存在菜品单价超出满减条件
                            isUsed = contrastProAmount(data.list, condition.totalAmount);
                        }
                        //判断订单总金额是否大于满减优惠
                        let orderActualAmount = GetOrderActualAmount();
                        isUsed = condition.totalAmount < orderActualAmount;
                    }
                }
                return isUsed;
            };

            //配置不可用理由
            memberCoupons = coupons.map((d: any) => {
                let el = d;
                let canUseFlag = false;
                let hasProData = IsProList(el);
                let msg = '';
                if (el.brandId != this.storeInfo.brandId) {
                    msg = '不在品牌使用范围';
                } else if (el.endTime < now && now <= el.startTime) {
                    msg = '不在使用日期范围内';
                } else if (el.stores && !el.stores.find((p: any) => p.storeId == '-1' || p.storeId == this.storeInfo.storeId)) {
                    msg = '不在门店使用范围';
                } else if (hasProData.isHasPro && hasProData.list.length == 0) {
                    msg = '指定菜品可用';
                } else if (!ContrastProPrice(hasProData, el)) {
                    msg = '指定菜品单价金额不足';
                } else if (!IsCondition(hasProData, el)) {
                    msg = '满减条件不满足';
                } else if (!ContrastAmount(el)) {
                    msg = '订单总金额不足';
                } else {
                    canUseFlag = true;
                }
                el.rejectMsg = msg;
                el.canUseFlag = canUseFlag;
                return el
            });
            this.memberCoupons = memberCoupons;
        }
    }

    //初始化能用的优惠券(废弃)
    private InitCanUseCoupon2() {
        this.memberCoupons = [];
        if (this.memberInfo && this.orderInfo.memberId != '0') {
            let canUseMemberCoupons = [];
            let now = (new Date()).getTime();
            let coupons = this.memberInfo.coupons.filter((p: any) => p.brandId == this.storeInfo.brandId && p.endTime > now && p.startTime <= now);
            for (let index = 0; index < coupons.length; index++) {
                const coupon = coupons[index];

                let isThisStoreCoupon = false;
                if (coupon.stores) {
                    let storeCoupons = coupon.stores.filter((p: any) => p.storeId == '-1' || p.storeId == this.storeInfo.storeId);
                    if (storeCoupons.length > 0)
                        isThisStoreCoupon = true;
                }

                if (isThisStoreCoupon) {
                    //商品券限制
                    if (coupon.voucherType == 2) {
                        let couponPros = coupon.products;
                        for (let index = 0; index < couponPros.length; index++) {
                            const couponPro = couponPros[index];
                            let orderPros = [];
                            if (couponPro.scaleId) {
                                orderPros = this.orderInfo.products.filter((p: any) => p.productId == couponPro.productId && p.scaleId == couponPro.scaleId && p.cnt > 0);
                            }
                            else {
                                //没有规格Id
                                orderPros = this.orderInfo.products.filter((p: any) => p.productId == couponPro.productId && p.cnt > 0);
                            }

                            let freeCount = 0;
                            let orderProCount = 0;
                            orderPros.forEach((orderPro: any) => {
                                orderProCount += orderPro.cnt;
                                if (this.orderInfo.freePros) {
                                    let freePros = this.orderInfo.freePros.filter((p: any) => p.detailId == orderPro.detailId);
                                    if (freePros.length > 0) {
                                        freePros.forEach((freePro: any) => {
                                            freeCount += freePro.cnt;
                                        });
                                    }
                                }
                            });

                            if (orderPros.length > 0 && orderProCount > freeCount) {
                                canUseMemberCoupons.push(coupon);
                                break;
                            }
                        }
                    }
                    else if (coupon.voucherType == 1) {
                        let canUseFlag = false;

                        let couponPros = [];
                        if (coupon.productIds) {
                            if (typeof coupon.productIds == 'string') {
                                couponPros = JSON.parse(coupon.productIds);
                                if (!couponPros)
                                    couponPros = [];
                            }
                            else
                                couponPros = coupon.productIds;
                        }

                        let condition = { totalAmount: 0 };
                        if (coupon.condition) {
                            if (typeof coupon.condition == 'string') {
                                condition = JSON.parse(coupon.condition);
                                if (!condition)
                                    condition = { totalAmount: 0 };
                            }
                            else
                                condition = coupon.condition;
                        }

                        if (couponPros.length > 0) {
                            let totalAmount = 0;
                            for (let index = 0; index < couponPros.length; index++) {
                                const couponPro = couponPros[index];
                                let orderPros = this.orderInfo.products.filter((p: any) => p.productId == couponPro.productId && p.cnt > 0);
                                if (orderPros.length > 0) {
                                    if (condition.totalAmount && Number(condition.totalAmount) > 0) {
                                        orderPros.forEach((p: any) => {
                                            let paidFee = Number(p.paidFee)
                                            if (p.discount) {
                                                let totalDiscount = 0;
                                                for (const key in p.discount) {
                                                    if (p.discount.hasOwnProperty(key)) {
                                                        const disobj = p.discount[key];
                                                        totalDiscount += disobj.amount;
                                                    }
                                                }
                                                totalAmount += (paidFee - totalDiscount);
                                            }
                                            else {
                                                totalAmount += paidFee;
                                            }
                                        });
                                    }
                                }
                            }
                            if (Number(condition.totalAmount) <= totalAmount) {
                                canUseFlag = true;
                            }
                        }
                        else {
                            if (condition.totalAmount && Number(condition.totalAmount) > 0) {
                                if (Number(condition.totalAmount) <= this.orderInfo.paidFee - this.discount.totalDiscount) {
                                    canUseFlag = true;
                                }
                            }
                            else
                                canUseFlag = true;
                        }

                        if (canUseFlag)
                            canUseMemberCoupons.push(coupon);
                    }
                }

            }
            this.memberCoupons = canUseMemberCoupons;
            // console.log(this.memberCoupons);
        }
    }

    //检查是不是能使用优惠券
    private CheckCanUseCoupon(coupon: any) {
        let res = this.couponRule; //图方便
        //判断是不是可以券同享
        if (!res.canuseboth) {
            let voucherType = 'proCoupon';
            if (coupon.voucherType == 2)
                voucherType = 'orderCoupon';

            let useCoupons = this.discount.item[voucherType].data;
            if (useCoupons.length > 0) {
                return {
                    canUse: false,
                    message: '订单券和商品券无法同享'
                };
            }
        }

        //两种券的使用限制
        if (coupon.voucherType == 2) {
            let useProductCoupons = this.discount.item.proCoupon.data;
            if (res.productcouponrules.limited && (useProductCoupons.length + 1) > res.productcouponrules.count) {
                return {
                    canUse: false,
                    message: '商品券最多使用' + res.productcouponrules.count + '张'
                };
            }
        }
        else if (coupon.voucherType == 1) {
            //订单券
            let useOrderCoupons = this.discount.item.orderCoupon.data;
            if (res.ordercouponrules.limited && (useOrderCoupons.length + 1) > res.ordercouponrules.count) {
                return {
                    canUse: false,
                    message: '订单券最多使用' + res.ordercouponrules.count + '张'
                };
            }
        }
        return {
            canUse: true
        };
    }

    private InitIntegralRule() {
        console.log("------ 初始化积分规则 ------");
        let res = this.integralRuleBak; //原始积分数据

        if (res && res.base && res.base.discount) {
            let info = res.base.discount;
            this.integralRule.enable = res.base.status == 1; //启用状态
            this.integralRule.oneIntegralForMoney = 1 / info.integral; //一个积分抵扣多少钱

            //品牌的积分使用限制
            let maxUseIntegral = 0;

            if (!info.limitPrice) {
                if (info.limitType == 1)
                    info.limitPrice = this.orderInfo.paidFee;
                else if (info.limitType == 2)
                    info.limitPrice = 100;
            }

            if (info.limitType == 1) {
                this.integralRule.limitPrice = info.limitPrice.toFixed(2) + "元";
                maxUseIntegral = info.limitPrice / this.integralRule.oneIntegralForMoney;
            }
            else if (info.limitType == 2) { //订单金额的百分比
                this.integralRule.limitPrice = info.limitPrice + '%';
                maxUseIntegral = (this.orderInfo.paidFee - this.discount.totalDiscount) * (info.limitPrice / 100) / this.integralRule.oneIntegralForMoney;
            }

            maxUseIntegral = Math.ceil(maxUseIntegral); //向上取整

            //超过用户的总余额
            if (this.memberInfo.integral < maxUseIntegral) {
                maxUseIntegral = this.memberInfo.integral;
            }

            //超过订单的总金额
            if ((maxUseIntegral * this.integralRule.oneIntegralForMoney) > (this.orderInfo.paidFee - this.discount.totalDiscount)) {
                maxUseIntegral = (this.orderInfo.paidFee - this.discount.totalDiscount) / this.integralRule.oneIntegralForMoney;
            }

            this.integralRule.maxUseIntegral = parseInt(maxUseIntegral + "");
            this.integralRule.maxExChangeMoney = +(maxUseIntegral * this.integralRule.oneIntegralForMoney).toFixed(2);


            //溢出防御
            if (info.limitType == 1) {
                if (this.integralRule.maxExChangeMoney > info.limitPrice) {
                    this.integralRule.maxExChangeMoney = +info.limitPrice.toFixed(2);
                }
            }
            else if (info.limitType == 2) { //订单金额的百分比
                let maxExMoney = (this.orderInfo.paidFee - this.discount.totalDiscount) * (info.limitPrice / 100)
                if (this.integralRule.maxExChangeMoney > maxExMoney) {
                    this.integralRule.maxExChangeMoney = +maxExMoney.toFixed(2);
                }
            }

        }
        else {
            this.integralRule.enable = false;
            this.integralRule.maxUseIntegral = 0;
            this.integralRule.oneIntegralForMoney = 0;
        }
    }



    //使用优惠券
    public UseOrUnUseCoupon(coupon: any): any {
        let that = this;
        let oldUsed = coupon.isUsed;
        if (!coupon.isUsed) {

            let orderTotalAmount = that.orderInfo.paidFee - that.discount.totalDiscount;
            if (orderTotalAmount - coupon.price < 0) {
                return { canUse: false, message: "请选择优惠金额少点的券" };
            }

            let checkRes = that.CheckCanUseCoupon(coupon);
            if (checkRes.canUse) {
                //订单券
                if (coupon.voucherType == 1) {
                    coupon.isUsed = true;
                    that.discount.item.orderCoupon.data.push(coupon);
                    that.discount.item.orderCoupon.totalAmount += coupon.price;
                }
                //商品券
                else if (coupon.voucherType == 2) {
                    coupon.isUsed = true;
                    console.log("优惠券----", coupon.name, coupon);
                    let thisCouponIsUsed = false;

                    for (let index = 0; index < coupon.products.length; index++) {
                        const product = coupon.products[index];
                        let orderPros = [];

                        if (product.scaleId)
                            orderPros = that.orderInfo.products.filter((p: any) => p.productId == product.productId && p.scaleId == product.scaleId);
                        else
                            orderPros = that.orderInfo.products.filter((p: any) => p.productId == product.productId);

                        if (orderPros && orderPros.length > 0) {

                            for (let proIndex = 0; proIndex < orderPros.length; proIndex++) {
                                const orderPro = orderPros[proIndex];

                                //单价大于 优惠券金额 不使用
                                let unitPrice = Number(orderPro.paidFee) / orderPro.cnt;
                                if (unitPrice < coupon.price) {
                                    continue;
                                }


                                //计算赠菜
                                let canDisCount = orderPro.cnt;
                                if (that.orderInfo.freePros) {
                                    let orderFreePros = that.orderInfo.freePros.filter((p: any) => p.detailId == orderPro.detailId);
                                    if (orderFreePros.length > 0) {
                                        orderFreePros.forEach((e: any) => {
                                            canDisCount -= e.cnt;
                                        });
                                    }
                                }


                                let hasThisCouponCount = 0;
                                if (orderPro.discount && canDisCount > 0) {
                                    for (const key in orderPro.discount) {
                                        if (orderPro.discount.hasOwnProperty(key)) {
                                            const discount = orderPro.discount[key];
                                            if (discount.type == "proCoupon") {
                                                hasThisCouponCount++;
                                            }
                                        }
                                    }
                                }
                                if (hasThisCouponCount >= canDisCount || canDisCount < 1) {
                                    continue; //下一个餐品
                                }

                                let addDisFlag = that.AddProDiscount(orderPro, hasThisCouponCount, coupon.price, "proCoupon", { serialNumber: coupon.serialNumber });

                                if (addDisFlag) {
                                    let tempCoupon = Object.assign(coupon); //TODO:这里需要深拷贝
                                    tempCoupon.detailInfo = {
                                        detailId: orderPro.detailId,
                                        index: hasThisCouponCount
                                    };

                                    //在这里更新Cop中的值
                                    that.discount.item.proCoupon.data.push(tempCoupon);
                                    console.log("Element", orderPro);
                                    coupon.isUsed = true; //再次把已使用变为true;
                                    thisCouponIsUsed = true;
                                    break;
                                }
                            }

                            if (thisCouponIsUsed)
                                break;
                        }
                        else {
                            coupon.isUsed = false;
                        }
                    }
                    if (!thisCouponIsUsed) {
                        coupon.isUsed = false;
                    }
                    console.log("优惠券", this.discount.item.proCoupon);
                }
                else {
                    return ({ canUse: false, message: "无法确定券的来源，无法使用。" })
                }
            }
            else {
                return checkRes;
            }
        }
        else {
            coupon.isUsed = false;
            let couponKey = "orderCoupon";
            if (coupon.voucherType == 2) {
                couponKey = "proCoupon";

                for (let index = 0; index < coupon.products.length; index++) {
                    const product = coupon.products[index];
                    let orderPros = this.orderInfo.products.filter((p: any) => p.productId == product.productId && p.scaleId == product.scaleId);
                    if (orderPros && orderPros.length > 0) {
                        let isBreak = false;
                        for (let proIndex = 0; proIndex < orderPros.length; proIndex++) {
                            const orderPro = orderPros[proIndex];
                            let delKey = null;
                            if (orderPro.discount) {
                                for (const key in orderPro.discount) {
                                    if (orderPro.discount.hasOwnProperty(key)) {
                                        const discount = orderPro.discount[key];
                                        if (discount.type == "proCoupon" && discount.serialNumber == coupon.serialNumber) {
                                            delKey = key;
                                        }
                                    }
                                }
                            }
                            if (delKey) {
                                isBreak = true;
                                delete orderPro.discount[delKey];
                                this.InitProDiscount();
                                break;
                            }
                        }
                        if (isBreak)
                            break;
                    }
                }

            }

            //删除Data中的值
            let spliceIndex = 0;
            for (let index = 0; index < this.discount.item[couponKey].data.length; index++) {
                const element = this.discount.item[couponKey].data[index];
                if (element.serialNumber === coupon.serialNumber) {
                    spliceIndex = index;
                }
            }
            this.discount.item[couponKey].data.splice(spliceIndex, 1);
            this.discount.item[couponKey].totalAmount -= coupon.price;
        }
        //选了优惠券后更新 积份规则
        this.InitIntegralRule()
        this.CalculationTotalDiscount();

        return { canUse: oldUsed != coupon.isUsed };
    }

    public UseOrUnUseIntegral(): any {
        this.discount.item.integral.isUsed = !this.discount.item.integral.isUsed;
        if (this.discount.item.integral.isUsed) {
            //TODO:计算优惠券
            let discountAmount = this.integralRule.maxUseIntegral * this.integralRule.oneIntegralForMoney;

            if (discountAmount > this.integralRule.maxExChangeMoney) {
                discountAmount = this.integralRule.maxExChangeMoney;
            }

            console.log(discountAmount);

            this.discount.item.integral.totalAmount = discountAmount;
            this.discount.item.integral.integralCount = this.integralRule.maxUseIntegral;
        }
        else {
            this.discount.item.integral.totalAmount = 0;
            this.discount.item.integral.integralCount = 0;
        }
        this.CalculationTotalDiscount();
    }


    //仅返回数据，不去做赋值
    // 0 店长折扣 1 全单折扣 2任意优惠
    public GetFullOrderDiscountData(_discount: number | string, type: number | string): any {
        //强制性转换为数字类型;
        let discount = Number(_discount);
        let totalAmount = 0;
        //返还之前所用折扣
        let actualAmount = 0;
        if (type == 0 || type == 1) {
            actualAmount = this.orderInfo.paidFee - this.discount.item.freePro.totalAmount;
            //过滤附加费 套餐类 自选类和cnt<=0的菜品
            let products = this.orderInfo.products.filter((el: any) => el.itemType !== 'taocan' && el.itemType !== 'zixuan' && el.cnt > 0 && !el.isExtra);
            products.forEach((el: any) => {
                let canDiscount = false;
                let count = el.cnt; //能够折扣的商品
                if (type == 0) {
                    canDiscount = !el.options.memberdiscountunable;
                }
                else if (type == 1) {
                    canDiscount = !el.options.fulldiscountunable;
                }
                if (canDiscount) {
                    let unitPrice = el.unitPrice;
                    if (el.tips == "换购品") {
                        unitPrice = Number(el.originalPrice) / el.cnt;
                    }
                    let paidFee = unitPrice * count; //应支付金额
                    let discountAmount = paidFee * (1 - (discount / 100)); //优惠金额
                    totalAmount = totalAmount + discountAmount;
                }
            });
        } else {
            actualAmount = this.orderInfo.paidFee - this.discount.totalDiscount + this.discount.item.fullOrder.totalAmount;
            if (discount && discount > 0) {
                if (discount > actualAmount) {
                    totalAmount = actualAmount;
                } else {
                    totalAmount = discount;
                }
            }
        }
        return {
            actualAmount: actualAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2)
        };
    }

    //使用折扣
    // 0 店长折扣 1 全单折扣 2任意优惠
    public UseFullOrderDiscount(_discount: string | number, type: string | number): any {
        console.log("--- 全单折扣/店长折扣/任意折扣 ---");
        let discount = Number(_discount); //强制性转换为数字类型;
        this.discount.item.fullOrder.type = type;
        this.discount.item.fullOrder.totalAmount = 0;
        //重新获取算出的数据
        let amount = Number(this.GetFullOrderDiscountData(_discount, type).totalAmount) || 0;
        //除了任意优惠  其他的需要重置优惠
        if (type == 0 || type == 1) {
            //重置
            this.Reset();
        }
        this.discount.item.fullOrder.totalAmount = amount;
        this.CalculationTotalDiscount();
    }

    public GetPayData(): any {

        let payData: any = {
            ordersId: this.orderInfo.ordersId,
            payType: {},
            brandId: "#",
            discount: {
                cop: {},
                zhe: 0,
                zheTip: "",
                zhengMaling: 0,
                otherDiscount: undefined,
                daijin: undefined
            },
            memberId: this.orderInfo.memberId,
            molinRule: 0
        };
        console.log("获取支付参数", this);
        //构建餐品 优惠;
        let discounts: { [key: string]: any } = {};

        //全单折扣  店长折扣 任意优惠
        if (this.discount.item.fullOrder.totalAmount > 0) {
            payData.discount.zhe = this.discount.item.fullOrder.totalAmount;
        }

        //如果有全单折扣 就不加载其他的折扣
        this.orderInfo.products.forEach((element: any) => {
            let detailDis: any[] = [];
            if (this.discount.item.fullOrder.totalAmount <= 0 || (this.discount.item.fullOrder.totalAmount > 0 && this.discount.item.fullOrder.type == 2)) {
                if (element.discount) {
                    for (const key in element.discount) {
                        if (element.discount.hasOwnProperty(key)) {
                            const discount = element.discount[key];
                            let oldDis = detailDis.filter((p: any) => p.name === discount.name && discount.type != "proCoupon" && discount.type != "limitPro")[0];
                            if (oldDis) {
                                oldDis.cnt++;
                            }
                            else {
                                let disObj: { id?: string | number, name: string, cnt: number, detailId: string, type: number, aviType?: string, disinfo?: any, serialNumber?: string }
                                    = { name: discount.name, cnt: 1, detailId: element.detailId, type: 0 };

                                //定义支付的优惠类型
                                if (discount.type == "member") { disObj.type = 1; }
                                else if (discount.type == "specialPro") {
                                    disObj.type = 3;
                                    disObj.aviType = discount.aviType;
                                    disObj.disinfo = {
                                        "base": {
                                            "name": "会员特价",
                                            "rule": {
                                                "type": "limit",
                                                "val": ((element.paidFee / element.cnt) - discount.amount).toFixed(2)
                                            }
                                        }
                                    }
                                }
                                else if (discount.type == "reducePro" || discount.type == "limitPro" || discount.type == "discountPro") {
                                    disObj.id = discount.id;
                                    disObj.type = 3;
                                }
                                else if (discount.type == "proCoupon") {
                                    disObj.serialNumber = discount.serialNumber;
                                    disObj.type = 4; //减价券
                                }
                                detailDis.push(disObj);
                            }
                        }
                    }

                }
            }

            if (this.orderInfo.freePros && this.orderInfo.freePros.length > 0) {
                let freePros = this.orderInfo.freePros.filter((p: any) => p.detailId == element.detailId);
                if (freePros && freePros.length > 0) {
                    freePros.forEach((freePro: any) => {
                        let oldDis = detailDis.filter(p => p.name === "赠菜")[0];
                        if (oldDis) {
                            oldDis.cnt += element.cnt
                        }
                        else {
                            let disObj = {
                                name: "赠菜",
                                cnt: freePro.cnt,
                                detailId: freePro.detailId,
                                type: 3,
                                disinfo: {
                                    "base": {
                                        "name": "赠菜",
                                        "rule": {
                                            "type": "limit",
                                            "val": 0
                                        }
                                    }
                                }
                            };
                            detailDis.push(disObj);
                        }
                    });
                }
            }

            if (detailDis.length > 0)
                discounts[element.detailId] = detailDis;
        });

        //使用积分
        if (this.discount.item.integral.isUsed) {
            payData.discount.otherDiscount = {
                integral: {
                    fee: +this.discount.item.integral.totalAmount.toFixed(2),
                    subIntegral: this.discount.item.integral.integralCount
                }
            }
        }

        //订单券
        if (this.discount.item.orderCoupon.totalAmount > 0) {
            let daiJin = [];
            for (let index = 0; index < this.discount.item.orderCoupon.data.length; index++) {
                const element = this.discount.item.orderCoupon.data[index];
                daiJin.push({ serialNumber: element.serialNumber });
            }
            payData.discount.daijin = daiJin;
        }

        //整单抹零
        if (this.storeInfo.malingRules != 0 && this.discount.item.moling.totalAmount > 0) {
            payData.discount.zhengMaling = +this.discount.item.moling.totalAmount.toFixed(2);
        }

        payData.discount.cop = discounts;

        console.log(JSON.stringify(payData));
        return payData;
    }
}

export class DiscountService extends BaseApplicationService implements IDiscountService {
    private readonly _activeService: IActivityService;
    private readonly _productService: IProductService;
    private readonly _couponService: ICouponService;
    private readonly _memberService: IMemberService;

    constructor() {
        super();

        //初始化服务
        this._activeService = ApplicationServiceFactory.GetServiceInstance("IActivityService");
        this._productService = ApplicationServiceFactory.GetServiceInstance("IProductService");
        this._couponService = ApplicationServiceFactory.GetServiceInstance("ICouponService");
        this._memberService = ApplicationServiceFactory.GetServiceInstance("IMemberService");
    }


    GetDiscountInstance(orderInfo: any): Promise<any> {
        return this.Init(orderInfo);
    }

    //初始化
    private Init(orderInfo: any) {
        let that = this;
        if (orderInfo.memberId == "0") {
            return this.Request.All([this.GetSpecialPrice(), this.GetProsDiscount(), this.GetCouponRule(), this.GetIntegralRule()])
                .then((res: any) => {
                    console.log("初始化结果1", res);
                    let specialOfferData = res[0]; //会员特价
                    let prosDiscountData = res[1]; //商品特价
                    let couponRule = res[2]; //优惠券使用规则
                    let integralRule = res[3]; //积分规则

                    return new DiscountInfo(this.GetStoreInfo(), orderInfo, specialOfferData, prosDiscountData, couponRule, null, integralRule);
                });
        }
        else {
            return this.Request.All([this.GetSpecialPrice(), this.GetProsDiscount(), this.GetCouponRule(), this.GetOrderMemberInfo(orderInfo.memberId), this.GetIntegralRule()])
                .then((res: any) => {
                    console.log("初始化结果2", res);
                    let specialOfferData = res[0]; //会员特价
                    let prosDiscountData = res[1]; //商品特价
                    let couponRule = res[2]; //优惠券使用规则
                    let memberInfo = res[3]; //用户信息
                    let integralRule = res[4]; //积分规则

                    console.log("integralRule", integralRule);

                    return new DiscountInfo(this.GetStoreInfo(), orderInfo, specialOfferData, prosDiscountData, couponRule, memberInfo, integralRule);
                });
        }
    }

    //初始化会员特价
    private GetSpecialPrice() {
        return this._activeService.GetSpecialOffer();
    }
    //初始化商品优惠
    private GetProsDiscount() {
        return this._productService.GetProductDiscount();
    }
    //初始化优惠券规则
    private GetCouponRule() {
        return this._couponService.GetBrandCouponRule();
    }
    //获取订单的用户信息
    private GetOrderMemberInfo(memberId: string) {
        return this._memberService.GetMemberInfoByPhoneOrMemberId(memberId);
    }
    //获取积分规则
    private GetIntegralRule() {
        return this._activeService.GetIntegralRule();
    }



    GetImplementsService(): string {
        return "IDiscountService";
    }
}