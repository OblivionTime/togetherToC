/*
 * @Description: 
 * @Version: 1.0
 * @Autor: solid
 * @Date: 2022-12-12 14:17:27
 * @LastEditors: solid
 * @LastEditTime: 2022-12-13 15:15:22
 */
function deviceWSClientSet() { }

// websocket客户端列表
deviceWSClientSet.prototype.client_map = {};
deviceWSClientSet.prototype.client_avatar_map = {};
// 添加
deviceWSClientSet.prototype.add = function (name, ws, avatar) {
    this.client_map[name] = ws
    this.client_avatar_map[name] = avatar
};
// 移除
// deviceWSClientSet.prototype.remove = function (name) {
//     delete this.client_map[name]
//     delete this.client_avatar_map[name]
// };
// websocket客户端对象
let deviceClientSet = new deviceWSClientSet();

exports.deviceClientSet = deviceClientSet;