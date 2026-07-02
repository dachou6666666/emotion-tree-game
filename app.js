const STORAGE_KEY = "emotion-tree-game:v1";
const DAY_MS = 24 * 60 * 60 * 1000;

const app = document.querySelector("#app");
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const DEV_TOOLS_ENABLED = new URLSearchParams(window.location.search).get("dev") === "1";

const MEMBER_COLORS = ["#4f8f62", "#4a8aa6", "#cc6d5a", "#8aa558", "#8b5e3c", "#8d6fc7"];

const AVATAR_TYPES = [
  {
    id: "listener",
    name: "倾听者",
    role: "适合先安静听完，再回应对方的难受。",
    icon: "ear",
    color: "#4a8aa6",
    accent: "#d8eef4",
  },
  {
    id: "guardian",
    name: "守护者",
    role: "适合主动回应心结、稳定树的状态。",
    icon: "shield",
    color: "#4f8f62",
    accent: "#e3f4d4",
  },
  {
    id: "healer",
    name: "修复师",
    role: "适合写感谢、采摘果子恢复关系。",
    icon: "heart",
    color: "#cc6d5a",
    accent: "#ffe2da",
  },
  {
    id: "keeper",
    name: "记录者",
    role: "适合记录约定和复盘每天的照顾。",
    icon: "notebook-pen",
    color: "#d99a28",
    accent: "#fff1c8",
  },
];

const TREE_SHAPES = [
  {
    id: "heritage",
    name: "共生橡树",
    tag: "厚重稳定",
    icon: "tree-deciduous",
    desc: "树冠最饱满，适合想要安全感和稳定感的关系。",
  },
  {
    id: "willow",
    name: "和解柳树",
    tag: "柔软垂枝",
    icon: "cloud-rain",
    desc: "枝叶会向下舒展，适合强调倾听和情绪缓冲。",
  },
  {
    id: "bloom",
    name: "花冠共生树",
    tag: "开花治愈",
    icon: "flower-2",
    desc: "树冠带花簇，适合把感谢和复盘做成关系仪式。",
  },
  {
    id: "sentinel",
    name: "守望松树",
    tag: "高耸清晰",
    icon: "tree-pine",
    desc: "形态更高、更像守护塔，适合明确规则和边界。",
  },
];

const TREE_MODELS = [
  {
    id: "common-tree",
    name: "经典阔叶树",
    tag: "饱满自然",
    icon: "tree-deciduous",
    url: "/assets/models/trees/common-tree.glb",
    sourceId: "qZtx0AHhcy",
  },
  {
    id: "pine-wide",
    name: "宽冠松树",
    tag: "高大稳重",
    icon: "tree-pine",
    url: "/assets/models/trees/pine-wide.glb",
    sourceId: "rfnxJv0Rqa",
  },
  {
    id: "pine-tall",
    name: "高挑松树",
    tag: "清爽挺拔",
    icon: "tree-pine",
    url: "/assets/models/trees/pine-tall.glb",
    sourceId: "igSu0cPoBz",
  },
  {
    id: "pine-compact",
    name: "紧凑松树",
    tag: "小巧集中",
    icon: "tree-pine",
    url: "/assets/models/trees/pine-compact.glb",
    sourceId: "79gmlLnweB",
  },
  {
    id: "twisted-emerald",
    name: "弯枝绿树",
    tag: "童话感强",
    icon: "trees",
    url: "/assets/models/trees/twisted-emerald.glb",
    sourceId: "9aWlx82xUf",
  },
  {
    id: "twisted-round",
    name: "圆冠弯枝树",
    tag: "柔和治愈",
    icon: "trees",
    url: "/assets/models/trees/twisted-round.glb",
    sourceId: "GVTsMmuzv7",
  },
  {
    id: "twisted-amber",
    name: "暖色弯枝树",
    tag: "温暖醒目",
    icon: "trees",
    url: "/assets/models/trees/twisted-amber.glb",
    sourceId: "8oraKn9m0x",
  },
];

const GAME_TABS = [
  { id: "garden", label: "共生花园", icon: "trees" },
  { id: "avatar", label: "角色形象", icon: "user-round-cog" },
  { id: "tree", label: "树形进化", icon: "tree-pine" },
  { id: "quest", label: "任务图鉴", icon: "scroll-text" },
];

let state = loadState();
let ui = {
  tab: "login",
  gameTab: "garden",
  toast: "",
  growthTransition: null,
  growthPreview: null,
};

const icon = (name, extraClass = "") =>
  `<i data-lucide="${name}" class="icon ${extraClass}" aria-hidden="true"></i>`;

function getAvatarType(id) {
  return AVATAR_TYPES.find((item) => item.id === id) || AVATAR_TYPES[0];
}

function getTreeShape(id) {
  return TREE_SHAPES.find((item) => item.id === id) || TREE_SHAPES[0];
}

function getTreeModel(id) {
  return TREE_MODELS.find((item) => item.id === id) || TREE_MODELS[0];
}

function todayNumber() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

function dayLabel(day) {
  const d = new Date(day * DAY_MS);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

function daysLeft(targetDay) {
  return targetDay - state.today;
}

function defaultState() {
  const today = todayNumber();
  return {
    version: 2,
    today,
    startedDay: today,
    sessionUserId: null,
    tree: makeSharedTree(today),
    timeline: [
      {
        id: uid(),
        day: today,
        text: "共生树已经种下，所有成员开始共同照顾同一棵树。",
      },
    ],
    users: [
      makeUser("林夕", "123456", "#4f8f62", "listener"),
      makeUser("周晨", "123456", "#4a8aa6", "guardian"),
    ],
  };
}

function makeSharedTree(today = todayNumber()) {
  return {
    id: "shared-tree",
    name: "我们的共生树",
    shape: "heritage",
    model: "common-tree",
    hp: 100,
    careCount: 0,
    growthPoints: 8,
    careLog: {},
    fruits: [
      {
        id: uid(),
        label: "耐心果",
        createdDay: today - 4,
        matureDay: today - 1,
        harvested: false,
      },
      {
        id: uid(),
        label: "倾听果",
        createdDay: today - 1,
        matureDay: today + 2,
        harvested: false,
      },
    ],
    bugs: [],
  };
}

function makeUser(name, password, color, avatar = "listener") {
  return {
    id: uid(),
    name,
    password,
    color,
    avatar: getAvatarType(avatar)?.id || "listener",
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrateState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function migrateState(parsed) {
  if (!parsed?.users?.length) return defaultState();

  const today = todayNumber();
  const startedDay = Number.isFinite(parsed.startedDay) ? parsed.startedDay : inferStartedDay(parsed, today);
  const users = parsed.users.map((user, index) => ({
    id: user.id || uid(),
    name: user.name || `成员${index + 1}`,
    password: user.password || "123456",
    color: user.color || MEMBER_COLORS[index % MEMBER_COLORS.length],
    avatar: getAvatarType(user.avatar)?.id || AVATAR_TYPES[index % AVATAR_TYPES.length].id,
  }));

  const tree = parsed.tree
    ? normalizeTree(parsed.tree, today, users)
    : migrateSharedTreeFromUsers(parsed.users, users, today);

  const sessionUserId = users.some((user) => user.id === parsed.sessionUserId) ? parsed.sessionUserId : null;

  return {
    version: 2,
    today,
    startedDay,
    sessionUserId,
    tree,
    users,
    timeline: Array.isArray(parsed.timeline) ? parsed.timeline.slice(0, 24) : [],
  };
}

function inferStartedDay(parsed, today) {
  const days = [Number.isFinite(parsed.today) ? parsed.today : today];
  if (Array.isArray(parsed.timeline)) {
    parsed.timeline.forEach((item) => {
      if (Number.isFinite(item.day)) days.push(item.day);
    });
  }
  const trees = parsed.tree ? [parsed.tree] : parsed.users || [];
  trees.forEach((tree) => {
    (tree.fruits || []).forEach((fruit) => {
      if (Number.isFinite(fruit.createdDay)) days.push(fruit.createdDay);
    });
    (tree.bugs || []).forEach((bug) => {
      if (Number.isFinite(bug.createdDay)) days.push(bug.createdDay);
    });
  });
  return Math.min(...days.filter(Number.isFinite), today);
}

function normalizeTree(tree, today, users) {
  const fallback = makeSharedTree(today);
  const userById = new Map(users.map((user) => [user.id, user]));

  return {
    id: tree.id || fallback.id,
    name: tree.name || "我们的共生树",
    shape: getTreeShape(tree.shape)?.id || fallback.shape,
    model: getTreeModel(tree.model)?.id || fallback.model,
    hp: clamp(Number.isFinite(tree.hp) ? tree.hp : fallback.hp, 0, 100),
    careCount: Number.isFinite(tree.careCount) ? tree.careCount : 0,
    growthPoints: Number.isFinite(tree.growthPoints)
      ? Math.max(0, tree.growthPoints)
      : Math.max(0, Number.isFinite(tree.careCount) ? tree.careCount : 0),
    careLog: normalizeCareLog(tree.careLog || {}),
    fruits: Array.isArray(tree.fruits) ? tree.fruits.map((fruit) => normalizeFruit(fruit, today)).filter(Boolean) : fallback.fruits,
    bugs: Array.isArray(tree.bugs)
      ? tree.bugs.map((bug) => normalizeBug(bug, userById.get(bug.authorId), today)).filter(Boolean)
      : [],
  };
}

function migrateSharedTreeFromUsers(oldUsers, users, today) {
  const fallback = makeSharedTree(today);
  const userById = new Map(users.map((user) => [user.id, user]));
  const hpValues = oldUsers.map((user) => user.hp).filter(Number.isFinite);

  const fruits = oldUsers.flatMap((user) =>
    Array.isArray(user.fruits) ? user.fruits.map((fruit) => normalizeFruit(fruit, today)).filter(Boolean) : [],
  );

  const bugs = oldUsers.flatMap((user) => {
    if (!Array.isArray(user.bugs)) return [];
    return user.bugs
      .map((bug) =>
        normalizeBug(
          {
            ...bug,
            authorId: bug.authorId || bug.ownerId || user.id,
            authorName: bug.authorName || user.name,
          },
          userById.get(bug.authorId || bug.ownerId || user.id),
          today,
        ),
      )
      .filter(Boolean);
  });

  return {
    ...fallback,
    hp: hpValues.length ? clamp(Math.round(hpValues.reduce((sum, hp) => sum + hp, 0) / hpValues.length), 0, 100) : 100,
    careCount: oldUsers.reduce((sum, user) => sum + (Number.isFinite(user.careCount) ? user.careCount : 0), 0),
    growthPoints: oldUsers.reduce((sum, user) => sum + (Number.isFinite(user.careCount) ? user.careCount : 0), 8),
    careLog: mergeOldCareLogs(oldUsers),
    fruits: fruits.length ? fruits : fallback.fruits,
    bugs,
  };
}

function normalizeCareLog(careLog) {
  return Object.fromEntries(
    Object.entries(careLog).map(([day, value]) => {
      if (!value || typeof value !== "object") return [day, {}];
      const hasNestedUsers = Object.values(value).some((entry) => entry && typeof entry === "object");
      if (hasNestedUsers) return [day, value];
      return [day, { legacy: value }];
    }),
  );
}

function mergeOldCareLogs(oldUsers) {
  const merged = {};
  oldUsers.forEach((user) => {
    Object.entries(user.careLog || {}).forEach(([day, actions]) => {
      merged[day] ||= {};
      merged[day][user.id] = actions;
    });
  });
  return merged;
}

function normalizeFruit(fruit, today = todayNumber()) {
  if (!fruit) return null;
  return {
    id: fruit.id || uid(),
    label: fruit.label || "关系果",
    createdDay: Number.isFinite(fruit.createdDay) ? fruit.createdDay : today,
    matureDay: Number.isFinite(fruit.matureDay) ? fruit.matureDay : today,
    harvested: Boolean(fruit.harvested),
  };
}

function normalizeBug(bug, author, today = todayNumber()) {
  if (!bug?.text) return null;
  return {
    id: bug.id || uid(),
    text: bug.text,
    need: bug.need || "认真听我说完",
    createdDay: Number.isFinite(bug.createdDay) ? bug.createdDay : today,
    expiresDay: Number.isFinite(bug.expiresDay) ? bug.expiresDay : today + 7,
    status: bug.status || "open",
    damageApplied: Boolean(bug.damageApplied),
    authorId: bug.authorId || author?.id || "",
    authorName: bug.authorName || author?.name || "某位成员",
    caughtBy: bug.caughtBy || "",
    caughtByName: bug.caughtByName || "",
    caughtDay: bug.caughtDay || null,
    reply: bug.reply || "",
  };
}

function saveState() {
  applyAging();
  persistState();
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncTimeWithRealWorld(silent = false) {
  const realToday = todayNumber();
  if (!Number.isFinite(state.today)) state.today = realToday;
  if (!Number.isFinite(state.startedDay)) state.startedDay = realToday;

  if (state.today < realToday) {
    const previousDay = state.today;
    while (state.today < realToday) {
      state.today += 1;
      applyAging();
    }
    if (!silent) {
      logEvent(`真实时间已从 ${dayLabel(previousDay)} 自动推进到 ${dayLabel(realToday)}。`);
    }
    persistState();
    return true;
  }

  if (state.today > realToday) {
    state.today = realToday;
    persistState();
    return true;
  }

  return false;
}

function currentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function sharedTree() {
  return state.tree;
}

function getInitials(name) {
  return (name || "树").slice(0, 2).toUpperCase();
}

function activeBugs(tree = sharedTree()) {
  return tree.bugs.filter((bug) => bug.status !== "resolved");
}

function urgentBugs(tree = sharedTree()) {
  return activeBugs(tree).filter((bug) => daysLeft(bug.expiresDay) <= 2);
}

function matureFruits(tree = sharedTree()) {
  return tree.fruits.filter((fruit) => !fruit.harvested && fruit.matureDay <= state.today);
}

function careTodayFor(user, tree = sharedTree()) {
  return tree.careLog[state.today]?.[user.id] || {};
}

function todayCareCount(tree = sharedTree()) {
  const dayLog = tree.careLog[state.today] || {};
  return Object.values(dayLog).reduce((sum, actions) => {
    if (!actions || typeof actions !== "object") return sum;
    return sum + Object.values(actions).filter(Boolean).length;
  }, 0);
}

function bugsByAuthor(userId, tree = sharedTree()) {
  return activeBugs(tree).filter((bug) => bug.authorId === userId);
}

function relationshipDay() {
  return Math.max(1, state.today - (state.startedDay || state.today) + 1);
}

function addGrowthPoints(tree, amount) {
  const current = Number.isFinite(tree.growthPoints) ? tree.growthPoints : tree.careCount || 0;
  tree.growthPoints = Math.max(0, current + amount);
}

function treeGrowthStats(tree = sharedTree()) {
  const points = Number.isFinite(tree.growthPoints) ? tree.growthPoints : tree.careCount || 0;
  const ratio = clamp(0.28 + points / 72, 0.28, 1);
  const percent = Math.round(ratio * 100);
  const stage = ratio >= 0.86 ? "繁茂共生树" : ratio >= 0.64 ? "舒展成长期" : ratio >= 0.45 ? "稳固幼树期" : "新芽扎根期";
  const nextPoint = ratio >= 1 ? 0 : Math.max(1, Math.ceil((Math.min(1, ratio + 0.01) - 0.28) * 72));

  return {
    points,
    ratio,
    percent,
    stage,
    nextPoint,
    scale: (0.78 + ratio * 0.28).toFixed(3),
    rise: `${Math.round((1 - ratio) * 58)}px`,
    reveal: `${Math.round((1 - ratio) * 12)}%`,
    leafOpacity: (0.18 + ratio * 0.46).toFixed(2),
  };
}

function growthStatsFromPercent(percent) {
  const safePercent = clamp(Math.round(percent), 0, 100);
  const ratio = safePercent / 100;
  const stage = ratio >= 0.81 ? "繁茂共生树" : ratio >= 0.51 ? "舒展成长期" : ratio > 0.2 ? "稳固幼树期" : "新芽扎根期";

  return {
    points: 0,
    ratio,
    percent: safePercent,
    stage,
    nextPoint: 0,
    scale: (0.78 + ratio * 0.28).toFixed(3),
    rise: `${Math.round((1 - ratio) * 58)}px`,
    reveal: `${Math.round((1 - ratio) * 12)}%`,
    leafOpacity: (0.18 + ratio * 0.46).toFixed(2),
  };
}

function growthStageId(percent) {
  if (percent <= 20) return "seedling";
  if (percent <= 50) return "sapling";
  if (percent <= 80) return "young";
  return "mature";
}

function queueGrowthTransition(fromGrowth, toGrowth, amount, reason = "care") {
  if (!fromGrowth || !toGrowth || toGrowth.percent <= fromGrowth.percent) return;
  ui.growthTransition = {
    id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
    fromPercent: fromGrowth.percent,
    toPercent: toGrowth.percent,
    amount,
    fromStage: growthStageId(fromGrowth.percent),
    toStage: growthStageId(toGrowth.percent),
    reason,
  };
}

function buildTreeSceneData(currentUser, tree, growth) {
  const colorByUser = new Map(state.users.map((user) => [user.id, user.color]));
  return {
    currentUserId: currentUser.id,
    hp: tree.hp,
    treeShape: getTreeShape(tree.shape).id,
    treeModel: getTreeModel(tree.model).id,
    treeModelUrl: getTreeModel(tree.model).url,
    growth: growth.percent,
    growthRatio: growth.ratio,
    stage: growth.stage,
    members: state.users.map((user) => ({
      id: user.id,
      name: user.name,
      color: user.color,
      avatar: getAvatarType(user.avatar).id,
      avatarName: getAvatarType(user.avatar).name,
      active: user.id === currentUser.id,
    })),
    bugs: activeBugs(tree).map((bug) => ({
      id: bug.id,
      authorId: bug.authorId,
      authorName: bug.authorName,
      color: colorByUser.get(bug.authorId) || "#bd6a58",
      urgent: daysLeft(bug.expiresDay) <= 2,
      damaged: Boolean(bug.damageApplied),
    })),
    fruitCount: tree.fruits.filter((fruit) => !fruit.harvested).length,
    matureFruitCount: matureFruits(tree).length,
    growthAnimation: ui.growthPreview || ui.growthTransition,
  };
}

function logEvent(text) {
  state.timeline.unshift({ id: uid(), day: state.today, text });
  state.timeline = state.timeline.slice(0, 24);
}

function applyAging() {
  const tree = sharedTree();
  tree.bugs.forEach((bug) => {
    if (bug.status !== "resolved" && !bug.damageApplied && state.today >= bug.expiresDay) {
      bug.damageApplied = true;
      tree.hp = clamp(tree.hp - 1, 0, 100);
      addGrowthPoints(tree, -1);
      logEvent(`${bug.authorName} 的一只心结虫停留太久，树叶有些暗淡，系统发出一次温和提醒。`);
    }
  });
}

function render() {
  applyAging();
  const pendingGrowthTransition = ui.growthTransition;
  const pendingGrowthPreview = ui.growthPreview;
  const user = currentUser();
  app.innerHTML = user ? renderApp(user, sharedTree()) : renderLogin();

  if (ui.toast) {
    app.insertAdjacentHTML("beforeend", `<div class="toast">${escapeHtml(ui.toast)}</div>`);
    window.setTimeout(() => {
      ui.toast = "";
      document.querySelector(".toast")?.remove();
    }, 2300);
  }

  bindEvents();
  window.lucide?.createIcons();
  animateGrowthMeters();
  window.dispatchEvent(new CustomEvent("emotion-tree:render"));
  if (pendingGrowthTransition) {
    ui.growthTransition = null;
  }
  if (pendingGrowthPreview) {
    ui.growthPreview = null;
  }
}

function animateGrowthMeters() {
  window.requestAnimationFrame(() => {
    document.querySelectorAll("[data-growth-target]").forEach((bar) => {
      bar.style.width = `${bar.dataset.growthTarget}%`;
    });
  });
}

function renderLogin() {
  const accountOptions = state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)} / 共生树成员</option>`)
    .join("");

  return `
    <section class="login-screen">
      <div class="login-card">
        <div class="login-intro">
          <div>
            <div class="brand-mark">${icon("sprout")}</div>
            <h1>共生树</h1>
            <p>所有人共同守护一棵树。难受可以变成心结虫，回应会让树叶重新变亮；心结停留太久时，系统只会温和提醒大家回来看看它。</p>
          </div>
          ${renderMiniTree()}
        </div>

        <div class="login-forms">
          <div class="tabs" role="tablist">
            <button class="tab ${ui.tab === "login" ? "active" : ""}" data-tab="login" type="button">登录</button>
            <button class="tab ${ui.tab === "adopt" ? "active" : ""}" data-tab="adopt" type="button">加入共生树</button>
          </div>

          <form class="panel form-grid ${ui.tab === "login" ? "" : "hidden"}" data-form="login">
            <div class="panel-title">
              <h2>${icon("key-round")}进入共生树</h2>
              <small>演示密码都是 123456</small>
            </div>
            <div class="field">
              <label for="loginUser">账号</label>
              <select id="loginUser" name="userId">${accountOptions}</select>
            </div>
            <div class="field">
              <label for="loginPassword">密码</label>
              <input id="loginPassword" name="password" type="password" value="123456" autocomplete="current-password" />
            </div>
            <button class="btn leaf" type="submit">${icon("log-in")}进入</button>
          </form>

          <form class="panel form-grid ${ui.tab === "adopt" ? "" : "hidden"}" data-form="adopt">
            <div class="panel-title">
              <h2>${icon("user-plus")}加入共生树</h2>
            </div>
            <div class="field">
              <label for="adoptName">你的名字</label>
              <input id="adoptName" name="name" maxlength="12" placeholder="例如：阿晴" required />
            </div>
            <div class="field">
              <label for="adoptPassword">设置密码</label>
              <input id="adoptPassword" name="password" type="password" minlength="4" placeholder="至少 4 位" required />
            </div>
            <button class="btn sky" type="submit">${icon("badge-plus")}保存并进入</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function relationshipMood(tree) {
  const open = activeBugs(tree).length;
  const urgent = urgentBugs(tree).length;
  const caredMembers = state.users.filter((member) => Object.values(careTodayFor(member, tree)).some(Boolean)).length;

  if (tree.hp <= 35) {
    return {
      tone: "low",
      title: "树叶有些暗淡",
      body: "今天适合先慢下来，回应一个心结，或给树一点照顾。",
    };
  }

  if (urgent > 0) {
    return {
      tone: "watch",
      title: "有心结等待被看见",
      body: `${urgent} 个心结已经停留了一阵子，可以温柔地靠近它。`,
    };
  }

  if (open > 0) {
    return {
      tone: "listen",
      title: "树下还有未说完的话",
      body: `${open} 个心结正在树旁停留，等待另一个人认真回应。`,
    };
  }

  if (caredMembers >= state.users.length) {
    return {
      tone: "bright",
      title: "今天的照顾很完整",
      body: "每位守护者都来过，树把这些善意记住了。",
    };
  }

  return {
    tone: "calm",
    title: "共生树正在安静生长",
    body: "今天只需要一个小动作，就能让关系继续往前长一点。",
  };
}

function renderTopbarStatus(user, tree) {
  const mood = relationshipMood(tree);
  return `
    <div class="relationship-status ${mood.tone}">
      <span class="status-orb" aria-hidden="true"></span>
      <div>
        <strong>${mood.title}</strong>
        <small>${mood.body}</small>
      </div>
      <span class="relationship-temp">${tree.hp}°</span>
    </div>
    <div class="top-actions">
      <span class="pill">${icon("user-round", "icon-sm")}守护者：${escapeHtml(user.name)}</span>
      <span class="pill">${icon("calendar-heart", "icon-sm")}今天：${dayLabel(todayNumber())}</span>
      <button class="btn ghost" data-action="logout" type="button">${icon("log-out")}离开树下</button>
    </div>
  `;
}

function renderApp(user, tree) {
  const growth = treeGrowthStats(tree);

  return `
    <section class="app game-home">
      <header class="topbar game-topbar">
        <div class="brand">
          <div class="brand-mark">${icon("sprout")}</div>
          <div>
            <h1>${escapeHtml(tree.name)}</h1>
            <p>我们共同守护的第 ${relationshipDay()} 天 · ${growth.stage}</p>
          </div>
        </div>
        ${renderTopbarStatus(user, tree)}
      </header>

      <div class="layout relationship-layout">
        <aside class="side-stack care-column">
          ${renderCarePanel(user, tree)}
          ${renderGuardianPanel(user, tree)}
        </aside>

        <section class="center-stage tree-focus">
          ${renderTreePanel(user, tree)}
        </section>

        <aside class="right-stack heart-column">
          ${renderBugPanel(user, tree)}
          ${renderTodayResponsePanel(user, tree)}
        </aside>

        <section class="bottom-memory">
          ${renderFruitPanel(tree)}
          ${renderTimelinePanel()}
        </section>
      </div>
    </section>
  `;
}

function renderGameNav(activeTab) {
  return `
    <nav class="game-nav" aria-label="游戏玩法导航">
      ${GAME_TABS.map(
        (tab) => `
          <button class="game-tab ${tab.id === activeTab ? "active" : ""}" data-game-tab="${tab.id}" type="button">
            ${icon(tab.icon)}
            <span>${tab.label}</span>
          </button>
        `,
      ).join("")}
    </nav>
  `;
}

function renderRightStack(activeTab, user, tree) {
  if (activeTab === "avatar") {
    return `
      ${renderCharacterPanel(user)}
      ${renderRosterPanel(user, tree)}
      ${renderTimelinePanel()}
    `;
  }

  if (activeTab === "tree") {
    return `
      ${renderTreeShapePanel(tree)}
      ${renderFruitPanel(tree)}
      ${renderIdeasPanel()}
    `;
  }

  if (activeTab === "quest") {
    return `
      ${renderQuestPanel(user, tree)}
      ${renderCodexPanel(tree)}
      ${renderTimelinePanel()}
    `;
  }

  return `
    ${renderBugPanel(user, tree)}
    ${renderFruitPanel(tree)}
    ${renderQuestPanel(user, tree)}
    ${renderTimelinePanel()}
  `;
}

function renderGardenDashboard(user, tree) {
  const avatar = getAvatarType(user.avatar);
  const shape = getTreeShape(tree.shape);
  const urgent = urgentBugs(tree).length;
  const mature = matureFruits(tree).length;
  const myCare = Object.values(careTodayFor(user, tree)).filter(Boolean).length;
  const open = activeBugs(tree).length;

  return `
    <section class="panel game-dashboard">
      <div class="panel-title">
        <h2>${icon("gamepad-2")}今日小仪式</h2>
        <small>${avatar.name} · ${shape.name}</small>
      </div>
      <div class="dashboard-grid">
        <article class="mission-card">
          <span>${icon("hand-heart")}</span>
          <strong>${myCare}/3</strong>
          <small>我的照顾</small>
        </article>
        <article class="mission-card ${urgent ? "danger" : ""}">
          <span>${icon("bug")}</span>
          <strong>${urgent}</strong>
          <small>临近心结</small>
        </article>
        <article class="mission-card">
          <span>${icon("apple")}</span>
          <strong>${mature}</strong>
          <small>成熟记忆果</small>
        </article>
        <article class="mission-card">
          <span>${icon("activity")}</span>
          <strong>${open}</strong>
          <small>待看见</small>
        </article>
      </div>
    </section>
  `;
}

function renderGuardianPanel(current, tree) {
  const caredCount = state.users.filter((member) => Object.values(careTodayFor(member, tree)).some(Boolean)).length;

  return `
    <section class="panel guardian-panel">
      <div class="panel-title">
        <h2>${icon("users-round")}树下守护者</h2>
        <button class="btn icon-only secondary" data-action="show-adopt" type="button" title="新增守护者">${icon("user-plus")}</button>
      </div>
      <p class="panel-whisper">${caredCount}/${state.users.length} 位守护者今天来照顾过这棵树。</p>
      <div class="guardian-list">
        ${state.users
          .map((member) => {
            const avatar = getAvatarType(member.avatar);
            const cared = Object.values(careTodayFor(member, tree)).some(Boolean);
            const knots = bugsByAuthor(member.id, tree).length;
            return `
              <button class="guardian-row ${member.id === current.id ? "active" : ""}" data-switch-user="${member.id}" type="button">
                <span class="avatar" style="background:${member.color}">${escapeHtml(getInitials(member.name))}</span>
                <span class="tile-copy">
                  <strong>${escapeHtml(member.name)}</strong>
                  <span>${avatar.name} · ${cared ? "今日已照顾" : "今日还未靠近"} · ${knots} 个心结</span>
                </span>
                <span class="guardian-state ${cared ? "done" : ""}">${cared ? icon("leaf", "icon-sm") : icon("moon", "icon-sm")}</span>
              </button>
            `;
          })
          .join("")}
      </div>
      <p class="footer-note">这是本地演示，可以轻点名字切换视角；正式版建议使用家庭邀请码和独立账号。</p>
    </section>
  `;
}

function renderTodayResponsePanel(user, tree) {
  const responses = tree.bugs
    .filter((bug) => bug.status === "resolved")
    .slice(-4)
    .reverse();

  return `
    <section class="panel response-panel soft">
      <div class="panel-title">
        <h2>${icon("message-circle-heart")}今日回应</h2>
        <small>被认真看见的感受</small>
      </div>
      <div class="response-list">
        ${
          responses.length
            ? responses
                .map((bug) => {
                  const author = state.users.find((member) => member.id === bug.authorId);
                  const authorColor = author?.color || "#bd6a58";
                  return `
                    <article class="response-card" style="--bug-author-color:${authorColor}">
                      <div class="bug-meta">
                        <span><i class="author-dot" style="background:${authorColor}"></i>${escapeHtml(bug.authorName)} 的心结</span>
                        <span class="tag green">${icon("sparkles", "icon-sm")}已被看见</span>
                      </div>
                      <p>${escapeHtml(bug.reply || "这个感受已经被回应。")}</p>
                      <small>${escapeHtml(bug.caughtByName || user.name)} 在 ${dayLabel(bug.caughtDay || state.today)} 回应</small>
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty">今天还没有新的回应。有人愿意认真听见时，这里会长出一条共同记忆。</div>`
        }
      </div>
    </section>
  `;
}

function renderCharacterPanel(user) {
  const activeAvatar = getAvatarType(user.avatar);

  return `
    <section class="panel selector-panel">
      <div class="panel-title">
        <h2>${icon("user-round-cog")}选择人物形象</h2>
        <small>当前：${activeAvatar.name}</small>
      </div>
      <div class="avatar-preview" style="--avatar-color:${user.color}; --avatar-accent:${activeAvatar.accent}">
        <div class="avatar-stage">
          <span class="avatar-shadow"></span>
          <span class="avatar-figure ${activeAvatar.id}">
            <i></i><b></b><em></em>
          </span>
        </div>
        <div>
          <strong>${escapeHtml(user.name)} · ${activeAvatar.name}</strong>
          <p>${activeAvatar.role}</p>
        </div>
      </div>
      <div class="selector-grid">
        ${AVATAR_TYPES.map(
          (avatar) => `
            <button class="selector-card avatar-card ${avatar.id === activeAvatar.id ? "active" : ""}" data-avatar="${avatar.id}" type="button" style="--avatar-color:${avatar.color}; --avatar-accent:${avatar.accent}">
              <span class="selector-icon">${icon(avatar.icon)}</span>
              <strong>${avatar.name}</strong>
              <small>${avatar.role}</small>
            </button>
          `,
        ).join("")}
      </div>
    </section>
  `;
}

function renderRosterPanel(current, tree) {
  return `
    <section class="panel soft">
      <div class="panel-title">
        <h2>${icon("users-round")}队伍阵容</h2>
        <small>${state.users.length} 名成员</small>
      </div>
      <div class="roster-list">
        ${state.users
          .map((member) => {
            const avatar = getAvatarType(member.avatar);
            return `
              <article class="roster-row ${member.id === current.id ? "active" : ""}">
                <span class="avatar" style="background:${member.color}">${escapeHtml(getInitials(member.name))}</span>
                <div>
                  <strong>${escapeHtml(member.name)}</strong>
                  <small>${avatar.name} · 今日照顾 ${Object.values(careTodayFor(member, tree)).filter(Boolean).length}/3</small>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderTreeShapePanel(tree) {
  const activeShape = getTreeShape(tree.shape);

  return `
    <section class="panel selector-panel">
      <div class="panel-title">
        <h2>${icon("tree-pine")}选择树的形状</h2>
        <small>当前：${activeShape.name}</small>
      </div>
      <div class="tree-shape-preview shape-${activeShape.id}">
        <span class="shape-glow"></span>
        <span class="shape-trunk"></span>
        <span class="shape-crown one"></span>
        <span class="shape-crown two"></span>
        <span class="shape-crown three"></span>
        <div>
          <strong>${activeShape.name}</strong>
          <p>${activeShape.desc}</p>
        </div>
      </div>
      <div class="selector-grid tree-selector-grid">
        ${TREE_SHAPES.map(
          (shape) => `
            <button class="selector-card tree-shape-card ${shape.id === activeShape.id ? "active" : ""}" data-tree-shape="${shape.id}" type="button">
              <span class="selector-icon">${icon(shape.icon)}</span>
              <strong>${shape.name}</strong>
              <small>${shape.tag}</small>
              <p>${shape.desc}</p>
            </button>
          `,
        ).join("")}
      </div>
    </section>
  `;
}

function renderQuestPanel(user, tree) {
  const careDone = Object.values(careTodayFor(user, tree)).filter(Boolean).length;
  const hasCatchableBug = activeBugs(tree).some((bug) => bug.authorId !== user.id);
  const allMembersCared = state.users.every((member) => Object.values(careTodayFor(member, tree)).some(Boolean));
  const ripeFruits = matureFruits(tree).length;
  const quests = [
    {
      icon: "hand-heart",
      title: "完成一次今日照顾",
      detail: "选择一个照顾动作，就能让树继续生长。",
      done: careDone >= 3,
      progress: `${careDone}/3`,
    },
    {
      icon: "bug-off",
      title: "回应一个心结",
      detail: "留下具体回应，让这个感受被认真看见。",
      done: !hasCatchableBug,
      progress: hasCatchableBug ? "待处理" : "已清空",
    },
    {
      icon: "users-round",
      title: "全员都来照顾一次",
      detail: "共同照顾会触发额外成长奖励。",
      done: allMembersCared,
      progress: `${state.users.filter((member) => Object.values(careTodayFor(member, tree)).some(Boolean)).length}/${state.users.length}`,
    },
    {
      icon: "apple",
      title: "采摘成熟记忆果",
      detail: "成熟记忆果会留下被珍惜的记录。",
      done: ripeFruits === 0,
      progress: ripeFruits ? `${ripeFruits} 个可采` : "暂无",
    },
  ];

  return `
    <section class="panel">
      <div class="panel-title">
        <h2>${icon("scroll-text")}今日任务</h2>
        <small>按真实日期自动刷新</small>
      </div>
      <div class="quest-list">
        ${quests
          .map(
            (quest) => `
              <article class="quest-card ${quest.done ? "done" : ""}">
                <span>${icon(quest.done ? "check-circle-2" : quest.icon)}</span>
                <div>
                  <strong>${quest.title}</strong>
                  <p>${quest.detail}</p>
                </div>
                <small>${quest.progress}</small>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCodexPanel(tree) {
  const growth = treeGrowthStats(tree);
  const totalResolved = tree.bugs.filter((bug) => bug.status === "resolved").length;
  const harvested = tree.fruits.filter((fruit) => fruit.harvested).length;
  const shape = getTreeShape(tree.shape);

  return `
    <section class="panel soft">
      <div class="panel-title">
        <h2>${icon("book-open")}图鉴进度</h2>
      </div>
      <div class="codex-grid">
        <article><strong>${growth.stage}</strong><span>成长阶段</span></article>
        <article><strong>${shape.name}</strong><span>当前树形</span></article>
        <article><strong>${totalResolved}</strong><span>已回应心结</span></article>
        <article><strong>${harvested}</strong><span>已采摘记忆果</span></article>
      </div>
    </section>
  `;
}

function renderAccountPanel(current) {
  const users = state.users
    .map(
      (user) => {
        const avatar = getAvatarType(user.avatar);
        return `
        <button class="account-tile ${user.id === current.id ? "active" : ""}" data-switch-user="${user.id}" type="button">
          <span class="avatar" style="background:${user.color}">${escapeHtml(getInitials(user.name))}</span>
          <span class="tile-copy">
            <strong>${escapeHtml(user.name)}</strong>
            <span>${avatar.name} · ${user.id === current.id ? "当前守护" : "切换视角"} · ${bugsByAuthor(user.id).length} 个心结</span>
          </span>
        </button>
      `;
      },
    )
    .join("");

  return `
    <section class="panel">
      <div class="panel-title">
        <h2>${icon("users-round")}成员账号</h2>
        <button class="btn icon-only secondary" data-action="show-adopt" type="button" title="新增成员">${icon("user-plus")}</button>
      </div>
      <div class="account-list">${users}</div>
      <p class="footer-note">这是本地演示，所以可以直接切换成员账号。上线版建议用家庭邀请码和独立密码。</p>
    </section>
  `;
}

function renderMembersPanel(tree) {
  const members = state.users
    .map((user) => {
      const careCount = Object.values(careTodayFor(user, tree)).filter(Boolean).length;
      const avatar = getAvatarType(user.avatar);
      return `
        <div class="land-tile">
          <span class="avatar" style="background:${user.color}">${escapeHtml(getInitials(user.name))}</span>
          <span class="tile-copy">
            <strong>${escapeHtml(user.name)}</strong>
            <span>${avatar.name} · 今日照顾 ${careCount}/3 · 放下的心结 ${bugsByAuthor(user.id, tree).length}</span>
          </span>
        </div>
      `;
    })
    .join("");

  return `
    <section class="panel soft">
      <div class="panel-title">
        <h2>${icon("network")}共生成员</h2>
      </div>
      <div class="account-list">${members}</div>
    </section>
  `;
}

function renderStatsPanel(tree) {
  const open = activeBugs(tree).length;
  const fruits = matureFruits(tree).length;
  const care = todayCareCount(tree);
  const maxCare = Math.max(3, state.users.length * 3);
  const growth = treeGrowthStats(tree);

  return `
    <section class="panel">
      <div class="panel-title">
        <h2>${icon("activity")}今日状态</h2>
      </div>
      <div class="stats-grid">
        <div class="stat"><strong>${tree.hp}°</strong><span>关系温度</span></div>
        <div class="stat"><strong>${growth.percent}%</strong><span>${growth.stage}</span></div>
        <div class="stat"><strong>${open}</strong><span>未回应心结</span></div>
        <div class="stat"><strong>${fruits}</strong><span>可采摘记忆果</span></div>
      </div>
      <div class="health-line">
        <div><span>全员今日照顾</span><span>${care}/${maxCare}</span></div>
        <div class="meter"><div class="meter-fill" style="width:${(care / maxCare) * 100}%"></div></div>
      </div>
    </section>
  `;
}

function renderGardenParty(currentUser) {
  return `
    <div class="scene-garden-party" aria-label="树下成员">
      ${state.users
        .map((member, index) => {
          const avatar = getAvatarType(member.avatar);
          return `
            <div class="garden-character ${member.id === currentUser.id ? "active" : ""}" style="--avatar-color:${member.color}; --avatar-accent:${avatar.accent}; --garden-delay:${index * 0.35}s">
              <span class="avatar-shadow"></span>
              <span class="avatar-figure game-hero ${avatar.id}">
                <span class="hero-hair back"></span>
                <span class="hero-head">
                  <span class="hero-hair fringe"></span>
                  <span class="hero-eye left"></span>
                  <span class="hero-eye right"></span>
                  <span class="hero-brow left"></span>
                  <span class="hero-brow right"></span>
                  <span class="hero-cheek left"></span>
                  <span class="hero-cheek right"></span>
                  <span class="hero-mouth"></span>
                </span>
                <span class="hero-neck"></span>
                <span class="hero-body">
                  <span class="hero-collar"></span>
                  <span class="hero-emblem"></span>
                  <span class="hero-belt"></span>
                </span>
                <span class="hero-arm left"><span></span></span>
                <span class="hero-arm right"><span></span></span>
                <span class="hero-leg left"></span>
                <span class="hero-leg right"></span>
                <span class="hero-boot left"></span>
                <span class="hero-boot right"></span>
                <span class="hero-prop"></span>
              </span>
              <span class="garden-name">${escapeHtml(member.name)}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTreePanel(user, tree) {
  const svgClass = tree.hp <= 35 ? "danger" : tree.hp <= 68 ? "low" : "";
  const realGrowth = treeGrowthStats(tree);
  const activeGrowthAnimation = ui.growthPreview || ui.growthTransition;
  const growth = ui.growthPreview ? growthStatsFromPercent(ui.growthPreview.toPercent) : realGrowth;
  const sceneData = buildTreeSceneData(user, tree, growth);
  const serializedSceneData = escapeHtml(JSON.stringify(sceneData));
  const shape = getTreeShape(tree.shape);
  const mood = relationshipMood(tree);
  const growthStartPercent = activeGrowthAnimation ? activeGrowthAnimation.fromPercent : growth.percent;
  const growthTargetAttr = activeGrowthAnimation ? ` data-growth-target="${growth.percent}"` : "";
  const sceneStyle = [
    `--tree-scale:${growth.scale}`,
    `--tree-rise:${growth.rise}`,
    `--tree-reveal:${growth.reveal}`,
    `--leaf-opacity:${growth.leafOpacity}`,
  ].join(";");

  return `
    <section class="tree-panel">
      <div class="tree-header">
        <div>
          <h2>${escapeHtml(tree.name)}</h2>
          <p>${state.users.length} 人共生 · ${shape.name} · ${mood.title}</p>
        </div>
        <div class="tree-actions">
          <span class="tag green">${icon("heart-pulse", "icon-sm")}关系温度 ${tree.hp}°</span>
          <span class="tag green">${icon("sprout", "icon-sm")}成长 ${growth.percent}%</span>
          <span class="tag blue">${icon("apple", "icon-sm")}${tree.fruits.filter((fruit) => !fruit.harvested).length} 个记忆果</span>
          <span class="tag red">${icon("bug", "icon-sm")}${activeBugs(tree).length} 个心结</span>
        </div>
      </div>
      <div class="sky-note">心结不是惩罚，它只是把没被听见的感受轻轻放在树旁，等另一个人靠近。</div>
      <div class="growth-status">
        <div>
          <span>树正在</span>
          <strong>${growth.stage}</strong>
        </div>
        <div class="growth-meter" aria-label="成长进度">
          <span${growthTargetAttr} style="width:${growthStartPercent}%"></span>
        </div>
        <small>今日照顾、回应心结、采摘记忆果，都会被这棵树记住。</small>
      </div>
      <div class="tree-scene game-scene-shell shape-${shape.id} ${svgClass}" style="${sceneStyle}" data-scene="${serializedSceneData}">
        <div class="game-scene-root" data-scene="${serializedSceneData}" aria-label="3D 共生树游戏场景"></div>
        <div class="tree-scene-loading game-scene-fallback">3D 游戏场景加载中</div>
        <div class="scene-world-caption">
          <span>${icon("bug", "icon-sm")}心结虫会带着成员颜色停在树旁</span>
          <span>${icon("apple", "icon-sm")}记忆果成熟后可以被共同采摘</span>
        </div>
      </div>
    </section>
  `;
}

function renderTreeItems(tree) {
  const fruitPositions = [
    [42, 32],
    [55, 25],
    [62, 39],
    [36, 45],
    [50, 51],
    [67, 52],
    [29, 35],
  ];
  const bugPositions = [
    [57, 58],
    [45, 61],
    [68, 43],
    [34, 55],
    [53, 35],
    [39, 28],
  ];

  const fruits = tree.fruits
    .filter((fruit) => !fruit.harvested)
    .slice(0, fruitPositions.length)
    .map((fruit, index) => {
      const [left, top] = fruitPositions[index];
      const ripe = fruit.matureDay <= state.today;
      return `
        <span class="tree-item fruit ${ripe ? "" : "unripe"}" style="left:${left}%; top:${top}%;" title="${escapeHtml(fruit.label)}">
          ${icon(ripe ? "apple" : "circle-dot")}
        </span>
      `;
    })
    .join("");

  const bugs = activeBugs(tree)
    .slice(0, bugPositions.length)
    .map((bug, index) => {
      const [left, top] = bugPositions[index];
      return `
        <span class="tree-item bug ${bug.damageApplied ? "aged" : ""}" style="left:${left}%; top:${top}%;" title="${escapeHtml(bug.text)}">
          ${icon("bug")}
        </span>
      `;
    })
    .join("");

  return fruits + bugs;
}

function renderCarePanel(user, tree) {
  const care = careTodayFor(user, tree);
  const maintainedToday = Object.values(care).some(Boolean);
  const actions = [
    { key: "water", label: "给树浇水", sub: "用一个小动作让关系继续生长", icon: "droplets", cls: "leaf" },
    { key: "sun", label: "留一束光", sub: "把今天愿意靠近的心意放进树下", icon: "sun", cls: "sky" },
    { key: "listen", label: "写一句感谢", sub: "让被珍惜的瞬间长成记忆果", icon: "message-circle-heart", cls: "rose" },
  ];

  return `
    <section class="panel care-ritual-panel">
      <div class="panel-title">
        <h2>${icon("hand-heart")}今日照顾</h2>
        <small>每人每天一次</small>
      </div>
      <p class="panel-whisper">${maintainedToday ? "今天的照顾已经被树记住了。" : "选择一个动作就够了，不需要把关系变成任务。"}</p>
      <div class="quick-grid">
        ${actions
          .map(
            (action) => `
              <button class="btn care-button ${maintainedToday ? "secondary" : action.cls}" data-care="${action.key}" type="button" ${maintainedToday ? "disabled" : ""}>
                <span>${icon(action.icon)}${action.label}</span>
                <small>${maintainedToday ? "树已经收到了" : action.sub}</small>
              </button>
            `,
          )
          .join("")}
      </div>
      ${
        DEV_TOOLS_ENABLED
          ? `
            <div class="dev-tools-panel">
              <button class="btn test-growth-button" data-action="test-growth" type="button">
                ${icon("activity")}开发预览成长
                <small>只演示动画，不保存进度</small>
              </button>
              ${renderTreeModelPicker(tree)}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderTreeModelPicker(tree) {
  const activeModel = getTreeModel(tree.model);

  return `
    <div class="tree-model-picker" aria-label="候选树模型">
      <div class="tree-model-title">
        <strong>${icon("trees", "icon-sm")}候选树模型</strong>
        <small>当前：${activeModel.name}</small>
      </div>
      <div class="tree-model-grid">
        ${TREE_MODELS.map(
          (model) => `
            <button class="tree-model-option ${model.id === activeModel.id ? "active" : ""}" data-tree-model="${model.id}" type="button">
              <span>${icon(model.icon, "icon-sm")}${model.name}</span>
              <small>${model.tag}</small>
            </button>
          `,
        ).join("")}
      </div>
    </div>
  `;
}

function renderBugPanel(user, tree) {
  const open = activeBugs(tree);

  return `
    <section class="panel heart-knot-panel">
      <div class="panel-title">
        <h2>${icon("bug")}等待被看见的心结</h2>
        <small>心结需要另一个人来回应</small>
      </div>
      <form class="form-grid" data-form="bug">
        <div class="field">
          <label for="bugText">今天哪里有点难受</label>
          <textarea id="bugText" name="text" maxlength="180" placeholder="说具体事件，不贴标签。例如：晚饭时我说话被打断，我觉得不被重视。" required></textarea>
        </div>
        <div class="field">
          <label for="bugNeed">我希望对方怎么回应</label>
          <select id="bugNeed" name="need">
            <option value="先听我说完">先听我说完</option>
            <option value="给一句道歉">给一句道歉</option>
            <option value="一起定个改变动作">一起定个改变动作</option>
            <option value="给我一个拥抱">给我一个拥抱</option>
          </select>
        </div>
        <button class="btn rose" type="submit">${icon("bug")}放下一只心结虫</button>
      </form>
      <div class="bug-list" style="margin-top:12px">
        ${open.length ? open.map((bug) => renderBugCard(bug, user)).join("") : `<div class="empty">现在没有等待被看见的心结。树下很安静。</div>`}
      </div>
    </section>
  `;
}

function renderBugCard(bug, user) {
  const left = daysLeft(bug.expiresDay);
  const isResolved = bug.status === "resolved";
  const isMine = bug.authorId === user.id;
  const author = state.users.find((item) => item.id === bug.authorId);
  const authorColor = author?.color || "#bd6a58";
  const status = isResolved
    ? `<span class="tag green">${icon("check", "icon-sm")}已回应</span>`
    : bug.damageApplied
      ? `<span class="tag red">${icon("leaf", "icon-sm")}树叶有些暗淡</span>`
      : left <= 0
        ? `<span class="tag red">${icon("alarm-clock", "icon-sm")}需要温和提醒</span>`
        : `<span class="tag ${left <= 2 ? "red" : "blue"}">${icon("clock", "icon-sm")}还可停留 ${left} 天</span>`;

  return `
    <article class="bug-card ${isResolved ? "resolved" : ""}" style="--bug-author-color:${authorColor}">
      <div class="bug-meta">
        <span><i class="author-dot" style="background:${authorColor}"></i>${dayLabel(bug.createdDay)} · ${escapeHtml(bug.authorName)} 放下 · 希望：${escapeHtml(bug.need)}</span>
        ${status}
      </div>
      <p>${escapeHtml(bug.text)}</p>
      ${
        isResolved
          ? `<div class="reply-box"><span class="tag green">${escapeHtml(bug.caughtByName || "成员")} 的回应</span><p>${escapeHtml(bug.reply || "已处理")}</p></div>`
          : isMine
            ? `<div class="bug-actions"><span class="tag blue">${icon("user-round", "icon-sm")}我的心结</span><button class="btn ghost" data-withdraw-bug="${bug.id}" type="button">${icon("x")}我先收回</button></div>`
            : `
              <form class="reply-box" data-form="catch-bug" data-bug-id="${bug.id}">
                <textarea name="reply" maxlength="160" placeholder="写一句具体回应：我听到了、我理解你哪里难受、我会做一个什么动作。" required></textarea>
                <button class="btn leaf" type="submit">${icon("hand-heart")}回应这个心结</button>
              </form>
            `
      }
    </article>
  `;
}

function renderFruitPanel(tree) {
  const fruits = tree.fruits.filter((fruit) => !fruit.harvested);
  return `
    <section class="panel soft memory-fruit-panel">
      <div class="panel-title">
        <h2>${icon("apple")}共同记忆果子</h2>
        <small>照顾与回应会结果</small>
      </div>
      <div class="fruit-list">
        ${
          fruits.length
            ? fruits
                .map((fruit) => {
                  const ripe = fruit.matureDay <= state.today;
                  const progress = clamp(((state.today - fruit.createdDay) / Math.max(1, fruit.matureDay - fruit.createdDay)) * 100, 8, 100);
                  return `
                    <article class="fruit-card">
                      <div class="fruit-meta">
                        <strong>${escapeHtml(fruit.label)}</strong>
                        <span class="tag ${ripe ? "green" : "blue"}">${ripe ? "可采摘" : `${daysLeft(fruit.matureDay)} 天后成熟`}</span>
                      </div>
                      <div class="meter"><div class="meter-fill" style="width:${progress}%"></div></div>
                      ${ripe ? `<button class="btn secondary" data-harvest="${fruit.id}" type="button" style="margin-top:10px">${icon("shopping-basket")}采摘记忆</button>` : ""}
                    </article>
                  `;
                })
                .join("")
            : `<div class="empty">还没有记忆果。完成今日照顾后，新的好事会慢慢长出来。</div>`
        }
      </div>
    </section>
  `;
}

function renderIdeasPanel() {
  const ideas = [
    ["共生目标", "全员一起定一个小目标，比如本周一次不带手机的晚饭，完成后给树加血。"],
    ["责任平衡", "记录每个人的照顾次数和回应次数，避免只有一方一直修复关系。"],
    ["家庭邀请码", "下一版用后端账号和邀请码，让两台手机实时同步同一棵共生树。"],
  ];

  return `
    <section class="panel">
      <div class="panel-title">
        <h2>${icon("sparkles")}可升级方向</h2>
      </div>
      <div class="idea-list">
        ${ideas
          .map(
            ([title, body]) => `
              <article class="idea-row">
                <p><strong>${title}</strong></p>
                <p class="footer-note">${body}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTimelinePanel() {
  return `
    <section class="panel growth-trail-panel">
      <div class="panel-title">
        <h2>${icon("scroll-text")}成长轨迹</h2>
      </div>
      <div class="log-list">
        ${
          state.timeline.length
            ? state.timeline
                .slice(0, 6)
                .map(
                  (item) => `
                    <article class="log-row">
                      <div class="log-meta"><span>${dayLabel(item.day)}</span></div>
                      <p>${escapeHtml(item.text)}</p>
                    </article>
                  `,
                )
                .join("")
            : `<div class="empty">还没有记录。</div>`
        }
      </div>
    </section>
  `;
}

function renderMiniTree() {
  return `
    <div class="mini-tree">
      <img src="./assets/symbiotic-tree-hero.png" alt="真实共生树" />
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.tab = button.dataset.tab;
      render();
    });
  });

  document.querySelectorAll("[data-game-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.gameTab = button.dataset.gameTab;
      render();
    });
  });

  document.querySelector('[data-form="login"]')?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const user = state.users.find((item) => item.id === data.get("userId"));
    if (!user || user.password !== data.get("password")) {
      toast("密码不对，请重新输入。");
      return;
    }
    state.sessionUserId = user.id;
    logEvent(`${user.name} 进入了共生树。`);
    saveState();
    render();
  });

  document.querySelector('[data-form="adopt"]')?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const password = String(data.get("password") || "").trim();
    if (!name || password.length < 4) {
      toast("名字和至少 4 位密码都要填写。");
      return;
    }
    const newUser = makeUser(
      name,
      password,
      MEMBER_COLORS[state.users.length % MEMBER_COLORS.length],
      AVATAR_TYPES[state.users.length % AVATAR_TYPES.length].id,
    );
    state.users.push(newUser);
    state.sessionUserId = newUser.id;
    logEvent(`${name} 加入了共生树。`);
    saveState();
    render();
  });

  document.querySelector("[data-action='show-adopt']")?.addEventListener("click", () => {
    state.sessionUserId = null;
    ui.tab = "adopt";
    saveState();
    render();
  });

  document.querySelector("[data-action='logout']")?.addEventListener("click", () => {
    state.sessionUserId = null;
    saveState();
    render();
  });

  document.querySelectorAll("[data-switch-user]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sessionUserId = button.dataset.switchUser;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-avatar]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = currentUser();
      const avatar = getAvatarType(button.dataset.avatar);
      if (!user || user.avatar === avatar.id) return;
      user.avatar = avatar.id;
      logEvent(`${user.name} 选择了 ${avatar.name} 形象。`);
      saveState();
      toast(`已切换为 ${avatar.name}。`);
    });
  });

  document.querySelectorAll("[data-tree-shape]").forEach((button) => {
    button.addEventListener("click", () => {
      const tree = sharedTree();
      const shape = getTreeShape(button.dataset.treeShape);
      if (tree.shape === shape.id) return;
      tree.shape = shape.id;
      addGrowthPoints(tree, 1);
      logEvent(`共生树进化为 ${shape.name}，树形已同步给所有成员。`);
      saveState();
      toast(`树形已切换为 ${shape.name}。`);
    });
  });

  document.querySelectorAll("[data-tree-model]").forEach((button) => {
    button.addEventListener("click", () => {
      const tree = sharedTree();
      const model = getTreeModel(button.dataset.treeModel);
      if (tree.model === model.id) return;
      tree.model = model.id;
      logEvent(`共生树模型切换为 ${model.name}。`);
      saveState();
      toast(`已切换为 ${model.name}。`);
    });
  });

  document.querySelectorAll("[data-care]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = currentUser();
      const tree = sharedTree();
      if (!user) return;
      const key = button.dataset.care;
      tree.careLog[state.today] ||= {};
      tree.careLog[state.today][user.id] ||= {};
      if (Object.values(tree.careLog[state.today][user.id]).some(Boolean)) return;
      const beforeGrowth = treeGrowthStats(tree);
      let growthAdded = 5;
      tree.careLog[state.today][user.id][key] = true;
      tree.careCount += 1;
      addGrowthPoints(tree, growthAdded);
      tree.hp = clamp(tree.hp + 1, 0, 100);
      const allMembersCared = state.users.every((member) =>
        Object.values(careTodayFor(member, tree)).some(Boolean),
      );
      if (state.users.length > 1 && allMembersCared && !tree.careLog[state.today]._sharedGrowthBonus) {
        tree.careLog[state.today]._sharedGrowthBonus = true;
        growthAdded += 3;
        addGrowthPoints(tree, 3);
        tree.hp = clamp(tree.hp + 2, 0, 100);
        logEvent("今天所有守护者都来照顾了共生树，树获得了一次共同生长奖励。");
      }

      if (tree.careCount % 3 === 0) {
        const labels = ["理解果", "耐心果", "好好说话果", "拥抱果", "约定果"];
        const label = labels[(tree.careCount / 3) % labels.length];
        tree.fruits.push({
          id: uid(),
          label,
          createdDay: state.today,
          matureDay: state.today + 3,
          harvested: false,
        });
        logEvent(`${user.name} 完成今日照顾，共生树长出了 ${label}。`);
      } else {
        logEvent(`${user.name} 完成了一次今日照顾。`);
      }
      queueGrowthTransition(beforeGrowth, treeGrowthStats(tree), growthAdded, "care");
      saveState();
      toast("今天的照顾已经被树记住了。");
      render();
    });
  });

  document.querySelector("[data-action='test-growth']")?.addEventListener("click", () => {
    const growth = treeGrowthStats(sharedTree());
    let fromPercent = growth.percent;
    let toPercent = Math.min(100, fromPercent + 30);

    if (toPercent - fromPercent < 18) {
      fromPercent = 35;
      toPercent = 85;
    }

    ui.growthPreview = {
      id: `test-${Date.now()}-${Math.round(Math.random() * 100000)}`,
      fromPercent,
      toPercent,
      amount: toPercent - fromPercent,
      fromStage: growthStageId(fromPercent),
      toStage: growthStageId(toPercent),
      reason: "test",
    };
    render();
  });

  document.querySelector('[data-form="bug"]')?.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = currentUser();
    const tree = sharedTree();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const text = String(data.get("text") || "").trim();
    const need = String(data.get("need") || "").trim();
    if (text.length < 6) {
      toast("心结至少写 6 个字，最好说清楚具体事件。");
      return;
    }
    tree.bugs.push({
      id: uid(),
      text,
      need,
      createdDay: state.today,
      expiresDay: state.today + 7,
      status: "open",
      damageApplied: false,
      authorId: user.id,
      authorName: user.name,
    });
    logEvent(`${user.name} 在共生树旁放下一只心结虫，等待被认真看见。`);
    saveState();
    toast("这份感受已经被树轻轻收好，等待被看见。");
  });

  document.querySelectorAll('[data-form="catch-bug"]').forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const user = currentUser();
      const tree = sharedTree();
      if (!user) return;
      const bug = tree.bugs.find((item) => item.id === form.dataset.bugId);
      if (!bug || bug.status === "resolved") return;
      if (bug.authorId === user.id) {
        toast("自己放下的心结需要另一个人回应，也可以先收回。");
        return;
      }
      const data = new FormData(event.currentTarget);
      const reply = String(data.get("reply") || "").trim();
      if (reply.length < 5) {
        toast("回应再具体一点，至少 5 个字。");
        return;
      }
      bug.status = "resolved";
      bug.caughtBy = user.id;
      bug.caughtByName = user.name;
      bug.caughtDay = state.today;
      bug.reply = reply;
      tree.hp = clamp(tree.hp + 2, 0, 100);
      addGrowthPoints(tree, 2);
      logEvent(`${user.name} 回应了 ${bug.authorName} 的一只心结虫，树叶变亮了一点。`);
      saveState();
      toast("这个感受被认真看见了。");
    });
  });

  document.querySelectorAll("[data-withdraw-bug]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = currentUser();
      const tree = sharedTree();
      const bug = tree.bugs.find((item) => item.id === button.dataset.withdrawBug);
      if (!bug || !user || bug.authorId !== user.id) return;
      bug.status = "resolved";
      bug.reply = "我先收回这只心结，等更合适的时候再说。";
      bug.caughtBy = user.id;
      bug.caughtByName = user.name;
      bug.caughtDay = state.today;
      logEvent(`${user.name} 收回了一只心结虫，准备换个更合适的时刻再说。`);
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-harvest]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = currentUser();
      const tree = sharedTree();
      const fruit = tree.fruits.find((item) => item.id === button.dataset.harvest);
      if (!fruit || fruit.harvested || fruit.matureDay > state.today) return;
      fruit.harvested = true;
      tree.hp = clamp(tree.hp + 2, 0, 100);
      addGrowthPoints(tree, 1);
      logEvent(`${user?.name || "成员"} 采摘了 ${fruit.label}，这段共同记忆让树叶更亮了一点。`);
      saveState();
      render();
    });
  });
}

function toast(message) {
  ui.toast = message;
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

syncTimeWithRealWorld(true);
render();

window.setInterval(() => {
  if (syncTimeWithRealWorld(false)) {
    render();
  }
}, 60 * 1000);
