import { IApplicationService } from "../IApplicationService";

export interface IOrderService extends IApplicationService {

    /**
     * 店长端获取正在进行的订单
     */
    GetStoreIngOrder(): Promise<any>;

    /**
     * 获取Ids中的订单是不是待结账状态的
     * @param data 
     */
    GetOrderBillStatus(data: { orderIds: string[] }): Promise<any>;

    /**
     * 设置订单为待结账状态
     * @param data 
     */
    CreateOrderBillStatus(data: { orderId: string, payPrice: string }): Promise<any>;

    /**
     * 获取正在点餐中的临时订单
     */
    GetTemporaryOrders(needOrderId?: boolean): Promise<any>;

    /**
     * 获取订单详情
     */
    GetOrderDetail(orderId: string): Promise<any>;

    /**
     * 获取用户的订单列表
     * @param memberId 用户Id
     */
    GetMemberOrders(input: { memberId?: number, pageSize: number, pageIndex: number }): Promise<any>;

    /**
     * 获取用户的总订单数
     * @param memberId 
     */
    GetMemberOrdersCount(input: { memberId?: number }): Promise<number>;

    /**
     * 保存订单
     */
    SaveOrder2(orderInfo: any): Promise<any>;

    /**
     * 保存订单
     */
    SaveOrder(orderInfo: any): Promise<any>;

    /**
     * 修改订单
     */
    UpdateOrder(): Promise<any>;

    /**
     * 删除订单
     */
    DeleteOrder(): Promise<any>;

    /**
     * 取消订单
     */
    CancelOrder(): Promise<any>;

    /**
     * 店长端修改称重商品
     */
    UpdateWeight(info: { orderId: string, detailId: string, weight: number }): Promise<any>;

    /**
     * 修改订单会员
     * @param orderId 
     * @param memberId 
     */
    UpdateOrderMember(info: { orderId: string, memberId: number }): Promise<any>;

    /**
     * 支付订单
     * @param data 支付数据
     */
    PayForOrder(data: any): Promise<any>;


    /**
     * 支付成功扭转
     * @param data 
     */
    PaySuccessCallBack(data: any): Promise<any>;

    /**
     * 检查订单是否支付
     */
    CheckPay(orderId: string): Promise<any>;

    /**
     * 检查是否支付成功
     * @param orderId 
     */
    CheckPayOrign(orderId: string): Promise<any>;

    /**
     * 换桌台
     * @param deskId
     * @param ordersId 
     */
    SwitchOrderDesk(ordersId: string, deskId: string, deskAlias?: string): Promise<any>;

    /**
    * 换人数
    * @param ordersId 
    * @param person
    */
    SwitchPersonDesk(ordersId: string, person: number): Promise<any>;

    /**
     * 获取订单使用的第三方代金券
     * @param orderId 
     */
    GetOrderUsedVoucher(orderId: string): Promise<any>;

}