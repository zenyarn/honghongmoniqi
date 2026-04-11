import { NextRequest, NextResponse } from "next/server";
import { ASRClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "缺少音频文件" },
        { status: 400 }
      );
    }

    // 将音频文件转为 base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 调用 ASR
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new ASRClient(config, customHeaders);

    const result = await client.recognize({
      uid: "girlfriend-simulator",
      base64Data,
    });

    return NextResponse.json({
      text: result.text,
    });
  } catch (error) {
    console.error("ASR API error:", error);
    return NextResponse.json(
      { error: "语音识别失败" },
      { status: 500 }
    );
  }
}
