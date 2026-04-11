import { NextRequest, NextResponse } from "next/server";
import { TTSClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "缺少文本内容" },
        { status: 400 }
      );
    }

    // 过滤掉括号内的动作描述（支持中英文括号）
    // 例如："（抱着胳膊站在电影院门口）哦。" -> "哦。"
    const cleanText = text
      .replace(/（[^）]*）/g, "") // 中文括号
      .replace(/\([^)]*\)/g, "")  // 英文括号
      .trim();

    // 如果过滤后为空，则使用原文
    const textToSpeak = cleanText || text;

    // 调用 TTS
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 使用女友角色语音
    const response = await client.synthesize({
      uid: "girlfriend-simulator",
      text: textToSpeak,
      speaker: "zh_female_meilinvyou_saturn_bigtts", // 迷人女友音色
      audioFormat: "mp3",
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUri: response.audioUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "语音合成失败" },
      { status: 500 }
    );
  }
}
