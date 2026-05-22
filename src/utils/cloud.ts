interface CloudResult<T = any> {
  code: number;
  data?: T;
  msg?: string;
  [key: string]: any;
}

const cloud = uni.cloud as any;
cloud.init({
  env: 'cloud1-d4g789fy0fdab14e8',
  traceUser: true,
});

export function callFunction<T = any>(
  name: string,
  data?: Record<string, any>,
): Promise<CloudResult<T>> {
  return new Promise((resolve, reject) => {
    cloud.callFunction({
      name,
      data: data || {},
      success: (res: any) => resolve(res.result as CloudResult<T>),
      fail: (err: any) => reject(err),
    });
  });
}

export { cloud };
