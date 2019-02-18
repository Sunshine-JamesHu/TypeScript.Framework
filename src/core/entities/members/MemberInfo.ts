export class MemberInfo {
    constructor(memberId: number, mobile: string, brandId?: number, gradeId?: string | number) {
        this.LGV = 0;
        this.balance = 0;
        this.brandId = brandId ? brandId : 100224;
        this.consumerCnt = 0;
        this.disCount = 0;
        this.gradeId = gradeId;
        this.gradeName = undefined;
        this.id = 0;
        this.integral = 0;
        this.isPwd = 0;
        this.memberId = memberId;
        this.mobile = mobile;
        this.openNosecret = 0;
        this.originalNo = undefined;
        this.realName = undefined;
        this.sex = undefined;
    }

    public LGV: number;
    public balance: number;
    public birthday?: string;
    public brandId: number;
    public consumerCnt: number;
    public disCount: number;
    public gradeId?: string | number
    public gradeName?: string;
    public headPic?: string;
    public id: number;
    public integral: number;
    public isPwd: number;
    public memberId: number;
    public mobile: string;
    public nickName?: string;
    public openNosecret: 0;
    public originalNo?: string;
    public realName?: string;
    public sex?: string;
}