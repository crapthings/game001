# 现代末日建筑库 v1

10 个纯代码 low-poly 外观模型，无贴图或外部模型依赖。当前是可复用的建筑外壳，不包含室内、搜刮、开门或破坏玩法。

| assetId | 模型 | 主要特征 |
| --- | --- | --- |
| building.house | 独栋住宅 | 单层坡屋顶、烟囱、门廊、封窗木板 |
| building.townhouse | 联排住宅 | 双层立面、层间腰线、门廊 |
| building.apartments | 公寓楼 | 三层、阳台栏杆、屋顶楼梯间 |
| building.corner-store | 便利店 | 临街橱窗、遮雨棚、招牌底板 |
| building.diner | 路边餐馆 | 宽橱窗、外摆长椅、厨房排烟设备 |
| building.clinic | 社区诊所 | 双层、医疗十字、设备屋面 |
| building.police | 警务站 | 双层、安保窗栏、屋顶无线电天线 |
| building.workshop | 汽车修理厂 | 双维修卷帘门、废轮胎、坡屋顶 |
| building.warehouse | 物流仓库 | 宽装卸门、货台、木箱 |
| building.gas-station | 加油站 | 便利亭、独立雨棚、三组加油机和防撞柱 |

## 随机性与复用

`src/game/assets/buildings/catalog.js` 定义尺寸、楼层、占地、类别和入口。
每个模型有固定 `modelSeed`，确定墙体配色、封窗和污损细节。十个模型外观固定，可在不同街区重复使用。
`src/game/assets/buildings/createBuildingModel.js` 按配方组装建筑，并按共享材质合并部件。
`createAssetRegistry.js` 缓存模板，通过实例化复用，统一管理材质释放。
世界 seed 只决定建筑在街区里的排列；不会每次加载重新随机建筑外观。

程序布置沿用现有接口：

```js
assets.create({
  id: 'town-02/lot-07',
  assetId: 'building.corner-store',
  position: [x, groundY, z],
  rotation: Math.PI,
  scale: 1,
}, chunkRoot, 'town-02')
```

模型坐标约定：Y 向上，底部原点贴地，门朝 +Z。入口位置和 `sockets` 为后续导航/交互预留。
`footprint` 是包含屋檐、门廊等外凸部分的保守矩形范围，当前作为整栋建筑碰撞；加油站也暂按整个地块阻挡。
未来可以替换为正式模型和更精细碰撞体，保留 assetId、尺寸及入口约定即可。

## 当前城镇接入

v2 通过 `createRegionalSettlement.js` 创建 3 座城市和 4 个村庄。城市采用 [环路与功能街区](roads.md)，建筑朝向最近道路；村庄一条街，每侧五个地块，使用 [独立乡村建筑库](village-buildings.md)。村庄地块间距 23 米，临街建筑中心距道路 19 米。模型从不同类型池中按 seed 选择，跨区道路优先，冲突地块被移除。

地面在聚落内平整，边缘衔接生态；默认自然散布避开聚落与道路。院落引用独立环境模块组合，详见 [世界规划](world2048.md)。建筑随其中心所在区块加载，碰撞独立于外观。

`createTownPlan.js` 保留初版灰桥镇生成器和地面覆盖辅助函数；当前 v2 不再自动给旧存档追加灰桥镇。v1 数据保留，v2 世界独立存储。

## 后续扩展

- 增加更明确的住宅、商业、公共和工业街区分布。
- 增加支路、停车区、围墙和废弃车辆。
- 入口导航、室内、搜刮点、建筑受损状态。
- 将数据规划放入生成队列，按时间预算分帧创建模板，降低首次加载开销。

本次遵循 AGENTS.md，未运行测试、build 或 lint。
