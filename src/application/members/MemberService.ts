import { BaseApplicationService } from "../BaseApplicationService";
import { IMemberService } from "./IMemberService";
import { MemberInfo } from "../../core/entities/members/MemberInfo";
import { SysInfo } from "../../core/entities/systems/SysInfo";
import { Common } from "../../core/common/Common";

export class MemberService extends BaseApplicationService implements IMemberService {
    private readonly _urls = {
        AccountLogin: "IAccounts/login",
        MemberInfoByToken: "IMembers/memberInfo",
        MemberInfoByIds: "IMembers/membersById",
        MemberCouponList: "IMembers/couponList",
        UpdateMemberInfo: "IMembers/updateInfo",
        SMemberLogin: "IMembers/sMemberLogin",
        SMemberLoginByCode: "IMembers/sMemberLoginCode",
        MemberLogin: "IMembers/login",
        IntergralList: "IMembers/integralList",
        AccountLogList: "IMembers/accountLogList",
        ResetPassword: "IMembers/resetPwd",
        UpDateInfo: 'IMembers/updateInfo',
        BindingMobile: 'IMembers/bindingMobile',
        CheckPhone: 'IMembers/checkMobile',
        BindPhone: "IMembers/bindingMobile",
        RegisterMemberByPhone: "IMembers/mobileRegister",
        CheckMember: 'IMembers/checkMember',
        UpdateAccountPassword: "IAccounts/updateEmployeePwd"
    };


    private GetFullUrl(url: string) {
        return this.GlobalUrl.CloudStoreApi + url;
    }

    GetImplementsService(): string {
        return "IMemberService";
    }

    GetMembersByIds(ids: number[]): Promise<MemberInfo[]> {
        if (ids.length < 1) {
            return Promise.resolve([]);
        }
        let filter = {
            p: {
                brandId: "#",
                memberIds: ids
            }
        };
        let url = this.GetFullUrl(this._urls.MemberInfoByIds);
        return this.Request.Request("POST", url, filter);
    }

    GetMemberInfo(memberId?: number): Promise<MemberInfo | null> {
        if (memberId) {
            return this.GetMembersByIds([memberId]).then((res:any) => {
                let data = res.result.data;
                if (data && data.length > 0){
                    return data[0];
                }else{
                    return null;
                }
            });
        } else {
            return this.GetMemberInfoByToken();
        }
    }

    GetMemberInfoByPhoneOrMemberId(
        idOrPhone: string
    ): Promise<MemberInfo | null> {
        if (idOrPhone === "") {
            return Promise.resolve(null);
        }

        let filter: { [key: string]: string } = { brandId: "#" };
        if (idOrPhone.length == 11) filter.mobile = idOrPhone;
        else filter.memberId = idOrPhone;

        let url = this.GetFullUrl(this._urls.SMemberLogin);
        return this.Request.Request("POST", url, { p: filter }).then(
            (res: any) => {
                if (res && res.result.message == "") return res.result.data;
                return null;
            }
        );
    }

    /**
     * 这个接口有问题的，要一秒差不多
     */
    GetMemberCoupons(): Promise<any> {
        let url = this.GetFullUrl(this._urls.MemberCouponList);
        let reqData = {
            p: { token: "#" }
        };
        // let brandInfo = this.GetBrandInfo();
        return this.Request.Request("POST", url, reqData).then((res: any) => {
            if (res && res.result.message == "") {
                let result = res.result.data; //.filter((p: any) => p.brandId == brandInfo.brandId && p.status === 0 && p.startTime <= now && p.endTime >= now); //两个brandId的数据类型是不一样的
                return result;
            }
            return [];
        });
    }

    //根据Token获取用户信息
    private GetMemberInfoByToken(): Promise<MemberInfo | null> {
        let url = this.GetFullUrl(this._urls.MemberInfoByToken);
        let reqData = {
            p: { storeId: "#", token: "#" }
        };
        return this.Request.Request("POST", url, reqData).then((res: any) => {
            if (res && res.result.message == "")
                return res.result.data as MemberInfo;
            return null;
        });
    }

    /**
     * 员工登录
     * @param info  员工信息
     */
    AccountLogin(info: { phone: string; password: string }): Promise<any> {
        if (info.phone == "" || info.password == "") {
            throw new Error("账号或者密码为空");
        }
        let result = { success: false, message: "账号或者密码错误", data: null };
        let url = this.GetFullUrl(this._urls.AccountLogin);
        return this.Request.Request("POST", url, { p: { mobile: info.phone, pwd: info.password } })
            .then(res => {
                if (res && res.token) {
                    let token = { loginToken: res.loginToken, token: res.token };
                    let sysInfo = new SysInfo({
                        sysId: res.account.id,
                        sysName: res.account.loginName,
                        sysPhone: res.account.mobile,
                        token: token
                    });
                    this.ConfigCenter.SetSysInfo(sysInfo); //设置当前登录用户

                    result.success = true;
                    result.data = res;

                    return result;
                }
                return result;
            }, err => {
                console.warn("账号或者密码错误", err);
                return result;
            });
    }

    /**
     * 用户登录
     * @param info  用户信息
     */
    MemberLogin(info: { phone: string; password: string }): Promise<any> {
        let channleInfo = this.ConfigCenter.GetChannleInfo();
        let result = { success: false, message: "", data: null };
        if (info.phone == "" || info.password == "") {
            console.warn("账号或者密码为空");
            result.message = "账号或者密码为空";
            return Promise.resolve(result);
        }
        let url = this.GetFullUrl(this._urls.MemberLogin);
        let reqData = {
            channel: channleInfo.type,
            mobile: info.phone,
            pwd: Common.Md5Encrypt(info.password),
            brandId: "#",
            storeId: "#"
        };
        return this.Request.Request("POST", url, { p: reqData }).then((res: any) => {
            if (res && res.result.message == "") {
                let token = {
                    loginToken: res.result.data.token,
                    token: res.result.data.token,
                    openId: res.result.data.openId,
                };
                let sysInfo = new SysInfo({
                    memberId: res.result.data.memberId,
                    token: token
                });
                this.ConfigCenter.SetSysInfo(sysInfo); //设置当前登录用户

                result.success = true;
                result.data = res.result.data
                return result;
            }
            else
                result.message = res.result.message;

            return result;
        }, err => {
            console.error("登录失败", err);
            result.message = "登录失败";
            return result;
        });
    }

    /**
     * 获取用户积分
     * @param info  page
     */
    GetIntegralList(info: { page: number }): Promise<any> {
        let url = this.GetFullUrl(this._urls.IntergralList);
        let reqData = {
            p: {
                page: info.page,
                token: "#"
            }
        };

        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 获取充值明细
     * @param info  page
     */
    GetAccountLogList(info: { page: number }): Promise<any> {
        let url = this.GetFullUrl(this._urls.AccountLogList);
        let reqData = {
            p: {
                page: info.page,
                token: "#"
            }
        };

        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 重置密码
     * @param info  password
     */
    ResetPassword(info: { pwd: string }): Promise<any> {
        let url = this.GetFullUrl(this._urls.ResetPassword);
        let reqData = {
            p: {
                pwd: Common.Md5Encrypt(info.pwd),
                token: "#"
            }
        };

        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 修改性别
     * @param info  sex
     */
    UpdateSex(info: { sex: string }): Promise<any> {
        let url = this.GetFullUrl(this._urls.UpDateInfo);
        let reqData = {
            p: {
                sex: info.sex,
                token: "#"
            }
        };
        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 修改个人信息
     * @param info  sex birthday
     */
    UpdateUserInfo(info: { sex: string, birthday: string }): Promise<any> {
        let url = this.GetFullUrl(this._urls.UpDateInfo);
        let reqData = {
            p: {
                sex: info.sex,
                birthday: info.birthday,
                token: "#"
            }
        };
        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 修改生日
     * @param info  birthday
     */
    UpDateBirthday(info: { birthday: string }): Promise<any> {
        let url = this.GetFullUrl(this._urls.UpDateInfo);
        let reqData = {
            p: {
                birthday: info.birthday,
                token: "#"
            }
        };
        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 重置手机号
     * @param info  手机号 密码
     */
    UpDateMobile(info: { mobile: string, pwd: string }) {
        let url = this.GetFullUrl(this._urls.BindingMobile);
        let reqData = {
            p: {
                token: "#",
                brandId: '#',
                storeId: '#',

            }
        };
        return this.Request.Request("POST", url, reqData).then(e => {
            if (e.result) {
                return e.result.data;
            }
        });
    }

    /**
     * 获取扫码的Token (生成QRCode)
     */
    GetMemberSSoToken(): Promise<any> {
        let url = `${this.GlobalUrl.SsoApi}genToken`; //直接写
        return this.Request.Request("GET", url, { token: "#" });
    }

    /**
     * 检查手机号
     * @param phone 手机号
     */
    CheckMemberPhone(phone: string): Promise<any> {
        let result = { success: false, message: "" };
        if (!phone || phone.length != 11) {
            console.warn("手机号格式错误!");
            result.message = "手机号格式错误";
            return Promise.resolve(result);
        }

        let url = this.GetFullUrl(this._urls.CheckPhone);
        let reqData = {
            mobile: phone,
            brandId: "#"
        }
        return this.Request.Request("POST", url, { p: reqData }).then((res: any) => {
            if (res.result.status == 1) {
                result.success = true;
                result.message = res.result.message;
            }
            else {
                result.success = false;
                result.message = "手机未注册!";
            }
            return result;
        });
    }

    /**
     * 用户登录
     * @param phone 手机号
     * @param code 验证码
     */
    MemberLoginByCode(phone: string, code: string): Promise<any> {
        let result = { success: false, message: "", data: null };
        if (!phone || phone.length != 11) {
            console.warn("手机号格式错误!");
            result.message = "手机号格式错误";
            return Promise.resolve(result);
        }

        if (!code || code.length < 4 || code.length > 8) {
            console.warn("验证码格式错误!");
            result.message = "验证码格式错误!";
            return Promise.resolve(result);
        }

        let url = this.GetFullUrl(this._urls.SMemberLoginByCode);
        let reqData = {
            mobile: phone,
            brandId: "#",
            code: code,
            type: "mobilecode"
        }

        return this.Request.Request("POST", url, { p: reqData }).then((res: any) => {
            console.log(res);
            if (res && res.result && res.result.message == "") {
                result.success = true;
                result.data = res.result.data;
            }
            else
                result.message = res.result.message;

            return result;
        });
    }

    BindPhoneForMember(data: { phone: string, code: string, password?: string }): Promise<any> {
        let channleInfo = this.ConfigCenter.GetChannleInfo();
        let result = { success: false, message: "", data: null };
        if (!data.phone || data.phone.length != 11) {
            console.warn("手机号格式错误!");
            result.message = "手机号格式错误";
            return Promise.resolve(result);
        }

        if (!data.code || data.code.length < 4 || data.code.length > 8) {
            console.warn("验证码格式错误!");
            result.message = "验证码格式错误!";
            return Promise.resolve(result);
        }

        let url = this.GetFullUrl(this._urls.BindPhone);
        let reqData = {
            mobile: data.phone,
            code: data.code,
            type: "mobilecode",
            token: "#",
            brandId: "#",
            channel: channleInfo.type,
            pwd: ""
        }

        if (data.password) {
            reqData.pwd = Common.Md5Encrypt(data.password);
        }

        return this.Request.Request("POST", url, { p: reqData }).then((res: any) => {
            console.log(res);
            if (res && res.result && res.result.message == "") {
                result.success = true;
                result.data = res.result.data;
            }
            else
                result.message = res.result.message;

            return result;
        });
    }

    RegisterMemberByPhone(data: { phone: string, code: string, password: string; }): Promise<any> {
        let channleInfo = this.ConfigCenter.GetChannleInfo();
        let result = { success: false, message: "", data: null };
        if (!data.phone || data.phone.length != 11) {
            console.warn("手机号格式错误!");
            result.message = "手机号格式错误";
            return Promise.resolve(result);
        }

        if (!data.code || data.code.length < 4 || data.code.length > 8) {
            console.warn("验证码格式错误!");
            result.message = "验证码格式错误!";
            return Promise.resolve(result);
        }

        let url = this.GetFullUrl(this._urls.RegisterMemberByPhone);
        let reqData = {
            mobile: data.phone,
            code: data.code,
            type: "mobilecode",
            pwd: Common.Md5Encrypt(data.password),
            regSource: channleInfo.name,
            channel: channleInfo.type,
            brandId: "#"
        }

        return this.Request.Request("POST", url, { p: reqData }).then((res: any) => {
            console.log(res);
            if (res && res.result && res.result.message == "") {
                result.success = true;
                result.data = res.result.data;
            }
            else
                result.message = res.result.message;

            return result;
        });
    }

    CheckMember(): Promise<any> {
        let url = this.GetFullUrl(this._urls.CheckMember);
        let reqData = {
            p: {
                channel: 'wechat',
                gradeId: 'null',
                token: "#",
            }
        };

        return this.Request.Request("POST", url, reqData).then((res: any) => {
            if (res) {
                return res;
            }
        })
    }

    UpdateAccountPassword(info: {
        phone: string,
        password: string,
        password2: string,
        code: string
    }): Promise<any> {
        let randomStr = ("" + Math.random()).substr(2, 4) + ("" + Math.random()).substr(4, 4) + ("" + Math.random()).substr(4, 4); //随机字符串
        let brandInfo = this.GetBrandInfo();
        let url = this.GetFullUrl(this._urls.UpdateAccountPassword);
        let reqData = {
            storeId: "#",
            brandId: "#",
            count: 3,
            exchangTokenUrl: `http://estaff.xxxx.cn/#/?k=${brandInfo.brandId}${randomStr}`, //这玩意不知道对不对
            mobile: info.phone,
            pwd: info.password,
            npwd: info.password2,
            code: info.code
        };
        return this.Request.Request("POST", url, { p: reqData }).then(res => {
            let result = this.GetResult();
            result.success = res.errMsg == "ok";
            result.message = res.errMsg;
            result.data = res;
            return result;
        });
    }
}
