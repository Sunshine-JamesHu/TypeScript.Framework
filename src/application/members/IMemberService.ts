import { IApplicationService } from "../IApplicationService";
import { MemberInfo } from "../../core/entities/members/MemberInfo";

export interface IMemberService extends IApplicationService {
    /**
     * 获取用户信息
     * @param ids 
     */
    GetMembersByIds(ids: Array<number>): Promise<MemberInfo[]>;

    /**
     * 获取用户信息
     * @param memberId 用户Id
     */
    GetMemberInfo(memberId?: number): Promise<MemberInfo | null>;

    /**
     * 店长端获取用户信息
     * @param idOrPhone Id或者手机号
     */
    GetMemberInfoByPhoneOrMemberId(idOrPhone: string): Promise<MemberInfo | null>;

    /**
     * 获取用户的优惠券
     */
    GetMemberCoupons(): Promise<any>;

    /**
     * 用户登录接口
     * @param info 
     */
    AccountLogin(info: { phone: string, password: string }): any;

    /**
    * 获取用户积分
    * @param info page
    */
    GetIntegralList(info: { page: number }): any;

    /**
    * 获取充值明细
    * @param info page
    */
    GetAccountLogList(info: { page: number }): any;

    /**
    * 充值密码
    * @param info password
    */
    ResetPassword(info: { pwd: string }): Promise<any>;

    /**
     * 修改个人信息
     * @param info  sex birthday
     */

    UpdateUserInfo(info: { sex: string, birthday: string }): Promise<any>;
    /**
     * 修改性别
     * @param info sex
     */
    UpdateSex(info: { sex: string }): Promise<any>;

    /**
     * 修改生日
     * @param info birthday
     */
    UpDateBirthday(info: { birthday: string }): Promise<any>;

    /**
     * 修改生日
     * @param info 手机号 密码
     */
    UpDateMobile(info: { mobile: string, pwd: string }): any;

    /**
     * 获取用户的登录Token
     */
    GetMemberSSoToken(): Promise<any>;

    /**
     * 检查手机号
     */
    CheckMemberPhone(phone: string): Promise<any>;

    /**
     * 手机验证码登录
     * @param phone 手机号
     * @param code 验证码
     */
    MemberLoginByCode(phone: string, code: string): Promise<any>;

    /**
     * 绑定手机号
     */
    BindPhoneForMember(data: { phone: string, code: string, password?: string }): Promise<any>;


    /**
     * 手机号注册用户
     * @param data 
     */
    RegisterMemberByPhone(data: { phone: string, code: string, password: string }): Promise<any>;

    /**
    * 检查用户信息
    * @param none 
    */
    CheckMember(): Promise<any>;


    /**
     * 修改员工密码
     * @param info 
     */
    UpdateAccountPassword(info: { phone: string, password: string, password2: string, code: string }): Promise<any>;


}