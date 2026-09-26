export const questions = [
  { id: "systems", ask: "现有系统是什么？能读什么，哪些不能改？" },
  { id: "users", ask: "谁用，在哪种设备上看？" },
  { id: "objects", ask: "要管理哪些对象，各有多少？" },
  { id: "authority", ask: "业务口径和可见范围由谁决定？" },
  { id: "goal", ask: "这次最需要解决什么，什么结果算完成？" },
  {
    id: "materials",
    ask: "仓库有哪些数据、表单、规则和测试？找不到写给不出。",
  },
];
export const types = [
  {
    id: "data-app",
    name: "数据应用",
    status: "ready",
    packs: ["delivery-data-app"],
    pick_when: "列表、后台、数据看板",
    materials: ["现有系统", "使用者与设备", "对象数量", "口径负责人"],
  },
  {
    id: "enterprise",
    name: "企业交付",
    status: "partial",
    packs: [],
    pick_when: "跨模块企业系统",
    materials: ["领域规格", "模块清单"],
    read: "https://github.com/LSRabbit6/cursor-genesis/tree/main/stable/packs/enterprise",
  },
  {
    id: "retail-multistore",
    name: "零售 · 多门店",
    status: "skeleton",
    packs: [],
    pick_when: "多门店经营协作",
    materials: ["后台可导出的表", "门店和岗位", "老板规则原话"],
  },
  {
    id: "pathology",
    name: "病理科研",
    status: "skeleton",
    packs: [],
    pick_when: "文献监测和科研运营",
    materials: ["检索词", "报表读者"],
  },
  {
    id: "other",
    name: "其他领域",
    status: "blank",
    packs: [],
    pick_when: "以上类型无法覆盖",
    materials: [
      "现有系统",
      "制度与表单",
      "组织岗位",
      "行业红线",
      "目标时间窗",
      "指标口径",
    ],
  },
];
export const skeleton =
  "观测：按现有权威材料记录事实。\n边界：只读现有系统，业务口径待负责人确认。\n规范：先写设计，列出验收与不变量。\n比较器：保留原始数据、复算结果和差异。\n具体步骤：给不出，需要项目材料；不得自行补业务阈值。";
export const checklist = {
  version: "1.0",
  intro:
    "拿清单 → 本仓自查 → 交回 → 按回执做 → 查编号。判断在项目中完成，服务按类型查表。",
  rules: [
    "只从本仓和使用者原话取材；未知写给不出。",
    "业务判据与可见范围由负责人定。",
    "只提交明确选择的材料，不自动上传整个仓库。",
  ],
  questions,
  types,
  materials_for_other: types.at(-1).materials,
  answer_template: {
    project: "你的项目",
    types: ["data-app"],
    answers: Object.fromEntries(questions.map((q) => [q.id, "给不出"])),
    materials: [],
  },
};
export const statusNames = {
  open: "待处理",
  accepted: "已接受",
  ready: "有包可用",
  resolved: "已处理",
  declined: "暂不做",
  closed: "已撤回",
};
export const evidenceNames = {
  installed: "已安装",
  connected: "已接入",
  loaded: "已加载",
  triggered: "已触发",
  checked: "检查结果",
  accepted: "验收结果",
  delivered: "交付结果",
};
