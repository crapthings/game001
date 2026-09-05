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

## 初版城镇接入

`src/game/world/settlements/createTownPlan.js` 定义灰桥镇：主街两侧各五块地，十个模板各用一次；seed 通过固定洗牌决定排列。
地块间距为 23 单位，临街建筑中心距道路中心线 19 单位，入口统一朝主街。
建筑和占地保存在世界的 `settlements` 快照里，稳定对象 ID 使用城镇 ID + 地块编号。
旧版存档首次打开时仅追加城镇快照，保留 seed、既有区域和探索记录；如旧角色位置被新增建筑占用，会移至主街。

地面在城镇范围内平整，边缘平滑衔接自然地形；道路按区块裁切为柏油、人行道和标线。
城镇内不生成默认树石，避免穿进建筑或挡住道路。建筑随其中心所属区块加载和释放。
街区和模型均为 v1，正式发布后要保留旧版生成实现或显式迁移，不应无版本修改已有配方。

## 后续扩展

- 按住宅、商业、公共和工业类别安排街区，不再要求每种仅一栋。
- 多城镇、支路、停车区、围墙和废弃车辆。
- 入口导航、室内、搜刮点、建筑受损状态。
- 将数据规划放入生成队列，按时间预算分帧创建模板，降低首次加载开销。

本次遵循 AGENTS.md，未运行测试、build 或 lint。
