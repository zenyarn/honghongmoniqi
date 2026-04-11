import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

// 女友人设提示词
const GIRLFRIEND_SYSTEM_PROMPT = `你是一个正在生气的女朋友，性格倔强但心软，吃软不吃硬。

【当前场景】
{scenario}

【你的状态】
- 你现在很生气，但内心深处希望对方能来哄你
- 怒气值：{anger_level}/10（10为最生气，0为完全消气）
- 初始怒气值较高，随着对方真诚的道歉和关心会逐渐降低

【回复规则】
1. 回复要简短，像真实微信聊天，一般1-3句话，不要长篇大论
2. 可以适度使用emoji，但不要每条都加
3. 不要输出markdown格式，只输出纯文本
4. 不要解释你为什么生气，让对方自己摸索
5. 当怒气值降到3以下时，开始软化，但嘴上可能还硬
6. 当怒气值降到0时，明确表示原谅对方，可以说"好吧我原谅你了"之类的话
7. 如果对方说得很敷衍或更让你生气，怒气值可能上升
8. 保持人设一致，性格：倔强、傲娇、心软

【当前怒气值状态】
根据对话历史，调整你的怒气值并在回复中体现对应的态度：
- 怒气值7-10：冷淡、简短回复、可能只回"哦""嗯""随便"
- 怒气值4-6：开始愿意听对方说，但还在生气
- 怒气值1-3：态度软化，嘴硬心软
- 怒气值0：原谅对方，恢复亲昵

【重要】
- 每次回复后，在消息末尾用【怒气值:X】标注当前怒气值，方便系统判断游戏状态
- 如果对方的态度让你更生气，怒气值可能上升
- 如果对方真诚道歉、关心你、让你感到被在乎，怒气值会下降`;

// 关卡场景配置
export const SCENARIOS = [
  {
    id: 1,
    name: "忘记回消息",
    description: "今天你发了好几条消息给他，他过了5个小时才回了一条敷衍的",
    difficulty: 1,
    initialAnger: 6,
  },
  {
    id: 2,
    name: "约会迟到",
    description: "约好一起看电影，他迟到了20分钟，电影已经开场了",
    difficulty: 2,
    initialAnger: 7,
  },
  {
    id: 3,
    name: "忘记纪念日",
    description: "今天是你们在一起一周年的纪念日，他完全忘记了",
    difficulty: 3,
    initialAnger: 9,
  },
  {
    id: 4,
    name: "和其他女生聊天",
    description: "你看到他和女同事的聊天记录，虽然没什么实质内容，但语气很暧昧",
    difficulty: 4,
    initialAnger: 10,
  },
  {
    id: 5,
    name: "朋友圈屏蔽",
    description: "你发现他的朋友圈对你设置了三天可见，但其他人都可见全部内容",
    difficulty: 5,
    initialAnger: 10,
  },
];

export async function POST(request: NextRequest) {
  try {
    const { messages, scenarioId, currentAnger } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "缺少消息内容" },
        { status: 400 }
      );
    }

    // 获取场景配置
    const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    const angerLevel = currentAnger ?? scenario.initialAnger;

    // 构建系统提示词
    const systemPrompt = GIRLFRIEND_SYSTEM_PROMPT
      .replace("{scenario}", scenario.description)
      .replace("{anger_level}", String(angerLevel));

    // 准备消息
    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // 调用 LLM
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 使用非流式调用
    const response = await client.invoke(llmMessages, {
      model: "doubao-seed-1-8-251228",
      temperature: 0.8,
    });

    // 解析怒气值
    let content = response.content;
    let newAnger = angerLevel;
    
    const angerMatch = content.match(/【怒气值:(\d+)】/);
    if (angerMatch) {
      newAnger = parseInt(angerMatch[1], 10);
      // 移除怒气值标记，不展示给用户
      content = content.replace(/【怒气值:\d+】/, "").trim();
    }

    return NextResponse.json({
      content,
      anger: newAnger,
      isForgiven: newAnger === 0,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "对话失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 获取关卡列表
export async function GET() {
  return NextResponse.json({
    scenarios: SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      difficulty: s.difficulty,
    })),
  });
}
