# 世界架构

新建城镇采用 [临街地块布局](frontage.md)，建筑从路边推算位置，配套入口小径、院落和路边带。

背包使用独立 inventory 阶段与持久化进度事件，B 打开，详见 [背包系统](inventory.md)。

最新城市分级与分层路网见 [世界道路规划 v3](world-road-plan.md)，旧档保留道路规划快照，新 seed 使用小中大城市与带绕行连接的区域路网。

当前版本采用 2048×2048 米有限世界，1 世界单位 = 1 米，地面顶点间距为 1 米。地面连续，不是体素或挖方块系统。具体规划与扩展入口见 [世界规划 v2](world2048.md)。

人物、门洞、道路、碰撞与新资产的统一尺寸见 [世界尺度规范](world-scale.md)，运行时基准集中在 `world/worldMetrics.js`。

## 分层

- `world/worldConfig.js`：世界尺寸、边界、区域包含判定。
- `world/generation/generateWorld.js`：seed 驱动的完整规划快照，不依赖 Babylon、React 或浏览器。
- `world/biomes/`：生态配方、区域与子生态混合、道路距离查询。
- `world/settlements/createRegionalSettlement.js`：城市与村庄的道路、地块、建筑、院落组合。
- `assets/buildings/`、`assets/environment/`：独立资产配方和几何工厂。
- `assets/createAssetRegistry.js`：assetId 到共享模板、实例和材质的映射。
- `world/chunks/`：按坐标采样地面、生态散布、区块队列、碰撞和释放。
- `persistence/worldRepository.js`：版本与数据校验、快照存储、revision 冲突检测。
- `world/progress.js`：发现区域、备注、位置和迷雾等进度数据。
- `world/createDayNightCycle.js`：可保存的世界时间与连续光照参数。
- `scenes/createWorldScene.js`：运行时装配、相机、移动和会话释放。
- `stores/useGameStore.js`、`useWorldStore.js`：游戏阶段、世界会话与进度。
- `stores/useNavigationStore.js`、`game/map/`、`ui/map/`：10Hz 导航状态与地图显示。

Babylon 对象不进入 Zustand 或存档。角色逐帧状态由场景管理；地图读取低频导航状态；世界规划变化才重建运行时。

菜单和游戏由 HashRouter 分离，游戏页通过 React.lazy 加载。刷新只进入菜单；点击开始后才读取世界并下载 Babylon 场景代码。初始区块分帧生成并显示进度，详见 [按需加载](loading.md)。

独立 `#/assets` 路由提供 [开发者资产目录](asset-gallery.md)，按分类浏览并仅创建当前选中的模型，不读取世界存档。

## 生成与资源

完整世界有 64×64 个逻辑区块，每块 32×32 米。角色周围 5×5 块优先，移动方向提前预取 24 米，离开 7×7 保留范围后逐帧卸载，世界外不排队。

地形高度和法线由全局坐标采样，共边顶点一致；角色采用地面三角面插值高度。道路按 64 米桶索引，噪声采样缓存有容量上限。生态和自然物依照 seed、版本、区块与对象序号确定，重载不重新随机。

资产模板与材质共享，通过实例复用；区块释放实例，世界释放模板和缓存。碰撞使用独立占地矩形或半径。模型替换保持 assetId、枢轴和占地约定即可，异步 glTF 尚未接入。

地形、法线、资产落地高度和道路像素由 chunk.worker.js 计算，TypedArray 通过 transferable buffer 传回。主线程按约 3ms 软预算分步安装；首次进入逐帧预热模板。单个 GPU 操作不可中断，尚无 LOD，性能没有实测。

## 存档与版本

一致性依赖 seed、生成器/地形/资产配方版本和世界规划快照。Seed 去除首尾空格并进行 Unicode NFC 规范化，长度 1–80，大小写敏感。

当前 v2 使用 IndexedDB 数据库 game001-worlds，worlds 和 progress 分别存放规划与进度。首次进入会导入对应 localStorage v2 存档，原数据保留为备份；随后以 IndexedDB 为准。旧 v1 数据不迁移。generateWorldV1.js 仅保留历史实现，不代表完整 v1 运行时兼容。

规划、位置、区域发现、备注和迷雾分开。区域标注使用稳定 regionId，组合资产使用稳定子对象 ID。位置和探索每 2 秒及暂停、打开地图、离开页面时保存。错误显式展示，不偷偷重置损坏存档。

asyncWorldRepository.js 使用 IndexedDB 异步事务只写进度，规划不会随每次检查点重写。revision 的比较与写入处于同一个事务，拒绝跨标签过期覆盖。Store 将打开与进度事件串行排队，事务完成后确认进度，并保持规划对象引用稳定。进度内部仍整份保存，尚未拆分迷雾小块。

暂停、切后台和退出路由会补存，pagehide 尝试异步补存；浏览器强制结束进程时不保证最后一次事务完成，恢复点以最近成功的检查点为准。

## 操作与表现

正交镜头固定水平斜向 45°、俯角 45°，跟随角色。WASD、方向键或点击地面移动；点击采用直线移动和简单滑动碰撞，尚无全局寻路。暂停、失焦或打开地图会清空移动输入。

完整昼夜为现实 24 分钟，时间、天空、雾、环境光和直射光连续变化。暂停与地图冻结世界时间，进度检查点保存当前时刻。详见 [昼夜循环](day-night.md)。

M 打开迷雾地图，右上角显示雷达、所在区域和世界坐标。详见 [地图](map.md)、[建筑](buildings.md)、[道路](roads.md)。建筑为外壳，尚无室内或搜刮玩法。

遵守 AGENTS.md：不运行测试、build 或 lint。
