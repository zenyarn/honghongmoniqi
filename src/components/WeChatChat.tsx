"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Send, Mic, Volume2, VolumeX, RotateCcw, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// 消息类型
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUri?: string;
}

// 关卡类型
interface Scenario {
  id: number;
  name: string;
  difficulty: number;
}

// 游戏状态
type GameState = "menu" | "playing" | "success" | "failed";

// 从 API 获取的关卡列表
const DEFAULT_SCENARIOS: Scenario[] = [
  { id: 1, name: "忘记回消息", difficulty: 1 },
  { id: 2, name: "约会迟到", difficulty: 2 },
  { id: 3, name: "忘记纪念日", difficulty: 3 },
  { id: 4, name: "和其他女生聊天", difficulty: 4 },
  { id: 5, name: "朋友圈屏蔽", difficulty: 5 },
];

// 用户类型
interface User {
  id: number;
  username: string;
}

export default function WeChatChat() {
  // 用户状态
  const [user, setUser] = useState<User | null>(null);

  // 游戏状态
  const [gameState, setGameState] = useState<GameState>("menu");
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [anger, setAnger] = useState(6);
  const [messageCount, setMessageCount] = useState(0);
  const MAX_MESSAGES = 15;

  // 聊天状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [recordSaved, setRecordSaved] = useState(false);

  // 保存游戏记录
  const saveGameRecord = async (isSuccess: boolean) => {
    if (!user || !currentScenario || recordSaved) return;

    try {
      await fetch("/api/game-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          scenario: currentScenario.name,
          finalScore: anger,
          result: isSuccess ? "success" : "failed",
        }),
      });
      setRecordSaved(true);
    } catch (error) {
      console.error("保存游戏记录失败:", error);
    }
  };

  // refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 获取关卡列表
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => {
        if (data.scenarios) {
          setScenarios(data.scenarios);
        }
      })
      .catch(console.error);
  }, []);

  // 初始化用户状态
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 开始游戏
  const startGame = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    setGameState("playing");
    setMessages([]);
    setAnger(6 + scenario.difficulty);
    setMessageCount(0);
    setInputText("");

    // 添加初始消息
    setTimeout(() => {
      setMessages([
        {
          id: "initial",
          role: "assistant",
          content: "...",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(true);

      // 获取第一条消息
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          scenarioId: scenario.id,
          currentAnger: 6 + scenario.difficulty,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMessages([
            {
              id: "initial",
              role: "assistant",
              content: data.content,
              timestamp: new Date(),
            },
          ]);
          setAnger(data.anger);
          setIsTyping(false);
        })
        .catch(() => {
          setMessages([
            {
              id: "initial",
              role: "assistant",
              content: "哼，你终于想起找我了吗？😒",
              timestamp: new Date(),
            },
          ]);
          setIsTyping(false);
        });
    }, 500);
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setMessageCount((prev) => prev + 1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          scenarioId: currentScenario?.id,
          currentAnger: anger,
        }),
      });

      const data = await response.json();

      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setAnger(data.anger);
      setIsTyping(false);

      // 检查游戏状态
      if (data.isForgiven) {
        setTimeout(async () => {
          setGameState("success");
          if (currentScenario && currentScenario.id >= unlockedLevel) {
            setUnlockedLevel(currentScenario.id + 1);
          }
          if (user) {
            await saveGameRecord(true);
          }
        }, 1000);
      } else if (messageCount >= MAX_MESSAGES - 1) {
        setTimeout(async () => {
          setGameState("failed");
          if (user) {
            await saveGameRecord(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "...",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 语音识别
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/asr", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (data.text) {
            setInputText(data.text);
          }
        } catch (error) {
          console.error("语音识别失败:", error);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("无法访问麦克风:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 播放语音
  const playAudio = async (messageId: string, text: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null);
      return;
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();

      if (data.audioUri) {
        const audio = new Audio(data.audioUri);
        setPlayingAudio(messageId);
        audio.onended = () => setPlayingAudio(null);
        audio.play();
      }
    } catch (error) {
      console.error("语音播放失败:", error);
    }
  };

  // 返回菜单
  const backToMenu = () => {
    setGameState("menu");
    setMessages([]);
    setCurrentScenario(null);
    setRecordSaved(false);
  };

  // 渲染菜单
  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* 顶部导航栏 */}
          <div className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <h1 className="text-xl font-bold text-gray-800">哄哄模拟器</h1>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1 px-3 py-1 text-sm text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                  >
                    <span>👤</span>
                    <span>{user.username}</span>
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem("user");
                      setUser(null);
                    }}
                    className="px-2 py-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1 text-sm text-pink-500 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1 text-sm text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 主内容区 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 排行榜入口 */}
            <Link
              href="/leaderboard"
              className="block p-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">排行榜</div>
                  <div className="text-sm text-gray-500">查看谁的哄人技术最强</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>

            {/* 恋爱攻略入口 */}
            <Link
              href="/blog"
              className="block p-4 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-lg">📚</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">恋爱攻略</div>
                  <div className="text-sm text-gray-500">学习哄女友的正确姿势</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>

            {/* 副标题 */}
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700">选择关卡</h2>
              <p className="text-sm text-gray-400">练习哄女朋友的正确方式</p>
            </div>
            <div className="divide-y divide-gray-50">
              {scenarios.map((scenario) => {
                const isUnlocked = scenario.id <= unlockedLevel;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => isUnlocked && startGame(scenario)}
                    disabled={!isUnlocked}
                    className={cn(
                      "w-full p-4 flex items-center justify-between transition-colors",
                      isUnlocked
                        ? "hover:bg-pink-50 cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                          isUnlocked
                            ? "bg-gradient-to-br from-pink-400 to-pink-500"
                            : "bg-gray-300"
                        )}
                      >
                        {scenario.id}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-800">
                          {scenario.name}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                i < scenario.difficulty
                                  ? "bg-pink-400"
                                  : "bg-gray-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-5 h-5",
                        isUnlocked ? "text-gray-400" : "text-gray-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            通过哄好女朋友解锁更多关卡
          </p>
        </div>
      </div>
    );
  }

  // 渲染游戏界面
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* 手机框架 */}
      <div className="w-full max-w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        {/* 状态栏 */}
        <div className="h-11 bg-gray-50 flex items-center justify-between px-6 text-xs text-gray-600">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-gray-400 rounded-sm">
              <div className="w-3/4 h-full bg-gray-600 rounded-sm" />
            </div>
          </div>
        </div>

        {/* 导航栏 */}
        <div className="h-12 bg-gray-50 flex items-center justify-between px-4 border-b border-gray-200">
          <button
            onClick={backToMenu}
            className="text-pink-500 text-sm flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            返回
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src="/girlfriend-avatar.png"
                alt="女朋友"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="font-medium text-gray-800">女朋友</span>
          </div>
          <div className="w-8" />
        </div>

        {/* 怒气值指示器 */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>怒气值</span>
            <span>
              {messageCount}/{MAX_MESSAGES} 回合
            </span>
          </div>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                anger <= 3
                  ? "bg-green-400"
                  : anger <= 6
                  ? "bg-yellow-400"
                  : "bg-red-400"
              )}
              style={{ width: `${(anger / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* 聊天区域 */}
        <div
          ref={scrollRef}
          className="flex-1 bg-gray-50 overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* 女友头像 */}
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src="/girlfriend-avatar.png"
                      alt="女朋友"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[65%] rounded-2xl px-3 py-2 relative",
                    message.role === "user"
                      ? "bg-green-500 text-white rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none shadow-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words pr-6">
                    {message.content}
                  </p>
                  {/* TTS 播放按钮 - 始终显示在右下角 */}
                  {message.role === "assistant" && (
                    <button
                      onClick={() => playAudio(message.id, message.content)}
                      className="absolute bottom-1 right-1.5 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                      title="播放语音"
                    >
                      {playingAudio === message.id ? (
                        <VolumeX className="w-4 h-4 text-pink-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-pink-400 hover:text-pink-500" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src="/girlfriend-avatar.png"
                    alt="女朋友"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                <div className="bg-white text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <span className="text-sm">对方正在输入...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="bg-gray-50 border-t border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isRecording
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="说点什么哄哄她..."
              className="flex-1 h-10 bg-white rounded-full px-4 text-sm border border-gray-200 focus:outline-none focus:border-pink-300"
              disabled={isLoading || isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading || isTyping}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                inputText.trim() && !isLoading && !isTyping
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-400"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 成功弹窗 */}
      <Dialog open={gameState === "success"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 恭喜！</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <span className="block text-lg text-gray-700 mb-2">你成功哄好了女朋友！</span>
              <span className="block text-gray-500">她已经原谅你了</span>
              {user ? (
                recordSaved && (
                  <span className="block mt-3 text-sm text-green-600 bg-green-50 py-2 px-3 rounded-lg">
                    ✓ 游戏记录已保存
                  </span>
                )
              ) : (
                <span className="block mt-3 text-sm text-blue-600 bg-blue-50 py-2 px-3 rounded-lg">
                  💡 登录后可保存游戏记录
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={backToMenu} className="flex-1">
              返回菜单
            </Button>
            {currentScenario && currentScenario.id < scenarios.length && (
              <Button
                onClick={() => startGame(scenarios[currentScenario.id])}
                className="flex-1 bg-pink-500 hover:bg-pink-600"
              >
                下一关
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 失败弹窗 */}
      <Dialog open={gameState === "failed"} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">💔 很遗憾</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <span className="block text-lg text-gray-700 mb-2">女朋友更生气了...</span>
              <span className="block text-gray-500">她说需要冷静一下，不想再聊了</span>
              {user ? (
                recordSaved && (
                  <span className="block mt-3 text-sm text-green-600 bg-green-50 py-2 px-3 rounded-lg">
                    ✓ 游戏记录已保存
                  </span>
                )
              ) : (
                <span className="block mt-3 text-sm text-blue-600 bg-blue-50 py-2 px-3 rounded-lg">
                  💡 登录后可保存游戏记录
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={backToMenu} className="flex-1">
              返回菜单
            </Button>
            <Button
              onClick={() => currentScenario && startGame(currentScenario)}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              再试一次
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
