"use strict";
const common_vendor = require("../common/vendor.js");
const cloud = common_vendor.index.cloud;
cloud.init({
  env: "cloud1-d4g789fy0fdab14e8",
  traceUser: true
});
function callFunction(name, data) {
  return new Promise((resolve, reject) => {
    cloud.callFunction({
      name,
      data: data || {},
      success: (res) => resolve(res.result),
      fail: (err) => reject(err)
    });
  });
}
exports.callFunction = callFunction;
