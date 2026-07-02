import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, ArrowUp, GitCompare, BookOpen, Zap, BrainCircuit, Cpu, UserCircle, X, Copy, Check as CheckIcon, Square } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Category = "通用大模型" | "预训练模型" | "我的模型";

const CATEGORY_MODELS: Record<Category, string[]> = {
  "通用大模型":  ["GLM-4.7", "GLM-4-Flash", "Qwen3-7B"],
  "预训练模型":  ["中英语言预训练模型", "面向认知的预训练模型", "多模态预训练模型", "科技情报训练模型服务", "教育大模型预训练能力服务"],
  "我的模型":    ["领域问答微调模型", "代码补全微调模型"],
};

const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  "通用大模型": <Cpu size={20} color="#fff" />,
  "预训练模型": <BrainCircuit size={20} color="#fff" />,
  "我的模型":   <UserCircle size={20} color="#fff" />,
};

const CATEGORY_COLOR: Record<Category, string> = {
  "通用大模型": "linear-gradient(135deg,#7c3aed,#a855f7)",
  "预训练模型": "linear-gradient(135deg,#4f6ef7,#06b6d4)",
  "我的模型":   "linear-gradient(135deg,#16a34a,#22d3ee)",
};

// ─── Capability data (预训练模型 only) ─────────────────────────────────────────

interface Cap { icon: string; label: string; examples: string[]; }

const MODEL_CAPS: Record<string, Cap[]> = {
  "中英语言预训练模型": [
    { icon: "🔥", label: "文本生成", examples: [
      "写一篇关于中国传统节日春节的介绍，300字左右",
      "帮我生成一段智能手表的产品营销文案",
      "写一首描写秋天落叶的七言绝句",
    ]},
    { icon: "🌐", label: "中英互译", examples: [
      "请翻译成英文：人工智能正在深刻改变人类社会的各个领域",
      "Please translate to Chinese: Sustainable development is the shared responsibility of all nations",
      "请翻译成英文：绿水青山就是金山银山",
    ]},
    { icon: "💛", label: "情感分析", examples: [
      "分析以下评论的情感：这款手机拍照效果太棒了，用了就停不下来！",
      "分析情感倾向：物流速度太慢了，等了一周才到，非常失望",
      "分析情感：还可以吧，跟描述基本相符，没什么惊喜也没什么失望",
    ]},
    { icon: "🟡", label: "实体识别", examples: [
      "识别实体：马云于1999年在杭州创立了阿里巴巴集团",
      "识别实体：2024年巴黎奥运会上，中国代表团共获得40枚金牌",
      "识别实体：苹果公司CEO蒂姆·库克宣布将在上海设立新的研发中心",
    ]},
    { icon: "❓", label: "问答系统", examples: [
      "什么是量子纠缠？它在量子计算中有什么应用？",
      "中国的四大发明是什么？它们对世界历史有何影响？",
      "如何系统地提高英语写作和口语水平？",
    ]},
    { icon: "📄", label: "文本摘要", examples: [
      "请摘要：大语言模型是基于Transformer架构的深度学习模型，通过海量数据预训练，学习语言规律，能理解和生成自然语言。近年来GPT、LLaMA、GLM等模型相继问世，将NLP推向新高度。",
      "请摘要：全球气候变化是21世纪最严峻环境挑战之一，科学家警告若不将升温控制在1.5℃内，极端天气和生态崩溃将造成不可逆损害。",
      "请摘要：元宇宙是利用VR、AR、区块链等技术构建的持久虚拟空间，Meta、微软等巨头纷纷布局，但商业化落地仍面临技术和内容双重瓶颈。",
    ]},
  ],
  "面向认知的预训练模型": [
    { icon: "🧠", label: "逻辑推理", examples: [
      "所有哺乳动物都是恒温动物，鲸鱼是哺乳动物，那鲸鱼是恒温动物吗？请推理并解释",
      "A比B高，B比C高，C比D高，那谁最矮？请一步步推理",
      "一班30人，18人喜欢数学，15人喜欢语文，两者都喜欢的8人，两者都不喜欢的有多少？",
    ]},
    { icon: "🔗", label: "知识关联", examples: [
      "牛顿、爱因斯坦、霍金三位物理学家的理论之间有什么继承和发展关系？",
      "中医阴阳五行理论与现代系统论有哪些相似之处？",
      "请分析工业革命、城镇化与环境污染之间的因果链条",
    ]},
    { icon: "💡", label: "认知分析", examples: [
      "为什么人们在压力大时更容易做出非理性决策？从认知心理学角度分析",
      "分析确认偏误（Confirmation Bias）在日常生活中的典型表现",
      '为什么学新技能时"刻意练习"比单纯重复更有效？',
    ]},
    { icon: "🗂️", label: "概念归纳", examples: [
      "请归纳机器学习、深度学习和强化学习的核心区别与联系",
      "请对以下概念分类归纳：苹果、玫瑰、鲨鱼、郁金香、鹰、樱桃",
      "请归纳总结敏捷开发与传统瀑布模型的主要差异",
    ]},
    { icon: "📊", label: "结构化输出", examples: [
      "请以结构化格式输出：一份有效会议的完整流程设计方案",
      "请用表格对比：React、Vue、Angular三大前端框架的核心特性",
      "请生成一份创业公司商业计划书的标准大纲结构",
    ]},
  ],
  "多模态预训练模型": [
    { icon: "🖼️", label: "图文理解", examples: [
      "请描述一张展示城市夜景的图片中可能包含的视觉元素",
      "如何判断一张医学影像中是否存在异常区域？",
      "请解读一张展示近十年中国GDP增长趋势的折线图",
    ]},
    { icon: "🎨", label: "视觉描述", examples: [
      "用诗意的语言描述一幅日落海边的风景照",
      "请详细描述梵高《星夜》的构图、色彩和情感表达",
      "描述一张极简设计的白色无线耳机产品展示图",
    ]},
    { icon: "📝", label: "图像问答", examples: [
      "图中人物的情绪状态是什么？如何从面部表情判断？",
      "这张架构图描述的是什么系统？各模块之间关系是什么？",
      "这份手写笔记的主要内容是什么？请整理成结构化文本",
    ]},
    { icon: "🎬", label: "视频理解", examples: [
      "请描述从一段5分钟产品演示视频中提取核心信息的思路",
      "如何从体育比赛视频中自动识别关键时刻（进球、犯规）？",
      "请分析一段新闻视频中的场景转换和信息传递逻辑",
    ]},
    { icon: "🔊", label: "音频分析", examples: [
      "如何判断一段音频中说话人的情绪状态？",
      "请分析客服通话录音中客户满意度的评估维度",
      "如何从会议录音中提取关键决策点和行动项？",
    ]},
  ],
  "科技情报训练模型服务": [
    { icon: "🔬", label: "专利分析", examples: [
      "分析近五年人工智能领域专利申请的主要技术方向和领先机构",
      "请解读一份半导体制造专利的核心技术方案和创新点",
      "如何评估一件专利的商业价值和技术护城河深度？",
    ]},
    { icon: "📈", label: "技术趋势", examples: [
      "分析2024-2025年全球大模型技术发展的五大核心趋势",
      "量子计算技术的商业化落地还需要突破哪些关键瓶颈？",
      "新能源汽车领域，固态电池技术的研发进展与商业化预期",
    ]},
    { icon: "🏢", label: "竞品分析", examples: [
      "对比分析OpenAI GPT-4、Google Gemini和Anthropic Claude的技术路线差异",
      "国内主流大模型平台（文心、通义、GLM）的商业模式对比",
      "分析特斯拉、比亚迪、宁德时代在新能源领域的核心竞争壁垒",
    ]},
    { icon: "📰", label: "情报摘要", examples: [
      "请汇总近一个月半导体行业的重大政策法规变化",
      "提炼EU AI Act的核心要点及企业合规要求",
      "请整理全球顶级AI实验室最新发布的技术报告要点",
    ]},
    { icon: "⚠️", label: "风险预警", examples: [
      "评估当前全球供应链中芯片短缺风险的主要触发因素",
      "分析生成式AI技术应用中的主要安全风险和治理挑战",
      "识别新能源车企在海外扩张中面临的主要政策和市场风险",
    ]},
  ],
  "教育大模型预训练能力服务": [
    { icon: "📚", label: "知识讲解", examples: [
      "请用通俗易懂的语言解释什么是微积分的基本定理",
      "用类比方法解释DNA双螺旋结构，适合初中生理解",
      "请解释凯恩斯主义经济学的核心观点和历史背景",
    ]},
    { icon: "✏️", label: "题目生成", examples: [
      "请为高中数学函数章节生成5道难度递进的练习题，附参考答案",
      "生成10道关于中国近现代史的选择题，难度适合初三水平",
      '请设计3道考查批判性思维的开放性作文题，主题为"科技与人文"',
    ]},
    { icon: "🗺️", label: "学习规划", examples: [
      "请为零基础学员制定一份3个月的Python编程入门学习计划",
      "帮我规划考研数学的6个月备考时间表，包含每日学习任务",
      "为一名想转行做数据分析的职场人制定6个月技能提升路径",
    ]},
    { icon: "💬", label: "答疑辅导", examples: [
      "我不理解为什么带电粒子在磁场中会做圆周运动，请详细解释",
      "高中化学氧化还原反应的配平方法有哪些？请举例说明",
      "请解答：鲁迅为什么弃医从文？这反映了他怎样的思想转变？",
    ]},
    { icon: "📝", label: "作文批改", examples: [
      "请批改以下作文并给出具体修改建议：人工智能的发展让我们的生活变得更加便利，但同时也带来了一些问题...",
      "请从论点、论据、逻辑结构三个维度评价这篇文章的质量",
      "请帮我润色这段英文邮件，使其更加专业：Dear Mr. Smith, I want to ask about the project...",
    ]},
    { icon: "🎯", label: "个性化练习", examples: [
      "我在英语阅读理解中经常出错，请针对性生成5道训练题",
      "我数学微分方程掌握不好，请设计从基础到进阶的练习序列",
      "请根据我薄弱的语文文言文阅读制定专项训练计划",
    ]},
  ],
};

// ─── Education sub-models ─────────────────────────────────────────────────────

const EDU_MODEL = "教育大模型预训练能力服务";

const EDU_SUB_MODELS = ["通用", "理科", "工科", "文科", "计算机", "医学"] as const;
type EduSubModel = typeof EDU_SUB_MODELS[number];

const EDU_CAPS: Record<EduSubModel, Cap[]> = {
  "通用": [
    { icon: "📊", label: "学科知识解析", examples: [
      "请解析牛顿第三定律的核心内容及其在日常生活中的应用",
      "解释微积分基本定理，并举例说明其实际用途",
      "请系统讲解DNA双螺旋结构的发现历史与意义",
    ]},
    { icon: "✏️", label: "习题生成", examples: [
      "请为高中数学函数章节生成5道难度递进的练习题",
      "生成10道关于中国近代史的判断题，适合初三水平",
      "针对英语阅读理解，生成3道细节理解题和2道推断题",
    ]},
    { icon: "🌟", label: "知识记忆", examples: [
      "帮我用记忆宫殿法记住元素周期表前20个元素",
      "用联想记忆法帮我记住英语不规则动词过去式",
      "请设计一个记忆三角函数公式的口诀或记忆技巧",
    ]},
    { icon: "💡", label: "内容生成", examples: [
      "生成一篇关于气候变化对农业影响的学术论文摘要",
      "为高中生创作一段科普短文，主题为量子计算的基本原理",
      "生成一份人工智能发展史的思维导图大纲",
    ]},
    { icon: "📚", label: "学习路径规划", examples: [
      "请为零基础学员制定一份3个月的Python编程学习计划",
      "帮我规划考研数学的6个月备考路径，含每日任务",
      "为想学数据分析的职场人规划6个月的技能提升路径",
    ]},
    { icon: "📈", label: "教学评估", examples: [
      "请从论点、论据、逻辑三维度评价这篇学生作文",
      "分析学生在二次函数解题中的常见错误类型",
      "设计一份评估高中生批判性思维能力的量规",
    ]},
  ],
  // 各垂直模型 = 通用前3个能力 + 2个专属能力
  "理科": [
    { icon: "📊", label: "学科知识解析", examples: [
      "请解析牛顿第三定律的核心内容及其在日常生活中的应用",
      "解释微积分基本定理，并举例说明其实际用途",
      "请系统讲解DNA双螺旋结构的发现历史与意义",
    ]},
    { icon: "✏️", label: "习题生成", examples: [
      "为高中物理电磁场章节生成5道难度递进的计算题，附解题过程",
      "生成10道高考化学有机反应类型判断题",
      "针对数列求和，生成3道等差加等比混合型练习题",
    ]},
    { icon: "🌟", label: "知识记忆", examples: [
      "帮我用记忆宫殿法记住元素周期表前20个元素",
      "用联想记忆法帮我记住常见三角函数值",
      "请设计一个记忆物理公式推导链的口诀",
    ]},
    { icon: "⚗️", label: "实验设计", examples: [
      "设计一个验证光合作用产生氧气的实验方案，列出器材和步骤",
      "如何设计实验探究温度对酶活性的影响？",
      "设计验证牛顿第二定律的实验，列出所需器材和注意事项",
    ]},
    { icon: "📐", label: "数学证明", examples: [
      "请用数学归纳法证明：1+2+3+...+n = n(n+1)/2",
      "证明等差数列的通项公式并举例验证",
      "用反证法证明：若n²为偶数，则n为偶数",
    ]},
  ],
  "工科": [
    { icon: "📊", label: "学科知识解析", examples: [
      "请解析PID控制器三个参数的物理含义及调节方法",
      "解释有限元分析的基本原理及工程应用场景",
      "请系统讲解三相异步电动机的工作原理",
    ]},
    { icon: "✏️", label: "习题生成", examples: [
      "为电路分析课程生成5道含节点法和网孔法的综合练习题",
      "生成3道材料力学应力应变分析的计算题，附解题步骤",
      "针对热力学第一定律，生成4道工程热工典型例题",
    ]},
    { icon: "💡", label: "内容生成", examples: [
      "生成一份工业物联网系统整体架构的说明文档",
      "为智能制造产线设计一套MES功能模块介绍文本",
      "生成一篇关于新能源汽车电池管理系统的技术简介",
    ]},
    { icon: "⚙️", label: "工程计算", examples: [
      "计算一根直径50mm、长1m的钢杆在10kN拉力下的应力和变形",
      "求一个RC低通滤波器（R=1kΩ，C=100nF）的截止频率",
      "计算三相异步电动机的额定转矩（P=22kW，n=1450rpm）",
    ]},
    { icon: "🔧", label: "故障诊断", examples: [
      "三相电机启动后转速达不到额定值，可能的原因有哪些？",
      "液压系统压力不稳定的常见原因及排查思路是什么？",
      "数控机床出现坐标偏移，如何系统排查原因？",
    ]},
  ],
  "文科": [
    { icon: "📊", label: "学科知识解析", examples: [
      "请解析中国古代科举制度对封建社会阶层流动的影响",
      "解释启蒙运动的核心思想及其对现代政治制度的贡献",
      "请系统讲解现代汉语词类的划分标准及常见误用",
    ]},
    { icon: "✏️", label: "习题生成", examples: [
      "为高考历史生成5道关于近代中国民族危机的材料分析题",
      "生成3道考查现代文阅读理解的综合练习题，含参考答案",
      "针对政治哲学，生成4道辨析题并给出评分要点",
    ]},
    { icon: "🌟", label: "知识记忆", examples: [
      "帮我用时间轴记忆法整理中国近代史重大事件（1840-1949）",
      "请设计一个记忆文言文实词虚词的联想口诀",
      "用思维导图框架帮我记住西方哲学史的主要流派",
    ]},
    { icon: "📖", label: "文学分析", examples: [
      "分析《红楼梦》中贾宝玉的人物形象及其时代意义",
      "比较《哈姆雷特》与《麦克白》在主题表达上的异同",
      "解析鲁迅《狂人日记》中的象征主义手法及批判意图",
    ]},
    { icon: "✍️", label: "写作辅导", examples: [
      "请批改这篇议论文并指出逻辑结构问题：人工智能对教育的影响...",
      "帮我改写这段学术摘要，使其更简洁专业",
      "为这个论点补充3条有力论据：教育公平是社会进步的基石",
    ]},
  ],
  "计算机": [
    { icon: "📊", label: "学科知识解析", examples: [
      "请解析TCP/IP四层模型各层的职责及典型协议",
      "解释操作系统进程调度算法（FCFS、SJF、轮转）的工作原理",
      "请系统讲解关系型数据库的范式理论及实际应用",
    ]},
    { icon: "✏️", label: "习题生成", examples: [
      "为数据结构课程生成5道关于树遍历和图搜索的编程练习题",
      "生成3道操作系统死锁相关的分析判断题，附解析",
      "针对计算机网络，生成4道子网划分计算题",
    ]},
    { icon: "📚", label: "学习路径规划", examples: [
      "为零基础学员制定一份3个月的Python全栈开发学习计划",
      "帮我规划备战大厂算法面试的3个月强化训练路径",
      "为想转型AI工程师的后端开发者规划6个月技能提升路径",
    ]},
    { icon: "🐛", label: "代码调试", examples: [
      "这段Python代码运行时报TypeError，请帮我找出原因并修复",
      "我的React组件状态更新后UI不刷新，可能是什么原因？",
      "SQL查询返回重复数据，请分析这个JOIN语句的问题",
    ]},
    { icon: "⚡", label: "算法分析", examples: [
      "请分析快速排序算法的时间复杂度，并说明最坏情况何时发生",
      "比较Dijkstra与A*算法在最短路径问题上的适用场景",
      "如何将O(n²)暴力搜索的子数组最大和问题优化为O(n)？",
    ]},
  ],
  "医学": [
    { icon: "📊", label: "学科知识解析", examples: [
      "请解析心肌梗死的病理生理机制及与心绞痛的区别",
      "解释抗生素耐药性的形成机制及临床对策",
      "请系统讲解肝脏在代谢中的核心作用及常见肝病机理",
    ]},
    { icon: "✏️", label: "习题生成", examples: [
      "为医学生生成5道关于内分泌系统疾病的病例分析题",
      "生成4道考查神经系统解剖定位的临床思维题，附解析",
      "针对药理学，生成3道β受体阻滞剂临床应用的判断题",
    ]},
    { icon: "🌟", label: "知识记忆", examples: [
      "帮我用口诀记住十二对脑神经的名称和功能",
      "请设计记忆常见抗生素分类及代表药物的联想方法",
      "用思维导图框架帮我记住急性心肌梗死的诊断和处理流程",
    ]},
    { icon: "🔬", label: "病理分析", examples: [
      "请解释2型糖尿病的胰岛素抵抗机制及其病理进展",
      "阿尔茨海默症的神经病理学特征有哪些？与血管性痴呆如何鉴别？",
      "肝硬化的病理分期及各期主要临床表现是什么？",
    ]},
    { icon: "🏥", label: "临床案例", examples: [
      "患者男性55岁，突发胸痛伴左臂放射痛，请分析可能的诊断及处理",
      "一位患者出现多饮多尿消瘦，鉴别诊断思路是什么？",
      "分析儿童反复发热伴关节肿痛的鉴别诊断路径",
    ]},
  ],
};

// ─── Mock responses ───────────────────────────────────────────────────────────

function getMockResponse(model: string, text: string): string {
  const caps = MODEL_CAPS[model] ?? [];
  for (const cap of caps) {
    if (cap.examples.includes(text)) {
      const responses: Record<string, string> = {
        "文本生成": '好的！以下是为您生成的内容：\n\n**春节——中国最重要的传统节日**\n\n春节，俗称"过年"，是中国农历新年，也是中华民族最隆重的传统节日。每逢除夕，家家户户张灯结彩，贴春联、放鞭炮，阖家团圆围坐吃年夜饭。正月初一，人们互道"新年快乐"，拜年祝福，长辈给晚辈发红包，寓意吉祥如意、岁岁平安。',
        "中英互译": "翻译结果如下：\n\n**Artificial intelligence is profoundly transforming every aspect of human society.**\n\n✓ 翻译完成，语义准确，语言地道。如需调整风格（正式/口语），请告知。",
        "情感分析": "**情感分析报告**\n\n- 整体情感：**正面** ✅\n- 情感强度：**强烈**（置信度 96.8%）\n- 关键情感词：「太棒了」「停不下来」→ 高满意度表达\n- 情感类别：喜悦 · 惊喜 · 满足",
        "实体识别": "**实体识别结果**\n\n| 实体文本 | 实体类型 | 置信度 |\n|--------|---------|-------|\n| 马云 | 人名（PER）| 99% |\n| 1999年 | 时间（TIME）| 98% |\n| 杭州 | 地名（LOC）| 99% |\n| 阿里巴巴集团 | 组织（ORG）| 99% |",
        "问答系统": "**量子纠缠（Quantum Entanglement）**\n\n量子纠缠是指两个或多个粒子之间存在一种特殊的量子关联，无论相距多远，对其中一个粒子的测量都会瞬间影响另一个粒子的状态。\n\n**在量子计算中的应用：**\n- 量子隐形传态：传输量子态信息\n- 量子密钥分发：实现理论上无法破解的加密\n- 量子纠错：提高量子计算的容错能力",
        "文本摘要": "**摘要结果**\n\n大语言模型基于Transformer架构，通过海量数据预训练习得语言规律，GPT、LLaMA、GLM等代表性模型的相继出现将NLP技术推向新高度。\n\n📊 压缩率：约 58% | 关键信息保留：✓",
        "逻辑推理": "**推理过程：**\n\n1. 前提一：所有哺乳动物 → 恒温动物\n2. 前提二：鲸鱼 → 哺乳动物\n3. 由三段论推导：鲸鱼 → 恒温动物 ✅\n\n**结论**：是的，鲸鱼是恒温动物。鲸鱼虽然生活在海洋中，但作为哺乳动物，它能通过新陈代谢维持恒定的体温（约36-37°C）。",
      };
      return responses[cap.label] ?? `您好！我是${model}，已收到您的问题，正在深度分析中...\n\n${text}\n\n以上是针对您问题的分析结果，如需进一步了解，请继续提问。`;
    }
  }
  return `您好！我是**${model}**，很高兴为您服务。\n\n您的问题已收到，正在为您深度分析：\n\n> ${text}\n\n这是一个很好的问题。基于我的训练数据和专业能力，我为您提供以下分析与解答...\n\n如需更详细的说明，请继续追问。`;
}

// ─── API Drawer ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1"
      style={{ fontSize: 12, color: copied ? "#16a34a" : "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 5, padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}>
      {copied ? <CheckIcon size={11} color="#16a34a" /> : <Copy size={11} />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function ApiDrawer({ model, category, onClose }: { model: string; category: Category; onClose: () => void }) {
  const modelKey = `${model.toLowerCase().replace(/\s+/g, "-")}:10042:1781192133306`;
  const endpoint = "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions";

  const row = (label: string, content: React.ReactNode, copyText?: string) => (
    <div className="flex items-start" style={{ padding: "12px 0", borderBottom: "1px solid #f5f7fa" }}>
      <div style={{ width: 88, fontSize: 12.5, color: "#9ca3af", flexShrink: 0, paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13 }}>{content}</div>
      {copyText && <CopyBtn text={copyText} />}
    </div>
  );

  const tag = (t: string) => (
    <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 10px", borderRadius: 5, background: "#eff4ff", color: "#4f6ef7", border: "1px solid #c7d9ff", marginRight: 6 }}>{t}</span>
  );

  const PARAMS = [
    { name: "model",       type: "string",  req: true,  desc: `模型标识，固定值 "${modelKey}"` },
    { name: "messages",    type: "array",   req: true,  desc: "对话历史，每项含 role（system/user/assistant）与 content" },
    { name: "temperature", type: "float",   req: false, desc: "生成随机性，范围 0–1，默认 0.7" },
    { name: "stream",      type: "boolean", req: false, desc: "是否启用 SSE 流式返回，默认 true" },
    { name: "max_tokens",  type: "integer", req: false, desc: "最大生成 token 数，不填使用模型默认上限" },
  ];

  const curlCode = `curl ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '{\n    "model": "${modelKey}",\n    "messages": [{"role": "user", "content": "你好"}],\n    "stream": true\n  }'`;

  const thSt: React.CSSProperties = { padding: "9px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#9ca3af", borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" };
  const tdSt: React.CSSProperties = { padding: "10px 12px", fontSize: 12.5, borderBottom: "1px solid #f5f7fa", verticalAlign: "top" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "16px 20px", borderBottom: "1px solid #f0f2f7" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>API 说明</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{model}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "16px 20px" }}>
          {/* 基础信息 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", marginBottom: 12 }}>接口基础信息</div>
          <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, padding: "0 14px", marginBottom: 24 }}>
            {row("请求地址", <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>{endpoint}</span>, endpoint)}
            {row("请求方式", <span style={{ fontSize: 12.5, fontWeight: 600, background: "#eff4ff", color: "#4f6ef7", padding: "2px 8px", borderRadius: 4 }}>POST</span>)}
            {row("请求Header",
              <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.9 }}>
                <div>Authorization: Bearer YOUR_API_KEY</div>
                <div>Content-Type: application/json</div>
              </div>,
              "Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json"
            )}
            {row("Model Key", <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f0f4ff", color: "#4f6ef7", padding: "3px 8px", borderRadius: 4, border: "1px solid #c7d9ff" }}>{modelKey}</span>, modelKey)}
            {row("调用方式", tag("SSE流式调用"))}
            {row("支持特性", <>{tag("多轮对话")}{tag("工具调用")}</>)}
          </div>

          {/* CURL 示例 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", marginBottom: 12 }}>CURL 调用示例</div>
          <div style={{ background: "#1a1d2e", borderRadius: 10, marginBottom: 24, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>bash</span>
              <CopyBtn text={curlCode} />
            </div>
            <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, color: "#e2e8f0", fontFamily: "monospace", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{curlCode}</pre>
          </div>

          {/* 参数说明 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", marginBottom: 12 }}>核心请求参数</div>
          <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8f9fc" }}>
                {["参数名","类型","必填","说明"].map(h => <th key={h} style={thSt}>{h}</th>)}
              </tr></thead>
              <tbody>
                {PARAMS.map(p => (
                  <tr key={p.name}>
                    <td style={tdSt}><code style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600 }}>{p.name}</code></td>
                    <td style={tdSt}><span style={{ fontFamily: "monospace", fontSize: 11.5, background: "#f3f4f6", color: "#6b7280", borderRadius: 3, padding: "1px 6px" }}>{p.type}</span></td>
                    <td style={{ ...tdSt, fontWeight: 600, color: p.req ? "#dc2626" : "#9ca3af" }}>{p.req ? "是" : "否"}</td>
                    <td style={{ ...tdSt, color: "#374151" }}>{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Message { id: number; role: "user" | "assistant"; content: string; }

export function ModelExperiencePage() {
  const [category, setCategory]           = useState<Category>("预训练模型");
  const [model, setModel]                 = useState(EDU_MODEL);
  const [catOpen, setCatOpen]             = useState(false);
  const [modelOpen, setModelOpen]         = useState(false);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [activeCap, setActiveCap]         = useState<string | null>(null);
  const [showApi, setShowApi]             = useState(false);
  const [eduSubModel, setEduSubModel]     = useState<EduSubModel>("通用");

  const bottomRef    = useRef<HTMLDivElement>(null);
  const catRef       = useRef<HTMLDivElement>(null);
  const modelRef     = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const stopRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (catRef.current   && !catRef.current.contains(e.target as Node))   setCatOpen(false);
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const switchModel = (newCat: Category, newModel: string) => {
    setCategory(newCat); setModel(newModel);
    setCatOpen(false); setModelOpen(false);
    setMessages([]); setInput(""); setActiveCap(null); setEduSubModel("通用");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const isEduModel = model === EDU_MODEL;
  const currentCaps = category === "预训练模型"
    ? (isEduModel ? (EDU_CAPS[eduSubModel] ?? []) : (MODEL_CAPS[model] ?? []))
    : [];
  const selectedCapObj = currentCaps.find(c => c.label === activeCap);

  const stop = () => {
    if (stopRef.current) { clearTimeout(stopRef.current); stopRef.current = null; }
    setLoading(false);
  };

  const send = (text = input.trim()) => {
    if (!text || loading) return;
    setMessages(m => [...m, { id: Date.now(), role: "user", content: text }]);
    setInput(""); setActiveCap(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    stopRef.current = setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + 1, role: "assistant", content: getMockResponse(model, text) }]);
      setLoading(false);
      stopRef.current = null;
    }, 900);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const dropBtn = (label: string, open: boolean, ref: React.RefObject<HTMLDivElement>, toggle: () => void) => (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={toggle} className="flex items-center gap-1.5"
        style={{ height: 32, padding: "0 12px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
        {label} {open ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
      </button>
    </div>
  );

  const menuItem = (label: string, selected: boolean, onClick: () => void) => (
    <div key={label} onClick={onClick}
      style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: selected ? "#4f6ef7" : "#374151", fontWeight: selected ? 600 : 400, background: selected ? "#f5f8ff" : "#fff" }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selected ? "#f5f8ff" : "#fff"; }}>
      {label}
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-shrink-0" style={{ padding: "12px 24px 0", fontSize: 13, color: "#9ca3af" }}>
        <span style={{ color: "#4f6ef7" }}>体验中心</span>
        <span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>模型体验</span>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "10px 24px 0" }}>
        {/* Left: two-level dropdowns */}
        <div className="flex items-center gap-2">
          {/* Level 1 */}
          {dropBtn(category, catOpen, catRef, () => { setCatOpen(o => !o); setModelOpen(false); })}
          {catOpen && (
            <div style={{ position: "fixed", top: catRef.current ? catRef.current.getBoundingClientRect().bottom + 6 : 120, left: catRef.current ? catRef.current.getBoundingClientRect().left : 24, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200, minWidth: 150, maxHeight: "60vh", overflowY: "auto" }}>
              {(Object.keys(CATEGORY_MODELS) as Category[]).map(c => menuItem(c, c === category, () => switchModel(c, CATEGORY_MODELS[c][0])))}
            </div>
          )}

          {/* Level 2 */}
          {dropBtn(model, modelOpen, modelRef, () => { setModelOpen(o => !o); setCatOpen(false); })}
          {modelOpen && (
            <div style={{ position: "fixed", top: modelRef.current ? modelRef.current.getBoundingClientRect().bottom + 6 : 120, left: modelRef.current ? modelRef.current.getBoundingClientRect().left : 180, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200, minWidth: 220, maxHeight: "60vh", overflowY: "auto" }}>
              {CATEGORY_MODELS[category].map(m => menuItem(m, m === model, () => switchModel(category, m)))}
            </div>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5"
            title="本版本暂无此功能"
            style={{ height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#9ca3af", background: "#f8f9fc", border: "1px solid #e8ebf2", borderRadius: 7, cursor: "not-allowed" }}>
            <GitCompare size={13} /> 模型对比
          </button>
          <button onClick={() => setShowApi(true)} className="flex items-center gap-1.5"
            style={{ height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <BookOpen size={13} /> API说明
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "12px 24px 0" }}>
        <div className="flex-1 overflow-auto">
          {messages.length === 0 ? (
            /* Welcome */
            <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: 200, paddingBottom: 16 }}>
              <div className="flex items-center justify-center rounded-2xl mb-4 flex-shrink-0"
                style={{ width: 56, height: 56, background: CATEGORY_COLOR[category] }}>
                {CATEGORY_ICON[category]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1d23", textAlign: "center" }}>
                欢迎使用 <span style={{ color: "#4f6ef7" }}>{model}</span>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>请在下方输入问题，帮你深度解答</div>

              {/* Education sub-model tabs */}
              {isEduModel && (
                <div className="flex items-center gap-1.5 flex-wrap justify-center" style={{ marginTop: 16 }}>
                  {EDU_SUB_MODELS.map(sub => (
                    <button key={sub} onClick={() => { setEduSubModel(sub); setActiveCap(null); setMessages([]); }}
                      style={{
                        padding: "6px 18px", fontSize: 14, fontWeight: sub === eduSubModel ? 600 : 400,
                        borderRadius: 7, border: "none", cursor: "pointer", transition: "all 0.15s",
                        background: sub === eduSubModel ? "#4f6ef7" : "#f0f2f7",
                        color: sub === eduSubModel ? "#fff" : "#374151",
                      }}
                      onMouseEnter={e => { if (sub !== eduSubModel) (e.currentTarget as HTMLButtonElement).style.background = "#e0e3ed"; }}
                      onMouseLeave={e => { if (sub !== eduSubModel) (e.currentTarget as HTMLButtonElement).style.background = "#f0f2f7"; }}>
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Messages */
            <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 0 }}>
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    /* User: dark bubble, right-aligned */
                    <div className="flex justify-end" style={{ marginBottom: 16 }}>
                      <div style={{
                        maxWidth: "72%", padding: "11px 16px", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap",
                        borderRadius: "16px 4px 16px 16px",
                        background: "#1a1d23", color: "#f0f2ff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}>{msg.content}</div>
                    </div>
                  ) : (
                    /* Assistant: plain text, no bubble */
                    <div className="flex items-start gap-3" style={{ marginBottom: 24 }}>
                      <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 28, height: 28, background: CATEGORY_COLOR[category], marginTop: 2 }}>
                        <div style={{ transform: "scale(0.8)" }}>{CATEGORY_ICON[category]}</div>
                      </div>
                      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.85, color: "#1a1d23", whiteSpace: "pre-wrap", paddingTop: 4 }}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 28, height: 28, background: CATEGORY_COLOR[category], marginTop: 2 }}>
                    <div style={{ transform: "scale(0.8)" }}>{CATEGORY_ICON[category]}</div>
                  </div>
                  <div style={{ paddingTop: 10 }} className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9ca3af", animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {/* Sub-model tabs in chat mode */}
        {isEduModel && messages.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0" style={{ padding: "8px 0 0" }}>
            {EDU_SUB_MODELS.map(sub => (
              <button key={sub} onClick={() => { setEduSubModel(sub); setActiveCap(null); setMessages([]); setInput(""); }}
                style={{
                  padding: "5px 14px", fontSize: 13, fontWeight: sub === eduSubModel ? 600 : 400,
                  borderRadius: 6, border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: sub === eduSubModel ? "#4f6ef7" : "#f0f2f7",
                  color: sub === eduSubModel ? "#fff" : "#374151",
                }}>
                {sub}
              </button>
            ))}
          </div>
        )}
        <div style={{ flexShrink: 0, paddingBottom: 4 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e0e3ed", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "12px 14px 10px" }}>
            <textarea ref={textareaRef} value={input} onChange={autoResize} onKeyDown={onKeyDown}
              placeholder="输入问题，帮你深度解答（Enter 发送，Shift+Enter 换行）"
              rows={1}
              style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: "#1a1d23", lineHeight: 1.7, resize: "none", background: "transparent", fontFamily: "inherit", maxHeight: 160, overflow: "auto" }} />
            <div className="flex items-center justify-end" style={{ marginTop: 6 }}>
              {loading ? (
                /* Stop button */
                <button onClick={stop}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #6b7280", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1d23"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6b7280"; }}>
                  <Square size={13} color="#374151" fill="#374151" />
                </button>
              ) : (
                /* Send button */
                <button onClick={() => send()} disabled={!input.trim()}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    cursor: input.trim() ? "pointer" : "not-allowed",
                    background: input.trim() ? "#1a1d23" : "#e8ebf2",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
                  }}>
                  <ArrowUp size={15} color={input.trim() ? "#fff" : "#9ca3af"} />
                </button>
              )}
            </div>
          </div>

          {/* Capability tags — only for 预训练模型 */}
          {messages.length === 0 && currentCaps.length > 0 && (
            <div style={{ padding: "14px 0 16px" }}>
              <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 10 }}>试试以下强大能力：</div>

              {/* Tags row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {currentCaps.map(cap => {
                  const isActive = activeCap === cap.label;
                  return (
                    <button key={cap.label}
                      onClick={() => setActiveCap(isActive ? null : cap.label)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
                        fontSize: 13, borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
                        border: `1px solid ${isActive ? "#4f6ef7" : "#e0e3ed"}`,
                        background: isActive ? "#eff4ff" : "#fff",
                        color: isActive ? "#4f6ef7" : "#374151",
                        fontWeight: isActive ? 500 : 400,
                      }}>
                      <span>{cap.icon}</span>{cap.label}
                      {isActive ? <ChevronUp size={12} /> : <ChevronDown size={12} color="#9ca3af" />}
                    </button>
                  );
                })}
              </div>

              {/* Examples for selected cap */}
              {selectedCapObj && (
                <div style={{ background: "#f8f9fc", borderRadius: 10, border: "1px solid #e8ebf2", padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, fontWeight: 500 }}>
                    {selectedCapObj.icon} {selectedCapObj.label} — 选择一个示例：
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedCapObj.examples.map((ex, i) => (
                      <button key={i} onClick={() => { setInput(ex); setActiveCap(null); textareaRef.current?.focus(); }}
                        className="flex items-start gap-2 text-left rounded-lg"
                        style={{ padding: "9px 12px", fontSize: 12.5, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, cursor: "pointer", transition: "all 0.15s", lineHeight: 1.6 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#4f6ef7"; (e.currentTarget as HTMLButtonElement).style.color = "#4f6ef7"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0e3ed"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}>
                        <span style={{ color: "#c7d5ff", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showApi && <ApiDrawer model={model} category={category} onClose={() => setShowApi(false)} />}

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }`}</style>
    </div>
  );
}
