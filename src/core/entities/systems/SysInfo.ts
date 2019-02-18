/**
 * 登录用户信息
 */
export class SysInfo {
    constructor(data: {
        sysId?: number,
        sysName?: string,
        sysPhone?: string,
        memberId?: number,
        openId?: string,
        token: { loginToken: string, token: string }
    }
    ) {
        if (data.sysId) {
            this.sysId = data.sysId;
            this.sysName = data.sysName;
            this.sysPhone = data.sysPhone;

            this.isUser = true;
        }
        else {
            this.memberId = data.memberId;
            this.openId = data.openId;
            this.isUser = false;
        }
        this.token = data.token;
    }

    /**
     * 登录人Id
     */
    sysId?: number;

    /**
     * 登录人名称
     */
    sysName?: string;

    /**
     * 登录人手机号
     */
    sysPhone?: string;

    /**
     * 用户Id
     */
    memberId?: number;

    /**
     * true:员工,fasle:用户
     */
    isUser: boolean;

    /**
     * openId
     */
    openId?: string;

    /**
     * 登录的Token
     */
    token: { loginToken: string, token: string }
}