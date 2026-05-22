export interface UserInfo {
  _id?: string;
  _openid?: string;
  nickName: string;
  avatarUrl: string;
  lastLogin?: Date;
}

export interface LoginResult {
  code: number;
  data: UserInfo;
  msg?: string;
}
